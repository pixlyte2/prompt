// const express = require("express");
// const path = require("path");
// const cors = require("cors");
// require("dotenv").config();

// const connectDB = require("./config/db");

// // Routes
// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const channelRoutes = require("./routes/channelRoutes");
// const promptRoutes = require("./routes/promptRoutes");
// const dashboardRoutes = require("./routes/dashboardRoutes");
// const superAdminRoutes = require("./routes/superAdminRoutes");
// const promptTypeRoutes = require("./routes/promptTypeRoutes");
 

// // Connect MongoDB
// connectDB();

// const app = express();

// /**
//  * 🔐 Middleware
//  */
// app.use(
//   cors({
//     origin: "http://localhost:5173", // Vite frontend
//     credentials: true,
//   })
// );

// app.use(express.json({ limit: "50mb" }));

// /**
//  * 📌 API Routes
//  */
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/channels", channelRoutes);
// app.use("/api/prompts", promptRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/superadmin", superAdminRoutes);
// app.use("/api/prompt-types", promptTypeRoutes);


// /**
//  * 🧪 Health Check
//  */
// app.get("/", (req, res) => {
//   res.send("CreatorAI Backend is running 🚀");
// });

// /**
//  * 🚀 Start Server
//  */
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

// module.exports = app;





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

// Connect MongoDB
connectDB();

const app = express();

/**
 * 🔐 Middleware
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://prompt-mjda.vercel.app", // 👉 உங்கள் client domain
    ],
    credentials: true,
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
 * ✅ IMPORTANT FOR VERCEL
 * ❌ app.listen() REMOVE
 * ✅ export app
 */
module.exports = app;
