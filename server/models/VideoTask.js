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
          const validAssignees = ["pooja", "soundarya"];
          return arr.every(assignee => validAssignees.includes(assignee));
        },
        message: 'assignedTo must contain only "pooja" or "soundarya"'
      },
      default: [],
    },
    url: { type: String, default: "" },
    scheduledDate: { type: Date, required: true },
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

module.exports = mongoose.model("VideoTask", videoTaskSchema);
