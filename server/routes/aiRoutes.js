const express = require("express");
const router = express.Router();
const { chat, validateContent } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, chat);
router.post("/validate", protect, validateContent);

module.exports = router;
