const mongoose = require("mongoose");

const videoTaskSchema = new mongoose.Schema(
  {
    videoId: { type: String, default: "" },
    customVideoId: { type: Number },
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
    script: { type: String, default: "" },
    /** GridFS file id (24-char hex) for voice-over audio stored in MongoDB */
    voiceOverStoredName: { type: String, default: "" },
    /** Original client filename for Content-Disposition */
    voiceOverOriginalName: { type: String, default: "" },
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

videoTaskSchema.pre("save", async function() {
  if (!this.customVideoId) {
    const maxTask = await this.constructor.findOne(
      { customVideoId: { $ne: null } },
      { customVideoId: 1 }
    ).sort({ customVideoId: -1 });
    
    this.customVideoId = maxTask && maxTask.customVideoId ? maxTask.customVideoId + 1 : 111;
  }
});

videoTaskSchema.index({ status: 1, channelType: 1 });
videoTaskSchema.index({ scheduledDate: 1 });
videoTaskSchema.index({ status: 1, scheduledDate: 1 });
videoTaskSchema.index({ status: 1, completedAt: -1, updatedAt: -1 });
videoTaskSchema.index({ status: 1, updatedAt: -1 });

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

videoTaskSchema.statics.initializeCustomVideoIds = async function initializeCustomVideoIds() {
  try {
    const tasks = await this.find({ customVideoId: null }).sort({ createdAt: 1 });
    if (tasks.length === 0) return 0;
    
    const maxTask = await this.findOne(
      { customVideoId: { $ne: null } },
      { customVideoId: 1 }
    ).sort({ customVideoId: -1 });
    
    let nextId = maxTask && maxTask.customVideoId ? maxTask.customVideoId + 1 : 111;
    
    let updatedCount = 0;
    for (const task of tasks) {
      task.customVideoId = nextId++;
      await task.save();
      updatedCount++;
    }
    
    if (updatedCount > 0) {
      console.log(`🔁 VideoTask migration: initialized customVideoIds for ${updatedCount} task(s)`);
    }
    return updatedCount;
  } catch (err) {
    console.error("VideoTask customVideoId initialization failed:", err.message);
    return 0;
  }
};

module.exports = mongoose.model("VideoTask", videoTaskSchema);
