const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true },
    name: { type: String, required: true },
    videoFormat: { type: String, enum: ['long', 'short'], default: 'long' }
  },
  { _id: false },
);

const competitorTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    videosPerChannel: { type: Number, default: 30, min: 1, max: 200 },
    sortOrder: { type: Number, default: 0 },
    channels: [channelSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CompetitorType", competitorTypeSchema);
