const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["superadmin","admin", "content_manager", "viewer"],
      default: "viewer"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      
      // required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
