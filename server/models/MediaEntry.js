const mongoose = require("mongoose");

const customLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    url:   { type: String, required: true },
  },
  { _id: false }
);

const mediaEntrySchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: "MediaCategory", required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    youtube:     { type: String, default: "" },
    facebook:    { type: String, default: "" },
    twitter:     { type: String, default: "" },
    instagram:   { type: String, default: "" },
    website:     { type: String, default: "" },
    customLinks: { type: [customLinkSchema], default: [] },
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MediaEntry ||
  mongoose.model("MediaEntry", mediaEntrySchema);
