const express = require("express");
const router = express.Router();

const {
  createPromptType,
  getPromptTypes,
  getPromptTypesByChannel,
  updatePromptType,
  deletePromptType
} = require("../controllers/promptTypeController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// get all
router.get("/", protect, getPromptTypes);

// get by channel
router.get(
  "/channel/:channelId",
  protect,
  getPromptTypesByChannel
);

// create
router.post(
  "/",
  protect,
  allowRoles("admin"),
  createPromptType
);

// update
router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  updatePromptType
);

// delete
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  deletePromptType
);

module.exports = router;
