const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * 🔑 LOGIN (Admin / Content Manager / Viewer)
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user.email, "Role:", user.role);

    // compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({ message: "Wrong password" });
    }

    // ❌ block superadmin here (they have separate login)
    if (user.role === "superadmin") {
      return res.status(403).json({ message: "Use superadmin login" });
    }

    // token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Login successful for:", email);

    res.json({
      token,
      role: user.role,
      companyId: user.companyId
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  login
};
