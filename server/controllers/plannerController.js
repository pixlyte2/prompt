const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PlannerConfig = require("../models/PlannerConfig");

const MAX_CATEGORIES = 50;

/** Supported Gemini models (mirrors aiController). */
const GEMINI_MODEL_MAP = {
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gemini-2.0-flash": "gemini-2.0-flash",
  "gemini-flash-latest": "gemini-flash-latest",
  "gemini-pro-latest": "gemini-pro-latest",
};

const AI_CATEGORIZE_MAX_TITLES = 200;
const AI_CATEGORIZE_MAX_KEYWORDS_PER_TITLE = 3;
const AI_KEYWORD_MAX_LEN = 40;
const AI_CATEGORIZE_PROMPT_MAX_LEN = 8000;

/** Tamil-English keyword format: "Tamil text - English text" (space-dash-space separator). */
const TAMIL_ENGLISH_SEP = " - ";

function isTamilEnglishKeyword(kw) {
  const s = String(kw || "").trim();
  if (!s) return false;
  const sep = s.indexOf(TAMIL_ENGLISH_SEP);
  if (sep <= 0) return false;
  const tamil = s.slice(0, sep).trim();
  const english = s.slice(sep + TAMIL_ENGLISH_SEP.length).trim();
  return tamil.length > 0 && english.length > 0;
}

/** Default prompt template — {{CATEGORIES}} and {{TITLES}} are replaced at runtime. */
const DEFAULT_AI_CATEGORIZE_PROMPT_TEMPLATE = `You are a precise content-classification assistant for a video/task planner.

You are given a fixed list of TAXONOMIES ({{CATEGORIES}}) and a list of uncategorized TITLES. For every title:
1. Choose the SINGLE best-fitting taxonomy from the list below, or "none" if no taxonomy is a sensible fit. You MUST NOT invent taxonomies — only use names exactly as written in the list, or the literal string "none".
2. Extract 1-{{MAX_KEYWORDS}} keyword pairs in "Tamil - English" format: Tamil term taken from or strongly implied by the title, then " - " (space, dash, space), then a concise English translation (1-3 words). Example: "வேலைவாய்ப்பு - employment". These keywords will be added to the chosen taxonomy and later used for case-insensitive substring matching of future titles against EITHER the Tamil OR English part, so both sides must be meaningful and specific enough to match similar titles. Do not include keywords when the taxonomy is "none".

TAXONOMIES:
{{CATEGORIES}}

TITLES:
{{TITLES}}

Respond with ONLY valid JSON, no markdown, in exactly this shape:
{"mappings":[{"title":"<the exact title text>","category":"<one taxonomy name from the list or none>","keywords":["Tamil - English",...]}]}`;

const DEFAULT_FORMAT_KEYWORDS_PROMPT_TEMPLATE = `You are a precise Tamil-English keyword formatter for a video/task planner.

Convert each keyword below into "Tamil - English" format: Tamil text, then " - " (space, dash, space), then a concise English translation. Preserve the original meaning. If a keyword is already in correct "Tamil - English" format, return it unchanged.

Taxonomy context: {{CATEGORY}}

Keywords to format:
{{KEYWORDS}}

Respond with ONLY valid JSON, no markdown, in exactly this shape:
{"keywords":["Tamil - English",...]}

Return exactly one entry per input keyword, in the same order.`;

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

function normalizeAiCategorizePrompt(value) {
  if (value == null || value === "") return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, AI_CATEGORIZE_PROMPT_MAX_LEN);
}

function formatCategoryLines(categories) {
  return categories
    .map((c) => {
      const kws = Array.isArray(c.subcategories) ? c.subcategories : [];
      return `- ${c.name}${kws.length ? ` (existing keywords: ${kws.join(", ")})` : ""}`;
    })
    .join("\n");
}

function formatTitleLines(titles) {
  return titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
}

/** Substitute placeholders in a prompt template. Falls back to default when template is empty. */
function buildAiCategorizePrompt(template, categories, titles) {
  const base = (template && String(template).trim()) || DEFAULT_AI_CATEGORIZE_PROMPT_TEMPLATE;
  const categoryLines = formatCategoryLines(categories);
  const titleLines = formatTitleLines(titles);

  let prompt = base
    .replace(/\{\{MAX_KEYWORDS\}\}/g, String(AI_CATEGORIZE_MAX_KEYWORDS_PER_TITLE))
    .replace(/\{\{CATEGORIES\}\}/g, categoryLines)
    .replace(/\{\{TITLES\}\}/g, titleLines);

  // If the user removed placeholders, append the data blocks so the request still works.
  if (!base.includes("{{CATEGORIES}}")) {
    prompt += `\n\nTAXONOMIES:\n${categoryLines}`;
  }
  if (!base.includes("{{TITLES}}")) {
    prompt += `\n\nTITLES:\n${titleLines}`;
  }

  return prompt;
}

function toConfigResponse(doc) {
  const storedPrompt = normalizeAiCategorizePrompt(doc?.aiCategorizePrompt);
  return {
    categories: normalizeCategories(doc?.categories),
    totalVideos:
      Number.isFinite(Number(doc?.totalVideos)) && Number(doc.totalVideos) > 0
        ? Number(doc.totalVideos)
        : 10,
    aiCategorizePrompt: storedPrompt,
    defaultAiCategorizePrompt: DEFAULT_AI_CATEGORIZE_PROMPT_TEMPLATE,
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
    return res.status(500).json({ message: "Failed to load taxonomies" });
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

    const update = { categories, totalVideos };

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "aiCategorizePrompt")) {
      update.aiCategorizePrompt = normalizeAiCategorizePrompt(req.body.aiCategorizePrompt);
    }

    const doc = await PlannerConfig.findOneAndUpdate(
      { userId },
      { $set: update },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    return res.json(toConfigResponse(doc));
  } catch (err) {
    console.error("categories saveConfig error:", err.message);
    return res.status(500).json({ message: "Failed to save taxonomies" });
  }
};

/** Sanitize an AI-suggested keyword term (short, trimmed, non-empty). */
function sanitizeSuggestedKeyword(raw) {
  const term = String(raw || "").trim().replace(/\s+/g, " ");
  if (!term) return "";
  if (term.length > AI_KEYWORD_MAX_LEN) return term.slice(0, AI_KEYWORD_MAX_LEN).trim();
  return term;
}

/** Best-effort extraction of the first JSON object/array from a model response. */
function parseModelJson(text) {
  const cleaned = String(text || "").replace(/```json\n?|```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to grabbing the outermost braces if the model added prose.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * POST /planner/categories/ai-categorize
 *
 * Uses Gemini to map uncategorized task/video titles to one of the caller's
 * existing planner categories (or "none"), and to derive concise keyword terms
 * that should be added to that category so future rule-based (substring)
 * matching in the Analyze modal picks up similar titles.
 *
 * Body: { titles: string[], categories: [{ name, subcategories: string[] }],
 *         apiKey: string, aiModel?: string }
 * Returns: { mappings: [{ title, category, suggestedKeywords: string[] }] }
 *
 * The API key is provided by the client (same pattern as /ai/chat and
 * /ai/assistant): it is stored encrypted in the browser and never persisted
 * server-side. No provider key is read from the environment.
 */
exports.aiCategorize = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { apiKey, aiModel } = req.body || {};

    const titles = Array.from(
      new Set(
        (Array.isArray(req.body?.titles) ? req.body.titles : [])
          .map((t) => String(t || "").trim())
          .filter(Boolean),
      ),
    ).slice(0, AI_CATEGORIZE_MAX_TITLES);

    const categories = normalizeCategories(req.body?.categories);

    if (!apiKey || !String(apiKey).trim()) {
      return res.status(400).json({
        message:
          "Gemini API key is required. Add it in AI Chat → Settings to use AI taxonomy.",
      });
    }
    if (titles.length === 0) {
      return res.status(400).json({ message: "No uncategorized titles to analyze." });
    }
    if (categories.length === 0) {
      return res.status(400).json({ message: "No taxonomies configured to match against." });
    }

    const modelId = GEMINI_MODEL_MAP[aiModel] || "gemini-2.5-flash";

    // Case-insensitive lookup from any casing the model returns to the canonical name.
    const canonicalByLower = new Map(categories.map((c) => [c.name.toLowerCase(), c.name]));

    // Custom prompt: request body > stored planner config > built-in default.
    let promptTemplate = normalizeAiCategorizePrompt(req.body?.customPrompt);
    if (!promptTemplate) {
      const configDoc = await PlannerConfig.findOne({ userId }).lean();
      promptTemplate = normalizeAiCategorizePrompt(configDoc?.aiCategorizePrompt);
    }

    const prompt = buildAiCategorizePrompt(promptTemplate, categories, titles);

    const genAI = new GoogleGenerativeAI(String(apiKey));
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    let parsed;
    try {
      const result = await model.generateContent(prompt);
      parsed = parseModelJson(result.response.text());
    } catch (aiError) {
      console.error("aiCategorize Gemini error:", aiError.message);
      if (aiError.message?.includes("API key") || aiError.message?.includes("API_KEY")) {
        return res
          .status(401)
          .json({ message: "Invalid Gemini API key. Check it in AI Chat → Settings." });
      }
      return res
        .status(502)
        .json({ message: `AI request failed: ${aiError.message || "unknown error"}` });
    }

    const rawMappings = Array.isArray(parsed?.mappings) ? parsed.mappings : [];
    const titleSet = new Set(titles.map((t) => t.toLowerCase()));

    const mappings = [];
    const seenTitles = new Set();
    for (const entry of rawMappings) {
      const title = String(entry?.title || "").trim();
      if (!title) continue;
      const titleKey = title.toLowerCase();
      // Only keep titles we actually asked about, once each.
      if (!titleSet.has(titleKey) || seenTitles.has(titleKey)) continue;

      const rawCategory = String(entry?.category || "").trim().toLowerCase();
      if (!rawCategory || rawCategory === "none") continue;
      const canonical = canonicalByLower.get(rawCategory);
      if (!canonical) continue; // Never accept a category outside the provided list.

      const seenKw = new Set();
      const suggestedKeywords = [];
      for (const kw of Array.isArray(entry?.keywords) ? entry.keywords : []) {
        const term = sanitizeSuggestedKeyword(kw);
        if (!term) continue;
        const key = term.toLowerCase();
        if (seenKw.has(key)) continue;
        seenKw.add(key);
        suggestedKeywords.push(term);
        if (suggestedKeywords.length >= AI_CATEGORIZE_MAX_KEYWORDS_PER_TITLE) break;
      }
      if (suggestedKeywords.length === 0) continue;

      seenTitles.add(titleKey);
      mappings.push({ title, category: canonical, suggestedKeywords });
    }

    return res.json({ mappings });
  } catch (err) {
    console.error("aiCategorize error:", err.message);
    return res.status(500).json({ message: "Failed to auto-taxonomize titles" });
  }
};

function buildFormatKeywordsPrompt(categoryName, keywords) {
  const lines = keywords.map((k, i) => `${i + 1}. ${k}`).join("\n");
  return DEFAULT_FORMAT_KEYWORDS_PROMPT_TEMPLATE
    .replace(/\{\{CATEGORY\}\}/g, String(categoryName || "").trim() || "(unspecified)")
    .replace(/\{\{KEYWORDS\}\}/g, lines);
}

/**
 * POST /planner/categories/format-keywords
 *
 * Reformats non-conforming category keywords to "Tamil - English" format via Gemini.
 * Keywords already in the correct format are returned unchanged.
 *
 * Body: { categoryName?: string, keywords: string[], apiKey: string, aiModel?: string }
 * Returns: { keywords: string[] }
 */
exports.formatKeywords = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { apiKey, aiModel, categoryName } = req.body || {};
    const rawKeywords = Array.isArray(req.body?.keywords) ? req.body.keywords : [];
    const keywords = normalizeSubcategories(rawKeywords);

    if (!apiKey || !String(apiKey).trim()) {
      return res.status(400).json({
        message:
          "Gemini API key is required. Add it in AI Chat → Settings to format keywords.",
      });
    }
    if (keywords.length === 0) {
      return res.status(400).json({ message: "No keywords to format." });
    }

    const indicesToFormat = [];
    const toFormat = [];
    for (let i = 0; i < keywords.length; i += 1) {
      if (!isTamilEnglishKeyword(keywords[i])) {
        indicesToFormat.push(i);
        toFormat.push(keywords[i]);
      }
    }

    if (toFormat.length === 0) {
      return res.json({ keywords });
    }

    const modelId = GEMINI_MODEL_MAP[aiModel] || "gemini-2.5-flash";
    const prompt = buildFormatKeywordsPrompt(categoryName, toFormat);

    const genAI = new GoogleGenerativeAI(String(apiKey));
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    let parsed;
    try {
      const result = await model.generateContent(prompt);
      parsed = parseModelJson(result.response.text());
    } catch (aiError) {
      console.error("formatKeywords Gemini error:", aiError.message);
      if (aiError.message?.includes("API key") || aiError.message?.includes("API_KEY")) {
        return res
          .status(401)
          .json({ message: "Invalid Gemini API key. Check it in AI Chat → Settings." });
      }
      return res
        .status(502)
        .json({ message: `AI request failed: ${aiError.message || "unknown error"}` });
    }

    const formatted = Array.isArray(parsed?.keywords) ? parsed.keywords : [];
    if (formatted.length !== toFormat.length) {
      return res.status(502).json({
        message: `AI returned ${formatted.length} keywords but ${toFormat.length} were expected.`,
      });
    }

    const resultKeywords = [...keywords];
    for (let j = 0; j < indicesToFormat.length; j += 1) {
      const term = sanitizeSuggestedKeyword(formatted[j]);
      if (term && isTamilEnglishKeyword(term)) {
        resultKeywords[indicesToFormat[j]] = term;
      } else if (term) {
        // Keep AI output even if validation is loose — user can edit in draft.
        resultKeywords[indicesToFormat[j]] = term;
      }
    }

    return res.json({ keywords: normalizeSubcategories(resultKeywords) });
  } catch (err) {
    console.error("formatKeywords error:", err.message);
    return res.status(500).json({ message: "Failed to format keywords" });
  }
};
