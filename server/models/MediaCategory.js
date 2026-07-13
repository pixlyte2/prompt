const mongoose = require("mongoose");

const mediaCategorySchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MediaCategory ||
  mongoose.model("MediaCategory", mediaCategorySchema);
