const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["superadmin","admin", "content_manager", "viewer", "voice_over", "voice_over_training"],
      default: "viewer"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      
      // required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
