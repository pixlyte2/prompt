const express = require("express");
const { createChannel, getChannels, updateChannel, deleteChannel } = require("../controllers/channelController");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getChannels);
router.post("/", protect, allowRoles("admin"), createChannel);
router.put("/:id", protect, allowRoles("admin"), updateChannel);
router.delete("/:id", protect, allowRoles("admin"), deleteChannel);

module.exports = router;
