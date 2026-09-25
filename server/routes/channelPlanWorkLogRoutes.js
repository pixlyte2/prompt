const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const controller = require("../controllers/channelPlanWorkLogController");

const router = express.Router();
const adminOnly = allowRoles("admin");

router.get("/options", protect, adminOnly, controller.getOptions);
router.get("/summary", protect, adminOnly, controller.getSummary);
router.get("/", protect, adminOnly, controller.listLogs);
router.post("/", protect, adminOnly, controller.upsertToday);

module.exports = router;
