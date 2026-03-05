const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const channelRoutes = require("./routes/channelRoutes");
const promptRoutes = require("./routes/promptRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const promptTypeRoutes = require("./routes/promptTypeRoutes");

const app = express();

/**
 * 🔐 CORS CONFIG
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://prompt-mjda.vercel.app",
  "https://prompt-de4a.vercel.app"
];

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "50mb" }));

/**
 * 📌 API Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/prompt-types", promptTypeRoutes);

/**
 * 🧪 Health Check
 */
app.get("/", (req, res) => {
  res.send("CreatorAI Backend is running 🚀");
});

/**
 * 🚀 Start Server
 */
const startServer = async () => {
  await connectDB();
  
  if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  }
};

startServer();

module.exports = app;
