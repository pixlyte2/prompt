const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/videoTaskController");

router.get("/", protect, ctrl.getTasks);
router.post("/", protect, ctrl.createTask);
router.put("/:id", protect, ctrl.updateTask);
router.delete("/:id", protect, ctrl.deleteTask);

module.exports = router;
