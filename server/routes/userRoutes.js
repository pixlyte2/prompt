const express = require("express");
const {
  createUser,
  getUsers,
  getContentManagers,
  deleteUser,
  updateUser,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/content", protect, allowRoles("admin"), createUser);
router.get("/content-managers", protect, allowRoles("admin"), getContentManagers);
router.get("/", protect, allowRoles("admin"), getUsers);
router.put("/:id", protect, allowRoles("admin"), updateUser);
router.delete("/:id", protect, allowRoles("admin"), deleteUser);

module.exports = router;
