const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getCompetitorVideos } = require("../controllers/competitorController");

router.get("/videos", protect, getCompetitorVideos);

module.exports = router;
