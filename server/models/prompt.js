const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true
    },
    promptTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromptType",
      required: true
    },
    aiModel: String,
    promptText: String,
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prompt", promptSchema);
