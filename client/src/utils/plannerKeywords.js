/**
 * Planner category keywords use "Tamil - English" format:
 * Tamil text, space-dash-space, English translation.
 * Example: "வேலைவாய்ப்பு - employment"
 */

const TAMIL_ENGLISH_SEP = " - ";

/** True when keyword has non-empty Tamil and English parts separated by " - ". */
export function isTamilEnglishKeyword(kw) {
  const s = String(kw || "").trim();
  if (!s) return false;
  const sep = s.indexOf(TAMIL_ENGLISH_SEP);
  if (sep <= 0) return false;
  const tamil = s.slice(0, sep).trim();
  const english = s.slice(sep + TAMIL_ENGLISH_SEP.length).trim();
  return tamil.length > 0 && english.length > 0;
}

/** Match terms for a keyword — both Tamil and English parts when formatted, else the whole string. */
export function getKeywordMatchTerms(keyword) {
  const s = String(keyword || "").trim();
  if (!s) return [];
  if (isTamilEnglishKeyword(s)) {
    const sep = s.indexOf(TAMIL_ENGLISH_SEP);
    const tamil = s.slice(0, sep).trim();
    const english = s.slice(sep + TAMIL_ENGLISH_SEP.length).trim();
    return [tamil, english].filter(Boolean);
  }
  return [s];
}

/** A task/video title matches if it contains any match term (case-insensitive substring). */
export function videoTitleMatchesKeyword(video, keyword) {
  const title = String(video?.title || "").toLowerCase();
  const terms = getKeywordMatchTerms(keyword)
    .map((t) => t.toLowerCase())
    .filter(Boolean);
  if (terms.length === 0) return true;
  return terms.some((term) => title.includes(term));
}

/**
 * Split a title into plain/bold segments for keyword terms found in `keywords`.
 * Case-insensitive matching; original title casing is preserved in output.
 * Overlapping matches resolve by preferring the longest term first.
 */
export function getTitleKeywordHighlightSegments(title, keywords) {
  const raw = String(title || "");
  if (!raw || !Array.isArray(keywords) || keywords.length === 0) {
    return [{ text: raw, bold: false }];
  }

  const termsByLower = new Map();
  for (const kw of keywords) {
    for (const term of getKeywordMatchTerms(kw)) {
      const trimmed = String(term || "").trim();
      if (!trimmed) continue;
      const low = trimmed.toLowerCase();
      const existing = termsByLower.get(low);
      if (!existing || trimmed.length > existing.length) {
        termsByLower.set(low, trimmed);
      }
    }
  }

  if (termsByLower.size === 0) return [{ text: raw, bold: false }];

  const lowerTitle = raw.toLowerCase();
  const candidates = [];

  for (const [lowerTerm, term] of termsByLower) {
    let pos = 0;
    while (pos < lowerTitle.length) {
      const idx = lowerTitle.indexOf(lowerTerm, pos);
      if (idx === -1) break;
      candidates.push({ start: idx, end: idx + term.length, len: term.length });
      pos = idx + 1;
    }
  }

  if (candidates.length === 0) return [{ text: raw, bold: false }];

  candidates.sort((a, b) => b.len - a.len || a.start - b.start);

  const selected = [];
  for (const match of candidates) {
    const overlaps = selected.some(
      (s) => match.start < s.end && match.end > s.start,
    );
    if (!overlaps) selected.push(match);
  }
  selected.sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;
  for (const match of selected) {
    if (match.start > cursor) {
      segments.push({ text: raw.slice(cursor, match.start), bold: false });
    }
    segments.push({ text: raw.slice(match.start, match.end), bold: true });
    cursor = match.end;
  }
  if (cursor < raw.length) {
    segments.push({ text: raw.slice(cursor), bold: false });
  }
  return segments;
}

/** Read + decrypt the user's Gemini API key (same storage as AI Chat). */
export async function readGeminiApiKey() {
  const storedKey = localStorage.getItem("GEMINI_API_KEY_ENC");
  if (!storedKey) return { key: null, error: "missing" };
  try {
    const { decryptData } = await import("./encryption");
    const key = await decryptData(storedKey);
    if (!key) throw new Error("decrypt");
    return { key, error: null };
  } catch {
    return { key: null, error: "decrypt" };
  }
}
