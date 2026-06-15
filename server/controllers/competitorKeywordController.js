const mongoose = require("mongoose");
const CompetitorKeyword = require("../models/CompetitorKeyword");

const CACHED_SCOPE = "cached";
const MAX_KEYWORDS_PER_SCOPE = 200;

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

function normalizeKeywords(keywords) {
  const seen = new Set();
  const result = [];
  for (const keyword of keywords || []) {
    const trimmed = String(keyword || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result.slice(0, MAX_KEYWORDS_PER_SCOPE);
}

function isValidScope(scope) {
  if (!scope || typeof scope !== "string") return false;
  if (scope === CACHED_SCOPE) return true;
  return mongoose.Types.ObjectId.isValid(scope);
}

function toResponse(doc) {
  return normalizeKeywords(doc?.keywords);
}

async function findOrCreate(userId, scope) {
  let doc = await CompetitorKeyword.findOne({ userId, scope });
  if (!doc) {
    doc = await CompetitorKeyword.create({ userId, scope, keywords: [] });
  }
  return doc;
}

exports.getAllKeywords = async (req, res) => {
  try {
    const userId = getUserId(req);
    const docs = await CompetitorKeyword.find({ userId }).lean();

    const cachedDoc = docs.find((d) => d.scope === CACHED_SCOPE);
    const byType = {};

    for (const doc of docs) {
      if (doc.scope === CACHED_SCOPE) continue;
      byType[doc.scope] = normalizeKeywords(doc.keywords);
    }

    res.json({
      cached: normalizeKeywords(cachedDoc?.keywords),
      byType,
    });
  } catch (err) {
    console.error("getAllKeywords error:", err.message);
    res.status(500).json({ message: "Failed to load keywords" });
  }
};

exports.getKeywords = async (req, res) => {
  try {
    const { scope } = req.params;
    if (!isValidScope(scope)) {
      return res.status(400).json({ message: "Invalid scope" });
    }

    const userId = getUserId(req);
    const doc = await CompetitorKeyword.findOne({ userId, scope }).lean();
    res.json({ keywords: normalizeKeywords(doc?.keywords) });
  } catch (err) {
    console.error("getKeywords error:", err.message);
    res.status(500).json({ message: "Failed to load keywords" });
  }
};

exports.setKeywords = async (req, res) => {
  try {
    const { scope } = req.params;
    if (!isValidScope(scope)) {
      return res.status(400).json({ message: "Invalid scope" });
    }

    const keywords = normalizeKeywords(req.body?.keywords);
    const userId = getUserId(req);

    const doc = await CompetitorKeyword.findOneAndUpdate(
      { userId, scope },
      { keywords },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    res.json({ keywords: toResponse(doc) });
  } catch (err) {
    console.error("setKeywords error:", err.message);
    res.status(500).json({ message: "Failed to save keywords" });
  }
};

exports.addKeyword = async (req, res) => {
  try {
    const { scope } = req.params;
    if (!isValidScope(scope)) {
      return res.status(400).json({ message: "Invalid scope" });
    }

    const trimmed = String(req.body?.keyword || "").trim();
    if (!trimmed) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const userId = getUserId(req);
    const doc = await findOrCreate(userId, scope);
    const keywords = normalizeKeywords(doc.keywords);

    if (keywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      return res.status(409).json({ message: "Keyword already exists", keywords });
    }

    keywords.push(trimmed);
    doc.keywords = keywords.slice(0, MAX_KEYWORDS_PER_SCOPE);
    await doc.save();

    res.status(201).json({ keywords: toResponse(doc) });
  } catch (err) {
    console.error("addKeyword error:", err.message);
    res.status(500).json({ message: "Failed to add keyword" });
  }
};

exports.removeKeyword = async (req, res) => {
  try {
    const { scope } = req.params;
    if (!isValidScope(scope)) {
      return res.status(400).json({ message: "Invalid scope" });
    }

    const trimmed = String(req.body?.keyword || "").trim();
    if (!trimmed) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const userId = getUserId(req);
    const doc = await CompetitorKeyword.findOne({ userId, scope });
    if (!doc) {
      return res.json({ keywords: [] });
    }

    doc.keywords = normalizeKeywords(doc.keywords).filter(
      (k) => k.toLowerCase() !== trimmed.toLowerCase(),
    );
    await doc.save();

    res.json({ keywords: toResponse(doc) });
  } catch (err) {
    console.error("removeKeyword error:", err.message);
    res.status(500).json({ message: "Failed to remove keyword" });
  }
};

/** Hydrate DB from client localStorage when user has no saved keywords yet. */
exports.migrateKeywords = async (req, res) => {
  try {
    const userId = getUserId(req);
    const incomingCached = normalizeKeywords(req.body?.cached);
    const incomingByType = req.body?.byType && typeof req.body.byType === "object"
      ? req.body.byType
      : {};

    const existing = await CompetitorKeyword.find({ userId }).lean();
    const existingScopes = new Set(existing.map((d) => d.scope));
    const hasAnyExisting = existing.some((d) => normalizeKeywords(d.keywords).length > 0);

    if (hasAnyExisting) {
      const cachedDoc = existing.find((d) => d.scope === CACHED_SCOPE);
      const byType = {};
      for (const doc of existing) {
        if (doc.scope === CACHED_SCOPE) continue;
        byType[doc.scope] = normalizeKeywords(doc.keywords);
      }
      return res.json({
        migrated: false,
        cached: normalizeKeywords(cachedDoc?.keywords),
        byType,
      });
    }

    const writes = [];

    if (incomingCached.length && !existingScopes.has(CACHED_SCOPE)) {
      writes.push({ userId, scope: CACHED_SCOPE, keywords: incomingCached });
    }

    for (const [typeId, keywords] of Object.entries(incomingByType)) {
      if (!isValidScope(typeId) || typeId === CACHED_SCOPE) continue;
      const normalized = normalizeKeywords(keywords);
      if (!normalized.length || existingScopes.has(typeId)) continue;
      writes.push({ userId, scope: typeId, keywords: normalized });
    }

    if (writes.length) {
      await CompetitorKeyword.insertMany(writes, { ordered: false }).catch((err) => {
        if (err.code !== 11000) throw err;
      });
    }

    const docs = await CompetitorKeyword.find({ userId }).lean();
    const cachedDoc = docs.find((d) => d.scope === CACHED_SCOPE);
    const byType = {};
    for (const doc of docs) {
      if (doc.scope === CACHED_SCOPE) continue;
      byType[doc.scope] = normalizeKeywords(doc.keywords);
    }

    res.json({
      migrated: writes.length > 0,
      cached: normalizeKeywords(cachedDoc?.keywords),
      byType,
    });
  } catch (err) {
    console.error("migrateKeywords error:", err.message);
    res.status(500).json({ message: "Failed to migrate keywords" });
  }
};
