const express = require("express");
const { login, refresh } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// router.post("/register-admin", registerAdmin);
router.post("/login", login);
router.post("/refresh", protect, refresh);

module.exports = router;
