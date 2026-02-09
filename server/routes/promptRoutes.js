const express = require("express");
const {
  createPrompt,
  getPrompts,
  updatePrompt,
  deletePrompt,
  getPromptTypesByChannel
} = require("../controllers/promptController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getPrompts);
router.get("/types/:channelName", protect, getPromptTypesByChannel);
router.post("/", protect, allowRoles("admin", "content_manager"), createPrompt);
router.put("/:id", protect, allowRoles("admin", "content_manager"), updatePrompt);
router.delete("/:id", protect, allowRoles("admin"), deletePrompt);

module.exports = router;
