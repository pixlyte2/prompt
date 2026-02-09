



const Prompt = require("../models/prompt");

const createPrompt = async (req, res) => {
  const prompt = await Prompt.create({
    ...req.body,
    companyId: req.user.companyId,
    createdBy: req.user.id
  });
  res.json(prompt);
};

const getPrompts = async (req, res) => {
  const prompts = await Prompt.find({
    companyId: req.user.companyId
  });
  res.json(prompts);
};

const updatePrompt = async (req, res) => {
  const prompt = await Prompt.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    req.body,
    { new: true }
  );
  res.json(prompt);
};

const deletePrompt = async (req, res) => {
  await Prompt.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });
  res.json({ message: "Prompt deleted" });
};

const getPromptTypesByChannel = async (req, res) => {
  const types = await Prompt.distinct("promptType", {
    channelName: req.params.channelName,
    companyId: req.user.companyId
  });
  res.json(types);
};

module.exports = {
  createPrompt,
  getPrompts,
  updatePrompt,
  deletePrompt,
  getPromptTypesByChannel
};
