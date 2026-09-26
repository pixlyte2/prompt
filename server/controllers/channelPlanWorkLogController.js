const mongoose = require("mongoose");
const ChannelPlan = require("../models/ChannelPlan");
const ChannelPlanWorkLog = require("../models/ChannelPlanWorkLog");
const Channel = require("../models/channel");

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

async function companyChannelIds(req) {
  if (!req.user?.companyId) return [];
  const companyId = mongoose.Types.ObjectId.isValid(req.user.companyId)
    ? new mongoose.Types.ObjectId(req.user.companyId)
    : req.user.companyId;
  const channels = await Channel.find({ companyId })
    .select("_id name")
    .lean();
  return channels;
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDateKey(key) {
  if (!key) return startOfDay();
  const match = String(key).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const error = new Error("logDate must be YYYY-MM-DD");
    error.status = 400;
    throw error;
  }
  return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
}

function endOfDay(date = new Date()) {
  const value = startOfDay(date);
  value.setDate(value.getDate() + 1);
  return value;
}

function pendingCount(planned, completed) {
  return Math.max(0, (Number(planned) || 0) - (Number(completed) || 0));
}

function formatPlanDateLabel(scheduledDate) {
  if (!scheduledDate) return "Backlog";
  const key = new Date(scheduledDate).toISOString().slice(0, 10);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${key}T00:00:00`));
}

function buildOptionLabel(plan) {
  const channelName = plan.channelId?.name || "Unknown channel";
  const longPending = pendingCount(plan.longPlanned, plan.longCompleted);
  const shortPending = pendingCount(plan.shortPlanned, plan.shortCompleted);
  return `${formatPlanDateLabel(plan.scheduledDate)} - ${channelName} - #${plan.planId} - ${plan.title} - L ${plan.longPlanned}/${longPending} pending - S ${plan.shortPlanned}/${shortPending} pending`;
}

function parsePending(value, field) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    const error = new Error(`${field} must be a non-negative integer`);
    error.status = 400;
    throw error;
  }
  return number;
}

function sendError(res, label, error) {
  console.error(`${label}:`, error.message);
  return res
    .status(error.status || (error.name === "ValidationError" ? 400 : 500))
    .json({ message: error.message || "Request failed" });
}

async function assertPlanInCompany(planObjectId, req) {
  const channels = await companyChannelIds(req);
  const allowedIds = channels.map((channel) => channel._id);
  const plan = await ChannelPlan.findOne({
    _id: planObjectId,
    channelId: { $in: allowedIds },
  })
    .populate("channelId", "name companyId")
    .lean();
  if (!plan) {
    const error = new Error("Channel plan not found");
    error.status = 404;
    throw error;
  }
  return plan;
}

exports.getOptions = async (req, res) => {
  try {
    const channelIds = parseChannelIds(req.query);
    const channels = await companyChannelIds(req);
    const allowed = new Set(channels.map((channel) => String(channel._id)));
    if (channelIds.some((id) => !allowed.has(id))) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const filter = {
      status: { $ne: "completed" },
      channelId: {
        $in: channelIds.length
          ? channelIds.map((id) => new mongoose.Types.ObjectId(id))
          : channels.map((channel) => channel._id),
      },
    };

    const search = String(req.query.search || "").trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      const matchers = [{ title: pattern }, { notes: pattern }];
      const planId = Number.parseInt(search.replace(/^#/, ""), 10);
      if (Number.isInteger(planId)) matchers.push({ planId });
      filter.$and = [{ $or: matchers }];
    }

    const plans = await ChannelPlan.find(filter).populate("channelId", "name").lean();

    plans.sort((a, b) => {
      const channelCompare = (a.channelId?.name || "").localeCompare(b.channelId?.name || "");
      if (channelCompare !== 0) return channelCompare;
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      if (dateA && dateB) return dateB - dateA;
      if (dateA) return -1;
      if (dateB) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    return res.json(
      plans.map((plan) => ({
        _id: plan._id,
        planId: plan.planId,
        title: plan.title,
        channelId: plan.channelId?._id || plan.channelId,
        channelName: plan.channelId?.name || "",
        scheduledDate: plan.scheduledDate,
        isBacklog: !plan.scheduledDate,
        longPlanned: plan.longPlanned,
        longCompleted: plan.longCompleted,
        shortPlanned: plan.shortPlanned,
        shortCompleted: plan.shortCompleted,
        longPending: pendingCount(plan.longPlanned, plan.longCompleted),
        shortPending: pendingCount(plan.shortPlanned, plan.shortCompleted),
        label: buildOptionLabel(plan),
      })),
    );
  } catch (error) {
    return sendError(res, "getChannelPlanWorkLogOptions", error);
  }
};

function emptySummaryRow(channelId, channelName) {
  return {
    channelId,
    channelName,
    planCount: 0,
    actual: { long: 0, short: 0 },
    logged: { long: 0, short: 0 },
    firstCut: { pending: 0, complete: 0 },
  };
}

function sumSummaryRows(rows) {
  return rows.reduce(
    (totals, row) => ({
      planCount: totals.planCount + row.planCount,
      actual: {
        long: totals.actual.long + row.actual.long,
        short: totals.actual.short + row.actual.short,
      },
      logged: {
        long: totals.logged.long + row.logged.long,
        short: totals.logged.short + row.logged.short,
      },
      firstCut: {
        pending: totals.firstCut.pending + row.firstCut.pending,
        complete: totals.firstCut.complete + row.firstCut.complete,
      },
    }),
    {
      planCount: 0,
      actual: { long: 0, short: 0 },
      logged: { long: 0, short: 0 },
      firstCut: { pending: 0, complete: 0 },
    },
  );
}

/**
 * Per-channel Actual vs Logged for plans scheduled in [from, to].
 * Actual — live pending from open plans (L/S = planned − completed).
 * Logged — latest work log per plan in the period, summed by channel (L/S only).
 * First cut — pending vs complete for all open plans in scope (not limited by report period).
 */
exports.getSummary = async (req, res) => {
  try {
    const channelIds = parseChannelIds(req.query);
    const channels = await companyChannelIds(req);
    const allowed = new Set(channels.map((channel) => String(channel._id)));
    if (channelIds.some((id) => !allowed.has(id))) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const from = req.query.from ? startOfDay(new Date(req.query.from)) : null;
    const to = req.query.to ? endOfDay(new Date(req.query.to)) : null;
    if (!from || !to || from >= to) {
      return res.status(400).json({ message: "Valid from and to dates are required" });
    }

    const scopedChannelIds = channelIds.length
      ? channelIds.map((id) => new mongoose.Types.ObjectId(id))
      : channels.map((channel) => channel._id);

    const nameById = new Map(channels.map((channel) => [String(channel._id), channel.name]));

    const periodPlans = await ChannelPlan.find({
      status: { $ne: "completed" },
      channelId: { $in: scopedChannelIds },
      scheduledDate: { $gte: from, $lt: to },
    })
      .select("channelId longPlanned longCompleted shortPlanned shortCompleted")
      .lean();

    const firstCutPlans = await ChannelPlan.find({
      status: { $ne: "completed" },
      channelId: { $in: scopedChannelIds },
    })
      .select("channelId firstCut")
      .lean();

    const logFilter = {
      companyId: req.user.companyId,
      logDate: { $gte: from, $lt: to },
      channelId: { $in: scopedChannelIds },
    };
    const logs = await ChannelPlanWorkLog.find(logFilter)
      .sort({ logDate: -1, updatedAt: -1 })
      .lean();

    const latestLogByPlan = new Map();
    for (const log of logs) {
      const planKey = String(log.planId);
      if (!latestLogByPlan.has(planKey)) latestLogByPlan.set(planKey, log);
    }

    const summaryByChannel = new Map();

    const ensureRow = (channelId, channelName) => {
      const key = String(channelId);
      if (!summaryByChannel.has(key)) {
        summaryByChannel.set(key, emptySummaryRow(key, channelName || nameById.get(key) || "Unknown"));
      }
      return summaryByChannel.get(key);
    };

    for (const plan of periodPlans) {
      const row = ensureRow(plan.channelId, nameById.get(String(plan.channelId)));
      row.actual.long += pendingCount(plan.longPlanned, plan.longCompleted);
      row.actual.short += pendingCount(plan.shortPlanned, plan.shortCompleted);
      row.planCount += 1;
    }

    for (const plan of firstCutPlans) {
      const row = ensureRow(plan.channelId, nameById.get(String(plan.channelId)));
      if (plan.firstCut) row.firstCut.complete += 1;
      else row.firstCut.pending += 1;
    }

    for (const log of latestLogByPlan.values()) {
      const row = ensureRow(
        log.channelId,
        log.channelName || nameById.get(String(log.channelId)),
      );
      row.logged.long += log.longPendingLogged || 0;
      row.logged.short += log.shortPendingLogged || 0;
    }

    const channelRows = [...summaryByChannel.values()].sort((a, b) =>
      a.channelName.localeCompare(b.channelName),
    );

    return res.json({
      range: { from: req.query.from, to: req.query.to },
      channels: channelRows,
      totals: sumSummaryRows(channelRows),
    });
  } catch (error) {
    return sendError(res, "getChannelPlanWorkLogSummary", error);
  }
};

exports.listLogs = async (req, res) => {
  try {
    const channelIds = parseChannelIds(req.query);
    const channels = await companyChannelIds(req);
    const allowed = new Set(channels.map((channel) => String(channel._id)));
    if (channelIds.some((id) => !allowed.has(id))) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const filter = {
      companyId: req.user.companyId,
    };

    if (channelIds.length === 1) {
      filter.channelId = channelIds[0];
    } else if (channelIds.length > 1) {
      filter.channelId = { $in: channelIds };
    }

    const from = req.query.from ? startOfDay(new Date(req.query.from)) : null;
    const to = req.query.to ? endOfDay(new Date(req.query.to)) : null;
    if (from || to) {
      filter.logDate = {};
      if (from) filter.logDate.$gte = from;
      if (to) filter.logDate.$lt = to;
    }

    const logs = await ChannelPlanWorkLog.find(filter)
      .populate("planId", "planId title scheduledDate longPlanned longCompleted shortPlanned shortCompleted")
      .populate("channelId", "name")
      .populate("loggedBy", "name email")
      .sort({ logDate: -1, updatedAt: -1 })
      .lean();

    return res.json({ logs });
  } catch (error) {
    return sendError(res, "listChannelPlanWorkLogs", error);
  }
};

exports.upsertToday = async (req, res) => {
  try {
    const planObjectId = req.body.planId;
    if (!planObjectId || !mongoose.Types.ObjectId.isValid(planObjectId)) {
      return res.status(400).json({ message: "A valid planId is required" });
    }

    const longPendingLogged = parsePending(req.body.longPendingLogged, "longPendingLogged");
    const shortPendingLogged = parsePending(req.body.shortPendingLogged, "shortPendingLogged");
    if (longPendingLogged === undefined || shortPendingLogged === undefined) {
      return res.status(400).json({
        message: "Provide longPendingLogged and shortPendingLogged",
      });
    }
    if (longPendingLogged === 0 && shortPendingLogged === 0) {
      return res.status(400).json({
        message: "At least one logged count must be greater than zero",
      });
    }

    const plan = await assertPlanInCompany(planObjectId, req);
    const logDate = parseDateKey(req.body.logDate);

    const payload = {
      planId: plan._id,
      logDate,
      longPendingLogged,
      shortPendingLogged,
      planIdNumber: plan.planId,
      title: plan.title,
      channelId: plan.channelId?._id || plan.channelId,
      channelName: plan.channelId?.name || "",
      planScheduledDate: plan.scheduledDate || null,
      loggedBy: req.user._id || req.user.id,
      companyId: req.user.companyId,
    };

    const existing = await ChannelPlanWorkLog.findOne({ planId: plan._id, logDate }).lean();

    const log = await ChannelPlanWorkLog.findOneAndUpdate(
      { planId: plan._id, logDate },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
      .populate("planId", "planId title")
      .populate("channelId", "name")
      .populate("loggedBy", "name email")
      .lean();

    return res.status(existing ? 200 : 201).json(log);
  } catch (error) {
    return sendError(res, "upsertChannelPlanWorkLog", error);
  }
};

exports.updateLog = async (req, res) => {
  try {
    const logId = req.params.id;
    if (!logId || !mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: "A valid log id is required" });
    }

    const longPendingLogged = parsePending(req.body.longPendingLogged, "longPendingLogged");
    const shortPendingLogged = parsePending(req.body.shortPendingLogged, "shortPendingLogged");
    if (longPendingLogged === undefined || shortPendingLogged === undefined) {
      return res.status(400).json({
        message: "Provide longPendingLogged and shortPendingLogged",
      });
    }
    if (longPendingLogged === 0 && shortPendingLogged === 0) {
      return res.status(400).json({
        message: "At least one logged count must be greater than zero",
      });
    }

    const log = await ChannelPlanWorkLog.findOne({
      _id: logId,
      companyId: req.user.companyId,
    });
    if (!log) {
      return res.status(404).json({ message: "Work log not found" });
    }

    log.longPendingLogged = longPendingLogged;
    log.shortPendingLogged = shortPendingLogged;
    log.loggedBy = req.user._id || req.user.id;
    await log.save();

    const updated = await ChannelPlanWorkLog.findById(log._id)
      .populate("planId", "planId title scheduledDate")
      .populate("channelId", "name")
      .populate("loggedBy", "name email")
      .lean();

    return res.json(updated);
  } catch (error) {
    return sendError(res, "updateChannelPlanWorkLog", error);
  }
};
