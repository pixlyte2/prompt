const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getConfig, saveConfig } = require("../controllers/plannerController");

router.get("/config", protect, getConfig);
router.put("/config", protect, saveConfig);

module.exports = router;
