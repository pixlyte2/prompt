const User = require("../models/User");
const Prompt = require("../models/prompt");
const Channel = require("../models/channel");

const getAdminStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [totalUsers, totalChannels, totalPrompts] =
      await Promise.all([
        User.countDocuments({ companyId }),
        Channel.countDocuments({ companyId }),
        Prompt.countDocuments({ companyId })
      ]);

    res.json({
      totalUsers,
      totalChannels,
      totalPrompts
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard stats"
    });
  }
};

module.exports = {
  getAdminStats
};
