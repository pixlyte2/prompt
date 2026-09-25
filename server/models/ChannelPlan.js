const mongoose = require("mongoose");

const channelPlanSchema = new mongoose.Schema(
  {
    /** Human-readable sequential id shown as a pill in the planner grid. */
    planId: { type: Number },
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
    firstCut: { type: Boolean, default: false },
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

const FIRST_PLAN_ID = 111;

async function nextPlanId(Model) {
  const latest = await Model.findOne({ planId: { $ne: null } }, { planId: 1 })
    .sort({ planId: -1 })
    .lean();
  return latest && latest.planId ? latest.planId + 1 : FIRST_PLAN_ID;
}

channelPlanSchema.pre("save", async function assignPlanId() {
  if (!this.planId) {
    this.planId = await nextPlanId(this.constructor);
  }
});

/**
 * One-shot backfill for documents created before `planId` existed.
 * Idempotent — matches zero documents once every plan has an id.
 */
channelPlanSchema.statics.initializePlanIds = async function initializePlanIds() {
  try {
    const plans = await this.find({
      $or: [{ planId: null }, { planId: { $exists: false } }],
    })
      .select("_id")
      .sort({ createdAt: 1 });
    if (plans.length === 0) return 0;

    let id = await nextPlanId(this);
    for (const plan of plans) {
      await this.updateOne({ _id: plan._id }, { $set: { planId: id } });
      id += 1;
    }
    console.log(`🔁 ChannelPlan migration: assigned planId to ${plans.length} plan(s)`);
    return plans.length;
  } catch (error) {
    console.error("ChannelPlan planId initialization failed:", error.message);
    return 0;
  }
};

channelPlanSchema.index({ status: 1, scheduledDate: 1 });
channelPlanSchema.index({ status: 1, completedAt: -1 });
channelPlanSchema.index({ channelId: 1 });
channelPlanSchema.index({ planId: -1 });

module.exports =
  mongoose.models.ChannelPlan || mongoose.model("ChannelPlan", channelPlanSchema);
