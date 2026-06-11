const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/videoTaskController");
const voiceOverUpload = require("../middleware/voiceOverUpload");

function handleVoiceOverUpload(req, res, next) {
  voiceOverUpload.single("file")(req, res, (err) => {
    if (err) {
      const msg = err.message || "Upload failed";
      const code = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(code).json({ message: msg });
    }
    next();
  });
}

const adminOnly = allowRoles("admin");
const adminOrVoiceOver = allowRoles("admin", "voice_over", "voice_over_training");

router.get("/stats", protect, adminOnly, ctrl.getTaskStats);
router.get("/", protect, adminOrVoiceOver, ctrl.getTasks);
router.post("/", protect, adminOnly, ctrl.createTask);
router.delete("/bulk", protect, adminOnly, ctrl.deleteManyTasks);
router.get("/:id/voice-over", protect, adminOrVoiceOver, ctrl.downloadVoiceOver);
router.post("/:id/voice-over", protect, adminOrVoiceOver, handleVoiceOverUpload, ctrl.uploadVoiceOver);
router.delete("/:id/voice-over", protect, adminOrVoiceOver, ctrl.deleteVoiceOver);
router.put("/:id", protect, adminOnly, ctrl.updateTask);
router.delete("/:id", protect, adminOnly, ctrl.deleteTask);

module.exports = router;