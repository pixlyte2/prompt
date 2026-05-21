const VideoTask = require("../models/VideoTask");
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

/** Tasks shown on the Voice-over page: scheduled date set and not completed */
function taskAllowedForVoiceOverRole(task) {
  if (!task) return false;
  if (task.status === "completed") return false;
  return Boolean(task.scheduledDate);
}

/** @returns {boolean} true if response was sent (403) */
function rejectVoiceOverOutOfScope(req, res, task) {
  if (req.user?.role !== "voice_over") return false;
  if (taskAllowedForVoiceOverRole(task)) return false;
  res.status(403).json({
    message: "Voice-over role can only access scheduled, non-completed production tasks",
  });
  return true;
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
    } else if (bucket !== "") {
      return res.status(400).json({ message: "Invalid bucket. Use schedule, backlog, or completed." });
    }

    const sort = bucket === "completed"
      ? { completedAt: -1, updatedAt: -1 }
      : bucket === "backlog"
        ? { updatedAt: -1 }
        : { scheduledDate: 1 };

    const tasks = await VideoTask.find(filter).sort(sort).lean();
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

    const update = {};
    if (status) {
      update.status = status;
      if (status === "completed") update.completedAt = new Date();
      else update.completedAt = null;
    }
    if (scheduledDate !== undefined) {
      update.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    }
    if (notes !== undefined) update.notes = notes;
    if (script !== undefined) update.script = script;
    if (title !== undefined) update.title = title;
    if (url !== undefined) update.url = url;
    if (videoId !== undefined) update.videoId = videoId;
    if (platform !== undefined) update.platform = platform;
    if (contentFormat !== undefined) update.contentFormat = contentFormat;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (channelType !== undefined) update.channelType = channelType;
    if (channelName !== undefined) update.channelName = channelName;
    if (channelHandle !== undefined) update.channelHandle = channelHandle;
    if (thumbnail !== undefined) update.thumbnail = thumbnail;
    if (views !== undefined) update.views = views;
    if (viewsText !== undefined) update.viewsText = viewsText;
    if (duration !== undefined) update.duration = duration;

    const task = await VideoTask.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
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
    try {
      const newId = await uploadVoiceOverBuffer(req.file.buffer, {
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        taskMongoId: task._id,
      });
      newIdHex = String(newId);
      task.voiceOverStoredName = newIdHex;
      task.voiceOverOriginalName =
        req.file.originalname || defaultVoiceOverOriginalName(req.file.originalname);
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
    const task = await VideoTask.findById(req.params.id).lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (rejectVoiceOverOutOfScope(req, res, task)) return;
    if (!task?.voiceOverStoredName?.trim()) {
      return res.status(404).json({ message: "No voice-over file for this task" });
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
    await deleteVoiceOverGridFs(task.voiceOverStoredName);
    task.voiceOverStoredName = "";
    task.voiceOverOriginalName = "";
    await task.save();
    res.json(task);
  } catch (err) {
    console.error("deleteVoiceOver error:", err.message);
    res.status(500).json({ message: "Failed to remove voice-over" });
  }
};
