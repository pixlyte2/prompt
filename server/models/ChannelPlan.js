const mongoose = require("mongoose");

const channelPlanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    thumbnail: { type: String, default: "" },
    scheduledDate: { type: Date, default: null },
    longPlanned: { type: Number, min: 0, default: 0 },
    longCompleted: { type: Number, min: 0, default: 0 },
    shortPlanned: { type: Number, min: 0, default: 0 },
    shortCompleted: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: "" },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo",
    },
    completedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

channelPlanSchema.index({ status: 1, scheduledDate: 1 });
channelPlanSchema.index({ status: 1, completedAt: -1 });
channelPlanSchema.index({ channelId: 1 });

module.exports =
  mongoose.models.ChannelPlan || mongoose.model("ChannelPlan", channelPlanSchema);
