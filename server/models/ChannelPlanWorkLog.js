const mongoose = require("mongoose");

/**
 * Daily work log for a channel plan.
 *
 * `longPendingLogged` / `shortPendingLogged` store the **absolute pending count**
 * the user reported at submit time (remaining items = planned − completed as entered),
 * not a delta from the previous log.
 */
const channelPlanWorkLogSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChannelPlan",
      required: true,
    },
    /** Calendar day of the log; normalized to local start-of-day. */
    logDate: { type: Date, required: true },
    longPendingLogged: { type: Number, min: 0, required: true },
    shortPendingLogged: { type: Number, min: 0, required: true },
    planIdNumber: { type: Number },
    title: { type: String, default: "" },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    channelName: { type: String, default: "" },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true },
);

channelPlanWorkLogSchema.index({ planId: 1, logDate: 1 }, { unique: true });
channelPlanWorkLogSchema.index({ companyId: 1, logDate: -1 });
channelPlanWorkLogSchema.index({ logDate: -1 });

module.exports =
  mongoose.models.ChannelPlanWorkLog ||
  mongoose.model("ChannelPlanWorkLog", channelPlanWorkLogSchema);
