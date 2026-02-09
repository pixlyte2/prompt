const User = require("../models/User");
const Prompt = require("../models/prompt");

const getAdminStats = async (req, res) => {
  const companyId = req.user.companyId;

  const totalUsers = await User.countDocuments({ companyId });
  const totalPrompts = await Prompt.countDocuments({ companyId });

  res.json({ totalUsers, totalPrompts });
};


module.exports={
    getAdminStats
}