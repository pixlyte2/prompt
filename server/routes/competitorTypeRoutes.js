const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/competitorTypeController");

router.get("/", protect, ctrl.getTypes);
router.post("/", protect, ctrl.createType);
router.put("/:id", protect, ctrl.updateType);
router.delete("/:id", protect, ctrl.deleteType);
router.post("/:id/channels", protect, ctrl.addChannel);
router.delete("/:id/channels/:channelHandle", protect, ctrl.removeChannel);

module.exports = router;
