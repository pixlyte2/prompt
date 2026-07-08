const mongoose = require("mongoose");
const PlannerConfig = require("../models/PlannerConfig");

const MAX_CATEGORIES = 50;
const MAX_SUBCATEGORIES = 50;

function resolveUserId(req) {
  const raw = req.user?.id || req.user?._id;
  if (!raw) return null;
  const id = String(raw);
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function clampPercentage(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeSubcategories(list) {
  const seen = new Set();
  const result = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const trimmed = String(raw || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= MAX_SUBCATEGORIES) break;
  }
  return result;
}

function normalizeCategories(list) {
  const seen = new Set();
  const result = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const name = String(raw?.name || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      name,
      percentage: clampPercentage(raw?.percentage),
      subcategories: normalizeSubcategories(raw?.subcategories),
    });
    if (result.length >= MAX_CATEGORIES) break;
  }
  return result;
}

function toConfigResponse(doc) {
  return {
    categories: normalizeCategories(doc?.categories),
    totalVideos:
      Number.isFinite(Number(doc?.totalVideos)) && Number(doc.totalVideos) > 0
        ? Number(doc.totalVideos)
        : 10,
  };
}

exports.getConfig = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const doc = await PlannerConfig.findOne({ userId }).lean();
    return res.json(toConfigResponse(doc));
  } catch (err) {
    console.error("categories getConfig error:", err.message);
    return res.status(500).json({ message: "Failed to load categories" });
  }
};

exports.saveConfig = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const categories = normalizeCategories(req.body?.categories);
    const totalRaw = Number(req.body?.totalVideos);
    const totalVideos =
      Number.isFinite(totalRaw) && totalRaw > 0
        ? Math.min(500, Math.round(totalRaw))
        : 10;

    const doc = await PlannerConfig.findOneAndUpdate(
      { userId },
      { $set: { categories, totalVideos } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    return res.json(toConfigResponse(doc));
  } catch (err) {
    console.error("categories saveConfig error:", err.message);
    return res.status(500).json({ message: "Failed to save categories" });
  }
};
