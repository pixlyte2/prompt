const express = require("express");
const { getAdminStats } = require("../controllers/dashboardController");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/stats", protect, allowRoles("admin"), getAdminStats);

module.exports = router;
