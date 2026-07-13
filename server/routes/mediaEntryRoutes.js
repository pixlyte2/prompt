const express = require("express");
const {
  getEntries,
  createEntry,
  updateEntry,
  reorderEntries,
  deleteEntry,
} = require("../controllers/mediaEntryController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles  = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/",              protect,                       getEntries);
router.post("/",             protect, allowRoles("admin"),  createEntry);
router.put("/reorder",       protect, allowRoles("admin"),  reorderEntries);
router.put("/:id",           protect, allowRoles("admin"),  updateEntry);
router.delete("/:id",        protect, allowRoles("admin"),  deleteEntry);

module.exports = router;
