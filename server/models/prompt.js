const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel"
    },

    promptTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromptType"
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
