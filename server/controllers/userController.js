const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!["content_manager", "viewer"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      companyId: req.user.companyId
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
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

module.exports = {
  createUser,
  getUsers,
  deleteUser
};
