const VideoTask = require("../models/VideoTask");
const { voiceOverExpireAtFrom } = require("../constants/voiceOverRetention");
const {
  contentTypeForVoiceOver,
  defaultVoiceOverOriginalName,
} = require("../utils/voiceOverAllowedFormats");
const {
  deleteVoiceOverGridFs,
  uploadVoiceOverBuffer,
  findVoiceOverFile,
  getBucket,
  isVoiceOverGridFsId,
  ObjectId: VoiceOverObjectId,
} = require("../utils/voiceOverGridfs");
const {
  clearVoiceOverFromTask,
  isVoiceOverExpired,
  purgeExpiredVoiceOvers,
} = require("../utils/voiceOverCleanup");

/** Tasks shown on the Voice-over page: scheduled date set and not completed */
function taskAllowedForVoiceOverSchedule(task) {
  if (!task) return false;
  if (task.status === "completed") return false;
  return Boolean(task.scheduledDate);
}

/** Completed Production Hub tasks eligible for VO Training downloads */
function taskAllowedForVoTraining(task) {
  if (!task || task.status !== "completed") return false;
  return Boolean(String(task.script ?? "").trim()) &&
    Boolean(String(task.voiceOverStoredName ?? "").trim());
}

/** @returns {boolean} true if response was sent (403) */
function rejectVoiceOverOutOfScope(req, res, task, options = {}) {
  const role = req.user?.role;
  if (role === "voice_over") {
    if (taskAllowedForVoiceOverSchedule(task)) return false;
    res.status(403).json({
      message: "Voice-over role can only access scheduled, non-completed production tasks",
    });
    return true;
  }
  if (role === "voice_over_training") {
    if (options.allowTraining && taskAllowedForVoTraining(task)) return false;
    res.status(403).json({
      message: "Voice-over training role can only download completed training tasks",
    });
    return true;
  }
  return false;
}

function localDateKey(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Lightweight counts for dashboard / hub ribbon (same rules as Production Hub client).
 */
exports.getTaskStats = async (req, res) => {
  try {
    const todayKey = localDateKey(new Date());
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndKey = localDateKey(weekEnd);

    const offsetMinutes = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const tzOffset = `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    const [stats] = await VideoTask.aggregate([
      {
        $project: {
          status: 1,
          dateKey: {
            $cond: {
              if: { $eq: [{ $type: "$scheduledDate" }, "date"] },
              then: { $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate", timezone: tzOffset } },
              else: ""
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "completed"] },
                    { $ne: ["$dateKey", ""] },
                    { $lt: ["$dateKey", todayKey] }
                  ]
                },
                1,
                0
              ]
            }
          },
          today: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "completed"] },
                    { $eq: ["$dateKey", todayKey] }
                  ]
                },
                1,
                0
              ]
            }
          },
          thisWeek: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "completed"] },
                    { $ne: ["$dateKey", ""] },
                    { $gte: ["$dateKey", todayKey] },
                    { $lte: ["$dateKey", weekEndKey] }
                  ]
                },
                1,
                0
              ]
            }
          },
          backlog: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "completed"] },
                    { $eq: ["$dateKey", ""] }
                  ]
                },
                1,
                0
              ]
            }
          },
          scheduled: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "completed"] },
                    { $ne: ["$dateKey", ""] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats ? {
      overdue: stats.overdue,
      today: stats.today,
      thisWeek: stats.thisWeek,
      backlog: stats.backlog,
      scheduled: stats.scheduled,
      completed: stats.completed,
      active: stats.total - stats.completed
    } : {
      overdue: 0,
      today: 0,
      thisWeek: 0,
      backlog: 0,
      scheduled: 0,
      completed: 0,
      active: 0
    };

    res.json(result);
  } catch (err) {
    console.error("getTaskStats error:", err.message);
    res.status(500).json({ message: "Failed to load task stats" });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.channelType) filter.channelType = req.query.channelType;

    const bucket = typeof req.query.bucket === "string" ? req.query.bucket.trim() : "";

    if (req.user.role === "voice_over" && bucket !== "schedule") {
      return res.status(403).json({ message: "Not authorized to load this task list" });
    }
    if (req.user.role === "voice_over_training" && bucket !== "vo-training") {
      return res.status(403).json({ message: "Not authorized to load this task list" });
    }

    let limit;
    if (bucket === "schedule") {
      filter.status = { $ne: "completed" };
      filter.scheduledDate = { $ne: null, $exists: true };
    } else if (bucket === "backlog") {
      filter.status = { $ne: "completed" };
      filter.$or = [
        { scheduledDate: null },
        { scheduledDate: { $exists: false } },
      ];
    } else if (bucket === "completed") {
      filter.status = "completed";
    } else if (bucket === "vo-training") {
      filter.status = "completed";
      filter.script = { $exists: true, $nin: ["", null] };
      filter.voiceOverStoredName = { $exists: true, $nin: ["", null] };
      limit = 10;
    } else if (bucket !== "") {
      return res.status(400).json({ message: "Invalid bucket. Use schedule, backlog, completed, or vo-training." });
    }

    const sort = bucket === "completed" || bucket === "vo-training"
      ? { completedAt: -1, updatedAt: -1 }
      : bucket === "backlog"
        ? { updatedAt: -1 }
        : { scheduledDate: 1 };

    let query = VideoTask.find(filter).sort(sort);
    if (limit) query = query.limit(limit);
    const tasks = await query.lean();

    if (bucket === "vo-training") {
      const filtered = tasks.filter(taskAllowedForVoTraining);
      return res.json(filtered.slice(0, 10));
    }

    res.json(tasks);
  } catch (err) {
    console.error("getTasks error:", err.message);
    res.status(500).json({ message: "Failed to load tasks" });
  }
};

exports.createTask = async (req, res) => {
  try {
    const {
      videoId, title, thumbnail, channelName, channelHandle,
      channelType, views, viewsText, duration, scheduledDate, notes, script,
      platform, url, contentFormat, assignedTo,
    } = req.body;

    if (!title || !channelType) {
      return res.status(400).json({ message: "title and channelType are required" });
    }

    if (url && url.trim()) {
      const existingTask = await VideoTask.findOne({ url: url.trim() });
      if (existingTask) {
        const statusMap = {
          todo: "Pending",
          in_progress: "In Progress",
          completed: "Completed",
        };
        const statusLabel = statusMap[existingTask.status] || existingTask.status;
        const dateStr = existingTask.scheduledDate ? new Date(existingTask.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Backlog";
        return res.status(400).json({
          message: `Duplicate URL! This is already saved as '${statusLabel}' (Date: ${dateStr}).`,
        });
      }
    }

    const task = await VideoTask.create({
      videoId: videoId || "",
      title, thumbnail, channelName, channelHandle,
      channelType, views, viewsText, duration,
      platform: platform || "youtube",
      contentFormat: contentFormat || [],
      assignedTo: assignedTo || [],
      url: url || "",
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      notes: notes || "",
      script: script || "",
      createdBy: req.user._id,
    });
    res.status(201).json(task);
  } catch (err) {
    console.error("createTask error:", err.message);
    res.status(500).json({ message: "Failed to create task" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const {
      status, scheduledDate, notes, script, title, url, videoId,
      platform, contentFormat, assignedTo, channelType, channelName, channelHandle,
      thumbnail, views, viewsText, duration,
    } = req.body;

    if (url && url.trim()) {
      const existingTask = await VideoTask.findOne({
        url: url.trim(),
        _id: { $ne: req.params.id },
      });
      if (existingTask) {
        const statusMap = {
          todo: "Pending",
          in_progress: "In Progress",
          completed: "Completed",
        };
        const statusLabel = statusMap[existingTask.status] || existingTask.status;
        const dateStr = existingTask.scheduledDate ? new Date(existingTask.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Backlog";
        return res.status(400).json({
          message: `Duplicate URL! This is already saved as '${statusLabel}' (Date: ${dateStr}).`,
        });
      }
    }

    const task = await VideoTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (status) {
      task.status = status;
      if (status === "completed") task.completedAt = new Date();
      else task.completedAt = null;
    }
    if (scheduledDate !== undefined) {
      task.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    }
    if (notes !== undefined) task.notes = notes;
    if (script !== undefined) task.script = script;
    if (title !== undefined) task.title = title;
    if (url !== undefined) task.url = url;
    if (videoId !== undefined) task.videoId = videoId;
    if (platform !== undefined) task.platform = platform;
    if (contentFormat !== undefined) task.contentFormat = contentFormat;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (channelType !== undefined) task.channelType = channelType;
    if (channelName !== undefined) task.channelName = channelName;
    if (channelHandle !== undefined) task.channelHandle = channelHandle;
    if (thumbnail !== undefined) task.thumbnail = thumbnail;
    if (views !== undefined) task.views = views;
    if (viewsText !== undefined) task.viewsText = viewsText;
    if (duration !== undefined) task.duration = duration;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error("updateTask error:", err.message);
    res.status(500).json({ message: "Failed to update task" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await VideoTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    await deleteVoiceOverGridFs(task.voiceOverStoredName);
    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("deleteTask error:", err.message);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

exports.deleteManyTasks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const tasks = await VideoTask.find({ _id: { $in: ids } }).lean();
    for (const t of tasks) {
      await deleteVoiceOverGridFs(t.voiceOverStoredName);
    }
    await VideoTask.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${ids.length} tasks deleted` });
  } catch (err) {
    console.error("deleteManyTasks error:", err.message);
    res.status(500).json({ message: "Failed to delete tasks" });
  }
};

exports.uploadVoiceOver = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ message: "No file uploaded (use field name: file)" });
    }
    const task = await VideoTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (rejectVoiceOverOutOfScope(req, res, task)) return;

    const prevId = task.voiceOverStoredName;
    let newIdHex = null;
    const uploadedAt = new Date();
    const expireAt = voiceOverExpireAtFrom(uploadedAt);
    try {
      const newId = await uploadVoiceOverBuffer(req.file.buffer, {
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        taskMongoId: task._id,
        expireAt,
      });
      newIdHex = String(newId);
      task.voiceOverStoredName = newIdHex;
      task.voiceOverOriginalName =
        req.file.originalname || defaultVoiceOverOriginalName(req.file.originalname);
      task.voiceOverUploadedAt = uploadedAt;
      task.voiceOverExpireAt = expireAt;
      await task.save();
    } catch (inner) {
      if (newIdHex) await deleteVoiceOverGridFs(newIdHex);
      throw inner;
    }

    if (prevId && prevId !== newIdHex) {
      await deleteVoiceOverGridFs(prevId);
    }

    res.json(task);
  } catch (err) {
    console.error("uploadVoiceOver error:", err.message);
    res.status(500).json({ message: "Failed to upload voice-over" });
  }
};

exports.downloadVoiceOver = async (req, res) => {
  try {
    const task = await VideoTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (rejectVoiceOverOutOfScope(req, res, task, { allowTraining: true })) return;
    if (!task?.voiceOverStoredName?.trim()) {
      return res.status(404).json({ message: "No voice-over file for this task" });
    }
    if (isVoiceOverExpired(task)) {
      await clearVoiceOverFromTask(task);
      return res.status(410).json({
        message: "Voice-over file expired (10-day retention). Please upload again.",
      });
    }
    const idStr = String(task.voiceOverStoredName).trim();
    if (!isVoiceOverGridFsId(idStr)) {
      return res.status(404).json({ message: "No voice-over file for this task" });
    }

    const fileDoc = await findVoiceOverFile(idStr);
    if (!fileDoc) {
      return res.status(404).json({
        message: "Voice-over file is missing in the database. Please upload again.",
      });
    }

    const rawName =
      String(task.voiceOverOriginalName || "").trim() ||
      String(fileDoc.filename || "").trim() ||
      defaultVoiceOverOriginalName(fileDoc.filename);
    const asciiName = rawName.replace(/[^\x20-\x7E]/g, "_");
    const ct =
      fileDoc.metadata?.contentType ||
      contentTypeForVoiceOver("", rawName);
    res.setHeader("Content-Type", ct);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(rawName)}`,
    );

    const bucket = getBucket();
    const stream = bucket.openDownloadStream(new VoiceOverObjectId(idStr));
    stream.on("error", (streamErr) => {
      if (!res.headersSent) {
        console.error("downloadVoiceOver stream:", streamErr.message);
        res.status(500).json({ message: "Failed to download file" });
      }
    });
    stream.pipe(res);
  } catch (err) {
    console.error("downloadVoiceOver error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to download voice-over" });
    }
  }
};

exports.deleteVoiceOver = async (req, res) => {
  try {
    const task = await VideoTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (rejectVoiceOverOutOfScope(req, res, task)) return;
    await clearVoiceOverFromTask(task);
    res.json(task);
  } catch (err) {
    console.error("deleteVoiceOver error:", err.message);
    res.status(500).json({ message: "Failed to remove voice-over" });
  }
};

/** Cron / ops: purge voice-overs past voiceOverExpireAt. Auth via CRON_SECRET Bearer token. */
exports.purgeExpiredVoiceOversCron = async (req, res) => {
  try {
    const secret = process.env.CRON_SECRET;
    const auth = String(req.headers.authorization || "");
    if (!secret || auth !== `Bearer ${secret}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const purged = await purgeExpiredVoiceOvers();
    res.json({ purged });
  } catch (err) {
    console.error("purgeExpiredVoiceOversCron error:", err.message);
    res.status(500).json({ message: "Voice-over purge failed" });
  }
};
