const PromptType = require("../models/promptType");

const createPromptType = async (req, res) => {
  try {
    const { name, channelId } = req.body;

    const exists = await PromptType.findOne({
      name,
      channelId,
      companyId: req.user.companyId
    });

    if (exists)
      return res
        .status(400)
        .json({ message: "Prompt type already exists" });

    const type = await PromptType.create({
      name,
      channelId,
      companyId: req.user.companyId,
      createdBy: req.user.id
    });

    res.json(type);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPromptTypes = async (req, res) => {
  const types = await PromptType.find({
    companyId: req.user.companyId
  }).populate("channelId", "name");

  res.json(types);
};

const getPromptTypesByChannel = async (req, res) => {
  const types = await PromptType.find({
    channelId: req.params.channelId,
    companyId: req.user.companyId
  });

  res.json(types);
};

const updatePromptType = async (req, res) => {
  const type = await PromptType.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { name: req.body.name },
    { new: true }
  );

  res.json(type);
};

const deletePromptType = async (req, res) => {
  await PromptType.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  res.json({ message: "Prompt type deleted" });
};

module.exports = {
  createPromptType,
  getPromptTypes,
  getPromptTypesByChannel,
  updatePromptType,
  deletePromptType
};
    