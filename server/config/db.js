const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("\n⚠️  Please check:");
    console.log("   1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)");
    console.log("   2. Correct username/password in .env");
    console.log("   3. Internet connection\n");
  }
};

module.exports = connectDB;
