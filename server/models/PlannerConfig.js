const mongoose = require("mongoose");

const plannerCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Target allocation for this category, in percent (0-100). */
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    subcategories: { type: [String], default: [] },
  },
  { _id: false },
);

const plannerConfigSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    categories: { type: [plannerCategorySchema], default: [] },
    /** How many videos the whole plan should schedule; percentages allocate against this. */
    totalVideos: { type: Number, default: 10, min: 1, max: 500 },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.PlannerConfig ||
  mongoose.model("PlannerConfig", plannerConfigSchema);
