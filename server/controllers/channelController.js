
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
  await Channel.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  await Prompt.deleteMany({
    channelName: req.body.name,
    companyId: req.user.companyId
  });

  res.json({ message: "Channel deleted" });
};

module.exports = {
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel
};

