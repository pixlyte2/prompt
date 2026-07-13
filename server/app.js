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
const aiRoutes = require("./routes/aiRoutes");
const settingRoutes = require("./routes/settingRoutes");
const trendsRoutes = require("./routes/trendsRoutes");
const competitorRoutes = require("./routes/competitorRoutes");
const competitorTypeRoutes = require("./routes/competitorTypeRoutes");
const competitorKeywordRoutes = require("./routes/competitorKeywordRoutes");
const videoTaskRoutes = require("./routes/videoTaskRoutes");
const youtubeRoutes = require("./routes/youtube");
const plannerRoutes = require("./routes/plannerRoutes");
const mediaCategoryRoutes = require("./routes/mediaCategoryRoutes");
const mediaEntryRoutes    = require("./routes/mediaEntryRoutes");

const VideoTask = require("./models/VideoTask");
const {
  purgeExpiredVoiceOvers,
  scheduleVoiceOverCleanup,
} = require("./utils/voiceOverCleanup");

const app = express();

/**
 * 🔐 CORS CONFIG
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://prompt-mjda.vercel.app",
  "https://prompt-de4a.vercel.app",
  "https://prompt-taupe.vercel.app",
  "https://creatorai.pixlyt.in"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400
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
app.use("/api/ai", aiRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/competitors", competitorRoutes);
app.use("/api/competitor-types", competitorTypeRoutes);
app.use("/api/competitor-keywords", competitorKeywordRoutes);
app.use("/api/video-tasks", videoTaskRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/media-categories", mediaCategoryRoutes);
app.use("/api/media-entries",    mediaEntryRoutes);

/**
 * 🧪 Health Check
 */
app.get("/", (req, res) => {
  res.send("Creator AI Backend is running 🚀");
});

/**
 * 🚀 Start Server
 */
const startServer = async () => {
  await connectDB();

  // One-shot data migrations (idempotent on subsequent boots)
  await VideoTask.migrateLegacyAssignees();
  await VideoTask.initializeCustomVideoIds();
  await VideoTask.migrateVoiceOverExpiry();
  await purgeExpiredVoiceOvers();
  scheduleVoiceOverCleanup();

  if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
    // Allow slow multipart uploads (voice-over files up to 4 MB; Vercel cap is 4.5 MB)
    server.timeout = 900_000;
    server.keepAliveTimeout = 910_000;
    server.headersTimeout = 920_000;
  }
};

startServer();

module.exports = app;
