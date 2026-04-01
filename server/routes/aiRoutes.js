const express = require("express");
const router = express.Router();
const { chat, validateContent, assistant } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, chat);
router.post("/assistant", protect, assistant);
router.post("/validate", protect, validateContent);

module.exports = router;
