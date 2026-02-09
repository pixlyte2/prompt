const User = require("../models/User");
const Company = require("../models/Company");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * 🔐 CREATE SUPER ADMIN (ONE TIME)
 */
const createSuperAdmin = async (req, res) => {
  const exists = await User.findOne({ role: "superadmin" });
  if (exists)
    return res.status(400).json({ message: "SuperAdmin already exists" });

  const hash = await bcrypt.hash("superadmin123", 10);

  const superadmin = await User.create({
    name: "Super Admin",
    email: "superadmin@creatorai.com",
    password: hash,
    role: "superadmin"
  });

  res.json({ message: "SuperAdmin created", superadmin });
};

/**
 * 🔑 SUPER ADMIN LOGIN
 */
const superAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: "superadmin" });
  if (!user) return res.status(404).json({ message: "Not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, role: user.role });
};

/**
 * 👁️ READ SUPER ADMIN PROFILE
 */
const getSuperAdminProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

/**
 * ✏️ UPDATE SUPER ADMIN
 */
const updateSuperAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  const update = { name, email };

  if (password) {
    update.password = await bcrypt.hash(password, 10);
  }

  const user = await User.findByIdAndUpdate(req.user.id, update, {
    new: true
  }).select("-password");

  res.json(user);
};

/**
 * ❌ DELETE SUPER ADMIN
 */
const deleteSuperAdmin = async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.json({ message: "SuperAdmin deleted" });
};

/**
 * 🔥 SUPER ADMIN → CREATE ADMIN + COMPANY
 */
const createAdminCompany = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    // create company
    const company = await Company.create({ name: companyName });

    // create admin
    const admin = await User.create({
      name,
      email,
      password: hash,
      role: "admin",
      companyId: company._id
    });

    company.createdBy = admin._id;
    await company.save();

    res.json({
      message: "Admin created by SuperAdmin",
      admin: {
        name: admin.name,
        email: admin.email
      },
      company: company.name
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 👥 VIEW ALL COMPANIES
 */
const getAllCompanies = async (req, res) => {
  const companies = await Company.find().populate("createdBy", "name email");
  res.json(companies);
};

/**
 * 👤 VIEW ALL ADMINS
 */
const getAllAdmins = async (req, res) => {
  const admins = await User.find({ role: "admin" }).populate("companyId");
  res.json(admins);
};

/**
 * ❌ DELETE COMPANY + USERS
 */
const deleteCompany = async (req, res) => {
  const { companyId } = req.params;

  await User.deleteMany({ companyId });
  await Company.findByIdAndDelete(companyId);

  res.json({ message: "Company & users deleted" });
};

/**
 * ✏️ SUPER ADMIN → UPDATE ADMIN
 */
const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, password } = req.body;

    const update = { name, email };

    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }

    const admin = await User.findOneAndUpdate(
      { _id: adminId, role: "admin" },
      update,
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Admin updated successfully",
      admin
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  createSuperAdmin,
  superAdminLogin,
  getSuperAdminProfile,
  updateSuperAdmin,
  deleteSuperAdmin,
  createAdminCompany,   // ✅ ADDED
  getAllCompanies,
  getAllAdmins,
  deleteCompany,
  updateAdmin
};
