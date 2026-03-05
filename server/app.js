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

const app = express();

/**
 * 🔐 CORS CONFIG
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://prompt-mjda.vercel.app",
  "https://prompt-de4a.vercel.app",
  "https://prompt-taupe.vercel.app"
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
