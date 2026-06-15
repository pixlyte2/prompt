import { httpClient as api } from "../services/api";

export const COMP_KEYWORDS_STORAGE_PREFIX = "competitor-keywords-";
export const COMP_CACHED_KEYWORDS_STORAGE = "competitor-keywords-cached";

function normalizeKeywordList(keywords) {
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
  return result;
}

export function loadLocalTypeKeywords(typeId) {
  if (!typeId) return [];
  try {
    const raw = localStorage.getItem(`${COMP_KEYWORDS_STORAGE_PREFIX}${typeId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? normalizeKeywordList(parsed) : [];
  } catch {
    return [];
  }
}

export function saveLocalTypeKeywords(typeId, keywords) {
  if (!typeId) return;
  try {
    localStorage.setItem(
      `${COMP_KEYWORDS_STORAGE_PREFIX}${typeId}`,
      JSON.stringify(normalizeKeywordList(keywords)),
    );
  } catch {
    // Quota or privacy mode — API remains source of truth when online.
  }
}

export function loadLocalCachedKeywords() {
  try {
    const raw = localStorage.getItem(COMP_CACHED_KEYWORDS_STORAGE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? normalizeKeywordList(parsed) : [];
  } catch {
    return [];
  }
}

export function saveLocalCachedKeywords(keywords) {
  try {
    localStorage.setItem(
      COMP_CACHED_KEYWORDS_STORAGE,
      JSON.stringify(normalizeKeywordList(keywords)),
    );
  } catch {
    // ignore
  }
}

export function collectLocalStorageKeywords() {
  const byType = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(COMP_KEYWORDS_STORAGE_PREFIX)) continue;
      const typeId = key.slice(COMP_KEYWORDS_STORAGE_PREFIX.length);
      if (!typeId) continue;
      byType[typeId] = loadLocalTypeKeywords(typeId);
    }
  } catch {
    // ignore
  }
  return {
    cached: loadLocalCachedKeywords(),
    byType,
  };
}

function syncToLocalStorage(state) {
  saveLocalCachedKeywords(state.cached || []);
  for (const [typeId, keywords] of Object.entries(state.byType || {})) {
    saveLocalTypeKeywords(typeId, keywords);
  }
}

/** Sort keywords by match count descending; 0-count last; alphabetical tie-breaker. */
export function sortKeywordsByMatchCount(keywords, counts) {
  return [...(keywords || [])].sort((a, b) => {
    const countA = counts?.[a] ?? 0;
    const countB = counts?.[b] ?? 0;
    const rankA = countA > 0 ? countA : -1;
    const rankB = countB > 0 ? countB : -1;
    if (rankB !== rankA) return rankB - rankA;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}

export function unionKeywords(types, keywordsState) {
  const seen = new Set();
  const result = [];
  const add = (keyword) => {
    const trimmed = String(keyword || "").trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  };

  (types || []).forEach((type) => {
    const typeId = type?._id;
    if (!typeId) return;
    const keywords = keywordsState?.byType?.[typeId] || loadLocalTypeKeywords(typeId);
    keywords.forEach(add);
  });
  (keywordsState?.cached || []).forEach(add);
  return result;
}

export async function fetchCompetitorKeywords() {
  const { data } = await api.get("/competitor-keywords");
  return {
    cached: normalizeKeywordList(data?.cached),
    byType: data?.byType && typeof data.byType === "object" ? data.byType : {},
  };
}

export async function hydrateCompetitorKeywords() {
  try {
    let state = await fetchCompetitorKeywords();
    const isEmpty =
      !state.cached.length &&
      !Object.values(state.byType).some((keywords) => keywords?.length);

    if (isEmpty) {
      const local = collectLocalStorageKeywords();
      const hasLocal =
        local.cached.length ||
        Object.values(local.byType).some((keywords) => keywords?.length);
      if (hasLocal) {
        const { data } = await api.post("/competitor-keywords/migrate", local);
        state = {
          cached: normalizeKeywordList(data?.cached),
          byType: data?.byType && typeof data.byType === "object" ? data.byType : {},
        };
      }
    }

    Object.keys(state.byType).forEach((typeId) => {
      state.byType[typeId] = normalizeKeywordList(state.byType[typeId]);
    });
    syncToLocalStorage(state);
    return state;
  } catch {
    const local = collectLocalStorageKeywords();
    Object.keys(local.byType).forEach((typeId) => {
      local.byType[typeId] = normalizeKeywordList(local.byType[typeId]);
    });
    local.cached = normalizeKeywordList(local.cached);
    return local;
  }
}

export async function persistTypeKeywords(typeId, keywords) {
  const normalized = normalizeKeywordList(keywords);
  saveLocalTypeKeywords(typeId, normalized);
  try {
    await api.put(`/competitor-keywords/${typeId}`, { keywords: normalized });
  } catch {
    // Offline — localStorage keeps keywords for this device until next sync.
  }
  return normalized;
}

export async function persistCachedKeywords(keywords) {
  const normalized = normalizeKeywordList(keywords);
  saveLocalCachedKeywords(normalized);
  try {
    await api.put("/competitor-keywords/cached", { keywords: normalized });
  } catch {
    // Offline fallback
  }
  return normalized;
}
