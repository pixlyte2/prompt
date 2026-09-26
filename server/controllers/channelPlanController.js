const mongoose = require("mongoose");
const ChannelPlan = require("../models/ChannelPlan");
const Channel = require("../models/channel");
const User = require("../models/user");

const BUCKETS = new Set(["schedule", "backlog", "completed"]);
const COUNT_FIELDS = [
  "longPlanned",
  "longCompleted",
  "shortPlanned",
  "shortCompleted",
];
const MINUTES_FIELDS = ["footageMinutes"];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseChannelIds(query) {
  const raw = query.channelId
    ? [query.channelId]
    : String(query.channelIds || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  const unique = [...new Set(raw)];
  if (unique.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    const error = new Error("Invalid channel filter");
    error.status = 400;
    throw error;
  }
  return unique;
}

function bucketFilter(bucket) {
  if (!BUCKETS.has(bucket)) {
    const error = new Error("Invalid bucket. Use schedule, backlog, or completed.");
    error.status = 400;
    throw error;
  }

  if (bucket === "schedule") {
    return {
      status: { $ne: "completed" },
      scheduledDate: { $ne: null, $exists: true },
    };
  }
  if (bucket === "backlog") {
    return {
      status: { $ne: "completed" },
      $or: [
        { scheduledDate: null },
        { scheduledDate: { $exists: false } },
      ],
    };
  }
  return { status: "completed" };
}

function buildFilter(req, bucket) {
  const filter = bucketFilter(bucket);
  const channelIds = parseChannelIds(req.query);
  if (channelIds.length === 1) filter.channelId = channelIds[0];
  if (channelIds.length > 1) filter.channelId = { $in: channelIds };

  const search = String(req.query.search || "").trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    const matchers = [{ title: pattern }, { notes: pattern }];
    const planId = Number.parseInt(search.replace(/^#/, ""), 10);
    if (Number.isInteger(planId)) matchers.push({ planId });
    filter.$and = [{ $or: matchers }];
  }
  return filter;
}

async function companyChannelIds(req) {
  const channels = await Channel.find({ companyId: req.user.companyId })
    .select("_id")
    .lean();
  return channels.map((channel) => channel._id);
}

async function scopeFilterToCompany(req, filter) {
  const allowedIds = await companyChannelIds(req);
  const allowed = new Set(allowedIds.map(String));
  const requested = parseChannelIds(req.query);
  if (requested.some((id) => !allowed.has(id))) {
    const error = new Error("Channel not found");
    error.status = 404;
    throw error;
  }
  filter.channelId =
    requested.length === 1 ? requested[0] : { $in: requested.length ? requested : allowedIds };
  return filter;
}

function thumbnailDataUrl(file) {
  if (!file) return undefined;
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

function parseCount(value, field) {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    const error = new Error(`${field} must be a non-negative integer`);
    error.status = 400;
    throw error;
  }
  return number;
}

function parseMinutes(value, field) {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${field} must be a non-negative number`);
    error.status = 400;
    throw error;
  }
  return number;
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(date = new Date()) {
  const value = startOfDay(date);
  value.setDate(value.getDate() + 1);
  return value;
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthLabel(year, month) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

function enumerateMonths(from, to) {
  const months = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor <= end) {
    months.push({
      key: monthKey(cursor.getFullYear(), cursor.getMonth() + 1),
      year: cursor.getFullYear(),
      month: cursor.getMonth() + 1,
      label: monthLabel(cursor.getFullYear(), cursor.getMonth() + 1),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/** Accepts real booleans (JSON) and "true"/"false" strings (multipart form data). */
function parseBoolean(value, field) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false" || normalized === "") return false;
  const error = new Error(`${field} must be true or false`);
  error.status = 400;
  throw error;
}

function parseDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("scheduledDate must be a valid date");
    error.status = 400;
    throw error;
  }
  return date;
}

async function validateReferences(channelId, assignedTo, req) {
  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    const error = new Error("A valid channelId is required");
    error.status = 400;
    throw error;
  }

  const channel = await Channel.findOne({
    _id: channelId,
    companyId: req.user.companyId,
  }).lean();
  if (!channel) {
    const error = new Error("Channel not found");
    error.status = 404;
    throw error;
  }

  if (assignedTo) {
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      const error = new Error("Invalid assignee");
      error.status = 400;
      throw error;
    }
    const user = await User.findOne({
      _id: assignedTo,
      companyId: req.user.companyId,
      role: "content_manager",
      active: { $ne: false },
    }).lean();
    if (!user) {
      const error = new Error("Content manager not found");
      error.status = 404;
      throw error;
    }
  }
}

function sendError(res, label, error) {
  console.error(`${label}:`, error.message);
  return res
    .status(error.status || (error.name === "ValidationError" ? 400 : 500))
    .json({ message: error.message || "Request failed" });
}

exports.getStats = async (req, res) => {
  try {
    const channelIds = parseChannelIds(req.query);
    const allowedIds = await companyChannelIds(req);
    const allowed = new Set(allowedIds.map(String));
    if (channelIds.some((id) => !allowed.has(id))) {
      return res.status(404).json({ message: "Channel not found" });
    }
    const match = {
      channelId: {
        $in: channelIds.length
          ? channelIds.map((id) => new mongoose.Types.ObjectId(id))
          : allowedIds,
      },
    };

    const [stats] = await ChannelPlan.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          schedule: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "completed"] },
                    { $eq: [{ $type: "$scheduledDate" }, "date"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          backlog: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "completed"] },
                    { $ne: [{ $type: "$scheduledDate" }, "date"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    const payload = stats
      ? {
          schedule: stats.schedule,
          backlog: stats.backlog,
          completed: stats.completed,
        }
      : { schedule: 0, backlog: 0, completed: 0 };

    const bucket = String(req.query.bucket || "").trim();
    if (BUCKETS.has(bucket)) {
      const bucketFilterQuery = buildFilter(req, bucket);
      delete bucketFilterQuery.channelId;
      bucketFilterQuery.channelId = {
        $in: channelIds.length
          ? channelIds.map((id) => new mongoose.Types.ObjectId(id))
          : allowedIds,
      };
      const channelRows = await ChannelPlan.aggregate([
        { $match: bucketFilterQuery },
        { $group: { _id: "$channelId", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "channels",
            localField: "_id",
            foreignField: "_id",
            as: "channel",
          },
        },
        { $unwind: "$channel" },
        {
          $project: {
            _id: 1,
            name: "$channel.name",
            count: 1,
          },
        },
        { $sort: { name: 1 } },
      ]);
      payload.channels = channelRows.map((row) => ({
        _id: row._id,
        name: row.name,
        count: row.count,
      }));
    }

    return res.json(payload);
  } catch (error) {
    return sendError(res, "getChannelPlanStats", error);
  }
};

exports.getPlans = async (req, res) => {
  try {
    const bucket = String(req.query.bucket || "schedule").trim();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );
    const filter = await scopeFilterToCompany(req, buildFilter(req, bucket));
    const sort =
      bucket === "completed"
        ? { completedAt: -1, updatedAt: -1 }
        : bucket === "backlog"
          ? { updatedAt: -1 }
          : { scheduledDate: 1, createdAt: 1 };

    const plans = await ChannelPlan.find(filter)
      .populate("channelId", "name")
      .populate("assignedTo", "name email")
      .sort(sort)
      .lean();

    const grouped = new Map();
    for (const plan of plans) {
      const dateValue =
        bucket === "completed" ? plan.completedAt || plan.updatedAt : plan.scheduledDate;
      const key =
        bucket === "backlog"
          ? "backlog"
          : new Date(dateValue).toISOString().slice(0, 10);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(plan);
    }

    const allGroups = [...grouped.entries()].map(([date, tasks]) => ({
      date,
      tasks,
      totals: tasks.reduce(
        (totals, task) => ({
          longPlanned: totals.longPlanned + task.longPlanned,
          longCompleted: totals.longCompleted + task.longCompleted,
          shortPlanned: totals.shortPlanned + task.shortPlanned,
          shortCompleted: totals.shortCompleted + task.shortCompleted,
          firstCut: totals.firstCut + (task.firstCut ? 1 : 0),
        }),
        {
          longPlanned: 0,
          longCompleted: 0,
          shortPlanned: 0,
          shortCompleted: 0,
          firstCut: 0,
        },
      ),
    }));

    allGroups.sort((a, b) => {
      if (a.date === "backlog") return 1;
      if (b.date === "backlog") return -1;
      if (bucket === "completed") return b.date.localeCompare(a.date);
      return a.date.localeCompare(b.date);
    });

    const totalGroups = allGroups.length;
    const totalPages = Math.max(1, Math.ceil(totalGroups / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pageGroups = allGroups.slice(start, start + limit);

    return res.json({
      groups: pageGroups,
      pagination: {
        page: safePage,
        limit,
        totalGroups,
        totalPages,
        totalPlans: plans.length,
        totalPlansOnPage: pageGroups.reduce((sum, group) => sum + group.tasks.length, 0),
      },
    });
  } catch (error) {
    return sendError(res, "getChannelPlans", error);
  }
};

exports.createPlan = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ message: "Title is required" });

    const channelId = req.body.channelId;
    const assignedTo = req.body.assignedTo || null;
    await validateReferences(channelId, assignedTo, req);

    const values = {
      title,
      channelId,
      thumbnail: thumbnailDataUrl(req.file) || "",
      scheduledDate: parseDate(req.body.scheduledDate),
      notes: String(req.body.notes || ""),
      assignedTo,
      firstCut: parseBoolean(req.body.firstCut, "firstCut") ?? false,
      status: req.body.status || "todo",
      createdBy: req.user._id || req.user.id,
    };
    for (const field of COUNT_FIELDS) {
      values[field] = parseCount(req.body[field] ?? 0, field);
    }
    for (const field of MINUTES_FIELDS) {
      values[field] = parseMinutes(req.body[field] ?? 0, field);
    }
    if (values.status === "completed") values.completedAt = new Date();

    const plan = await ChannelPlan.create(values);
    await plan.populate([
      { path: "channelId", select: "name" },
      { path: "assignedTo", select: "name email" },
    ]);
    return res.status(201).json(plan);
  } catch (error) {
    return sendError(res, "createChannelPlan", error);
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await ChannelPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Channel plan not found" });
    const allowedIds = await companyChannelIds(req);
    if (!allowedIds.some((id) => String(id) === String(plan.channelId))) {
      return res.status(404).json({ message: "Channel plan not found" });
    }

    const channelId = req.body.channelId ?? String(plan.channelId);
    const assignedTo =
      req.body.assignedTo === undefined
        ? plan.assignedTo
          ? String(plan.assignedTo)
          : null
        : req.body.assignedTo || null;
    await validateReferences(channelId, assignedTo, req);

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ message: "Title is required" });
      plan.title = title;
    }
    plan.channelId = channelId;
    plan.assignedTo = assignedTo;
    if (req.body.scheduledDate !== undefined) {
      plan.scheduledDate = parseDate(req.body.scheduledDate);
    }
    if (req.body.notes !== undefined) plan.notes = String(req.body.notes);
    const firstCut = parseBoolean(req.body.firstCut, "firstCut");
    if (firstCut !== undefined) plan.firstCut = firstCut;
    if (req.file) plan.thumbnail = thumbnailDataUrl(req.file);
    if (req.body.removeThumbnail === "true") plan.thumbnail = "";
    for (const field of COUNT_FIELDS) {
      const value = parseCount(req.body[field], field);
      if (value !== undefined) plan[field] = value;
    }
    for (const field of MINUTES_FIELDS) {
      const value = parseMinutes(req.body[field], field);
      if (value !== undefined) plan[field] = value;
    }
    if (req.body.status !== undefined) {
      const wasCompleted = plan.status === "completed";
      plan.status = req.body.status;
      if (plan.status === "completed" && !wasCompleted) plan.completedAt = new Date();
      if (plan.status !== "completed") plan.completedAt = null;
    }

    await plan.save();
    await plan.populate([
      { path: "channelId", select: "name" },
      { path: "assignedTo", select: "name email" },
    ]);
    return res.json(plan);
  } catch (error) {
    return sendError(res, "updateChannelPlan", error);
  }
};

/**
 * Footage hours grouped by calendar month per channel.
 * Sums footageMinutes grouped by month. All statuses included (open and completed).
 * Uses scheduledDate, or completedAt, or createdAt when unscheduled.
 */
exports.getHoursByMonth = async (req, res) => {
  try {
    const from = req.query.from ? startOfDay(new Date(req.query.from)) : null;
    const to = req.query.to ? endOfDay(new Date(req.query.to)) : null;
    if (!from || !to || from >= to) {
      return res.status(400).json({ message: "Valid from and to dates are required" });
    }

    const channelIds = parseChannelIds(req.query);
    const allowedIds = await companyChannelIds(req);
    const allowed = new Set(allowedIds.map(String));
    if (channelIds.some((id) => !allowed.has(id))) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const scopedChannelIds = channelIds.length
      ? channelIds.map((id) => new mongoose.Types.ObjectId(id))
      : allowedIds;

    const rows = await ChannelPlan.aggregate([
      {
        $match: {
          channelId: { $in: scopedChannelIds },
          footageMinutes: { $gt: 0 },
        },
      },
      {
        $addFields: {
          reportDate: {
            $ifNull: ["$scheduledDate", { $ifNull: ["$completedAt", "$createdAt"] }],
          },
        },
      },
      {
        $match: {
          reportDate: { $gte: from, $lt: to },
        },
      },
      {
        $group: {
          _id: {
            channelId: "$channelId",
            year: { $year: "$reportDate" },
            month: { $month: "$reportDate" },
          },
          footageMinutes: { $sum: { $ifNull: ["$footageMinutes", 0] } },
          planCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "channels",
          localField: "_id.channelId",
          foreignField: "_id",
          as: "channel",
        },
      },
      { $unwind: "$channel" },
      {
        $project: {
          channelId: "$_id.channelId",
          channelName: "$channel.name",
          year: "$_id.year",
          month: "$_id.month",
          footageMinutes: 1,
          planCount: 1,
        },
      },
      { $sort: { channelName: 1, year: 1, month: 1 } },
    ]);

    const monthSlots = enumerateMonths(from, to);
    const byChannel = new Map();

    for (const row of rows) {
      const key = String(row.channelId);
      if (!byChannel.has(key)) {
        byChannel.set(key, {
          channelId: key,
          channelName: row.channelName,
          months: monthSlots.map((slot) => ({
            key: slot.key,
            label: slot.label,
            hours: 0,
            planCount: 0,
          })),
        });
      }
      const channel = byChannel.get(key);
      const slotKey = monthKey(row.year, row.month);
      const slot = channel.months.find((entry) => entry.key === slotKey);
      if (!slot) continue;
      slot.hours = Math.round((row.footageMinutes / 60) * 10) / 10;
      slot.planCount = row.planCount;
    }

    return res.json({
      range: { from: req.query.from, to: req.query.to },
      channels: [...byChannel.values()].sort((a, b) => a.channelName.localeCompare(b.channelName)),
    });
  } catch (error) {
    return sendError(res, "getChannelPlanHoursByMonth", error);
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const allowedIds = await companyChannelIds(req);
    const plan = await ChannelPlan.findOneAndDelete({
      _id: req.params.id,
      channelId: { $in: allowedIds },
    });
    if (!plan) return res.status(404).json({ message: "Channel plan not found" });
    return res.json({ message: "Channel plan deleted" });
  } catch (error) {
    return sendError(res, "deleteChannelPlan", error);
  }
};
