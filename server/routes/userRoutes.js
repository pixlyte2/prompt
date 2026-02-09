const express = require("express");
const { createUser, getUsers, deleteUser } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/content", protect, allowRoles("admin"), createUser);
router.get("/", protect, allowRoles("admin"), getUsers);
router.delete("/:id", protect, allowRoles("admin"), deleteUser);

module.exports = router;
