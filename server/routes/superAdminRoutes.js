const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  createSuperAdmin,
  superAdminLogin,
  createAdminCompany,
  getSuperAdminProfile,
  updateSuperAdmin,
  deleteSuperAdmin,
  getAllCompanies,
  getAllAdmins,
  deleteCompany,
  updateAdmin
} = require("../controllers/superAdminController");

// one-time
router.post("/create", createSuperAdmin);

// auth
router.post("/login", superAdminLogin);

// protected
router.get("/me", protect, allowRoles("superadmin"), getSuperAdminProfile);
router.put("/me", protect, allowRoles("superadmin"), updateSuperAdmin);
router.delete("/me", protect, allowRoles("superadmin"), deleteSuperAdmin);


router.put("/admin/:adminId",protect,allowRoles("superadmin"),updateAdmin);

router.get("/companies", protect, allowRoles("superadmin"), getAllCompanies);
router.get("/admins", protect, allowRoles("superadmin"), getAllAdmins);
router.delete(
  "/company/:companyId",
  protect,
  allowRoles("superadmin"),
  deleteCompany
);

router.post(
  "/create-admin",
  protect,
  allowRoles("superadmin"),
  createAdminCompany
);

module.exports = router;