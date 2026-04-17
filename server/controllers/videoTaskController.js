const VideoTask = require("../models/VideoTask");

exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.channelType) filter.channelType = req.query.channelType;
    const tasks = await VideoTask.find(filter).sort({ scheduledDate: 1 }).lean();
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
      channelType, views, viewsText, duration, scheduledDate, notes,
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
      status, scheduledDate, notes, title, url, videoId,
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
    const task = await VideoTask.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
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
    await VideoTask.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${ids.length} tasks deleted` });
  } catch (err) {
    console.error("deleteManyTasks error:", err.message);
    res.status(500).json({ message: "Failed to delete tasks" });
  }
};
