const User = require("../models/user");
const bcrypt = require("bcryptjs");

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body;

    if (!["content_manager", "viewer", "voice_over"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      companyId: req.user.companyId,
      active: active !== false
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active !== false
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUsers = async (req, res) => {
  const users = await User.find(
    { companyId: req.user.companyId },
    "-password"
  );
  res.json(users);
};

const deleteUser = async (req, res) => {
  await User.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });
  res.json({ message: "User deleted" });
};

const updateUser = async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body;

    const user = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({ message: "Cannot edit this account" });
    }

    if (name !== undefined) {
      const n = String(name).trim();
      if (!n) return res.status(400).json({ message: "Name is required" });
      user.name = n;
    }

    if (email !== undefined) {
      const e = String(email).trim();
      if (!e) return res.status(400).json({ message: "Email is required" });
      const dup = await User.findOne({ email: e, _id: { $ne: user._id } });
      if (dup) return res.status(400).json({ message: "Email already in use" });
      user.email = e;
    }

    if (role !== undefined && user.role !== "admin") {
      if (!["content_manager", "viewer", "voice_over"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }

    if (password != null && String(password).trim()) {
      user.password = await bcrypt.hash(String(password).trim(), 10);
    }

    if (active !== undefined) {
      user.active = active !== false;
    }

    await user.save();

    const out = user.toObject();
    delete out.password;
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  deleteUser,
  updateUser,
};
