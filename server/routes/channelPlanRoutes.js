const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const {
  thumbnailUpload,
  THUMBNAIL_MAX_BYTES,
} = require("../middleware/thumbnailUpload");
const controller = require("../controllers/channelPlanController");

const router = express.Router();
const adminOnly = allowRoles("admin");

function uploadThumbnail(req, res, next) {
  thumbnailUpload.single("thumbnail")(req, res, (error) => {
    if (!error) return next();
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({
      message: tooLarge
        ? `Thumbnail must be ${Math.round(THUMBNAIL_MAX_BYTES / 1024)} KB or smaller`
        : error.message || "Thumbnail upload failed",
    });
  });
}

router.get("/stats", protect, adminOnly, controller.getStats);
router.get("/", protect, adminOnly, controller.getPlans);
router.post("/", protect, adminOnly, uploadThumbnail, controller.createPlan);
router.put("/:id", protect, adminOnly, uploadThumbnail, controller.updatePlan);
router.delete("/:id", protect, adminOnly, controller.deletePlan);

module.exports = router;
