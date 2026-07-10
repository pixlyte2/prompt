const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getConfig, saveConfig, aiCategorize, formatKeywords } = require("../controllers/plannerController");

router.get("/config", protect, getConfig);
router.put("/config", protect, saveConfig);
router.post("/categories/ai-categorize", protect, aiCategorize);
router.post("/categories/format-keywords", protect, formatKeywords);

module.exports = router;
