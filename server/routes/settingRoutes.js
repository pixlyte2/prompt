const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getSetting, updateSetting } = require("../controllers/settingController");

router.get("/:key", protect, getSetting);
router.post("/", protect, updateSetting);

module.exports = router;
