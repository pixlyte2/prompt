const express = require("express");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/mediaCategoryController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles  = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/",       protect,                       getCategories);
router.post("/",      protect, allowRoles("admin"),  createCategory);
router.put("/:id",    protect, allowRoles("admin"),  updateCategory);
router.delete("/:id", protect, allowRoles("admin"),  deleteCategory);

module.exports = router;
