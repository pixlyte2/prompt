const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/competitorKeywordController");

router.get("/", protect, ctrl.getAllKeywords);
router.post("/migrate", protect, ctrl.migrateKeywords);
router.get("/:scope", protect, ctrl.getKeywords);
router.put("/:scope", protect, ctrl.setKeywords);
router.post("/:scope", protect, ctrl.addKeyword);
router.delete("/:scope", protect, ctrl.removeKeyword);

module.exports = router;
