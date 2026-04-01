const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getTrends } = require("../controllers/trendsController");

router.get("/", protect, getTrends);

module.exports = router;
