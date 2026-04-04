const CompetitorType = require("../models/CompetitorType");
const { clearCache } = require("./competitorController");

exports.getTypes = async (req, res) => {
  try {
    const types = await CompetitorType.find().sort("name").lean();
    res.json(types);
  } catch (err) {
    console.error("getTypes error:", err.message);
    res.status(500).json({ message: "Failed to load competitor types" });
  }
};

exports.createType = async (req, res) => {
  try {
    const { name, videosPerChannel } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Type name is required" });
    }
    const type = await CompetitorType.create({
      name: name.trim(),
      videosPerChannel: videosPerChannel || 30,
      channels: [],
      createdBy: req.user._id,
    });
    res.status(201).json(type);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A type with this name already exists" });
    }
    console.error("createType error:", err.message);
    res.status(500).json({ message: "Failed to create type" });
  }
};

exports.updateType = async (req, res) => {
  try {
    const { name, videosPerChannel } = req.body;
    const update = {};
    if (name?.trim()) update.name = name.trim();
    if (videosPerChannel != null) update.videosPerChannel = Math.min(Math.max(videosPerChannel, 1), 200);

    const type = await CompetitorType.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!type) return res.status(404).json({ message: "Type not found" });
    clearCache(req.params.id);
    res.json(type);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A type with this name already exists" });
    }
    console.error("updateType error:", err.message);
    res.status(500).json({ message: "Failed to update type" });
  }
};

exports.deleteType = async (req, res) => {
  try {
    const type = await CompetitorType.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ message: "Type not found" });
    clearCache(req.params.id);
    res.json({ message: "Type deleted" });
  } catch (err) {
    console.error("deleteType error:", err.message);
    res.status(500).json({ message: "Failed to delete type" });
  }
};

exports.addChannel = async (req, res) => {
  try {
    const { handle, name, videoFormat } = req.body;
    if (!handle?.trim() || !name?.trim()) {
      return res.status(400).json({ message: "Channel handle and name are required" });
    }

    const type = await CompetitorType.findById(req.params.id);
    if (!type) return res.status(404).json({ message: "Type not found" });

    const exists = type.channels.some(
      (ch) => ch.handle.toLowerCase() === handle.trim().toLowerCase(),
    );
    if (exists) {
      return res.status(409).json({ message: "Channel already exists in this type" });
    }

    type.channels.push({ handle: handle.trim(), name: name.trim(), videoFormat: videoFormat || 'long' });
    await type.save();
    clearCache(req.params.id);
    res.json(type);
  } catch (err) {
    console.error("addChannel error:", err.message);
    res.status(500).json({ message: "Failed to add channel" });
  }
};

exports.removeChannel = async (req, res) => {
  try {
    const type = await CompetitorType.findById(req.params.id);
    if (!type) return res.status(404).json({ message: "Type not found" });

    const before = type.channels.length;
    const channelToRemove = type.channels.find(
      (ch) => ch.handle.toLowerCase() === req.params.channelHandle.toLowerCase()
    );
    
    if (!channelToRemove) {
      return res.status(404).json({ message: "Channel not found" });
    }

    type.channels.pull(channelToRemove);
    await type.save();
    clearCache(req.params.id);
    res.json(type);
  } catch (err) {
    console.error("removeChannel error:", err.message);
    res.status(500).json({ message: "Failed to remove channel: " + err.message });
  }
};

exports.updateChannelFormat = async (req, res) => {
  try {
    const { videoFormat } = req.body;
    const type = await CompetitorType.findById(req.params.id);
    if (!type) return res.status(404).json({ message: "Type not found" });

    const channel = type.channels.find(
      (ch) => ch.handle.toLowerCase() === req.params.channelHandle.toLowerCase(),
    );
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    channel.videoFormat = videoFormat || 'long';
    await type.save();
    clearCache(req.params.id);
    res.json(type);
  } catch (err) {
    console.error("updateChannelFormat error:", err.message);
    res.status(500).json({ message: "Failed to update channel format" });
  }
};
