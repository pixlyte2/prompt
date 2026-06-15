const mongoose = require("mongoose");

const competitorKeywordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** "cached" for Cached tab additions, or a CompetitorType _id string */
    scope: { type: String, required: true, trim: true },
    keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

competitorKeywordSchema.index({ userId: 1, scope: 1 }, { unique: true });

module.exports =
  mongoose.models.CompetitorKeyword ||
  mongoose.model("CompetitorKeyword", competitorKeywordSchema);
