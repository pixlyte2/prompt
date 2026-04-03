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

    if (!title || !scheduledDate || !channelType) {
      return res.status(400).json({ message: "title, channelType and scheduledDate are required" });
    }

    const task = await VideoTask.create({
      videoId: videoId || "",
      title, thumbnail, channelName, channelHandle,
      channelType, views, viewsText, duration,
      platform: platform || "youtube",
      contentFormat: contentFormat || [],
      assignedTo: assignedTo || [],
      url: url || "",
      scheduledDate: new Date(scheduledDate),
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
    const update = {};
    if (status) {
      update.status = status;
      if (status === "completed") update.completedAt = new Date();
      else update.completedAt = null;
    }
    if (scheduledDate) update.scheduledDate = new Date(scheduledDate);
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
