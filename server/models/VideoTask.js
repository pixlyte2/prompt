const mongoose = require("mongoose");

const videoTaskSchema = new mongoose.Schema(
  {
    videoId: { type: String, default: "" },
    title: { type: String, required: true },
    thumbnail: String,
    channelName: String,
    channelHandle: String,
    channelType: { type: String, required: true },
    views: Number,
    viewsText: String,
    duration: String,
    platform: {
      type: String,
      enum: ["youtube", "instagram", "facebook", "website"],
      default: "youtube",
    },
    contentFormat: {
      type: [String],
      validate: {
        validator: function(arr) {
          const validFormats = ["short", "long"];
          return arr.every(format => validFormats.includes(format));
        },
        message: 'contentFormat must contain only "short" or "long"'
      },
      default: [],
    },
    assignedTo: {
      type: [String],
      validate: {
        validator: function(arr) {
          const validAssignees = ["pooja", "mahalakshmi"];
          return arr.every(assignee => validAssignees.includes(assignee));
        },
        message: 'assignedTo must contain only "pooja" or "mahalakshmi"'
      },
      default: [],
    },
    url: { type: String, default: "" },
    scheduledDate: { type: Date, required: false },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo",
    },
    completedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

videoTaskSchema.index({ status: 1, channelType: 1 });

/**
 * One-shot migration: rewrite the legacy assignee value `soundarya` to
 * `mahalakshmi` on any existing tasks. Idempotent — after the first run
 * it matches zero documents and is essentially a no-op.
 */
videoTaskSchema.statics.migrateLegacyAssignees = async function migrateLegacyAssignees() {
  try {
    const result = await this.updateMany(
      { assignedTo: "soundarya" },
      { $set: { "assignedTo.$[legacy]": "mahalakshmi" } },
      { arrayFilters: [{ legacy: "soundarya" }] }
    );
    if (result.modifiedCount > 0) {
      console.log(`🔁 VideoTask migration: renamed assignee 'soundarya' → 'mahalakshmi' on ${result.modifiedCount} task(s)`);
    }
    return result.modifiedCount || 0;
  } catch (err) {
    console.error("VideoTask assignee migration failed:", err.message);
    return 0;
  }
};

module.exports = mongoose.model("VideoTask", videoTaskSchema);
