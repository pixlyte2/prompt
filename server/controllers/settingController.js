const Setting = require("../models/Setting");

exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }
    
    res.json({ value: setting.value });
  } catch (error) {
    res.status(500).json({ message: "Failed to get setting" });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ message: "Setting updated successfully", setting });
  } catch (error) {
    res.status(500).json({ message: "Failed to update setting" });
  }
};
