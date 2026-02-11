
const Channel = require("../models/channel");
const Prompt = require("../models/prompt");

const createChannel = async (req, res) => {
  const exists = await Channel.findOne({
    name: req.body.name,
    companyId: req.user.companyId
  });

  if (exists) return res.status(400).json({ message: "Channel exists" });

  const channel = await Channel.create({
    name: req.body.name,
    companyId: req.user.companyId,
    createdBy: req.user.id
  });

  res.json(channel);
};

const getChannels = async (req, res) => {
  const channels = await Channel.find({ companyId: req.user.companyId });
  res.json(channels);
};

const updateChannel = async (req, res) => {
  const channel = await Channel.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { name: req.body.name },
    { new: true }
  );
  res.json(channel);
};

const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Delete related prompts using actual channel name
    await Prompt.deleteMany({
      channelName: channel.name,
      companyId: req.user.companyId
    });

    await channel.deleteOne();

    res.status(200).json({ message: "Channel deleted successfully" });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error while deleting channel" });
  }
};

module.exports = {
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel
};

