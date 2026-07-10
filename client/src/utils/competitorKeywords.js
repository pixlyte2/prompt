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

function normalizeByType(byType) {
  const result = {};
  for (const [typeId, keywords] of Object.entries(byType || {})) {
    result[String(typeId)] = normalizeKeywordList(keywords);
  }
  return result;
}

function toScopeKey(typeId) {
  return String(typeId || "").trim();
}

function apiErrorMessage(err) {
  return err?.response?.data?.message || err?.message || "Could not save keywords";
}

function stateHasKeywords(state) {
  return Boolean(
    state?.cached?.length ||
    Object.values(state?.byType || {}).some((keywords) => keywords?.length),
  );
}

export function loadLocalTypeKeywords(typeId) {
  const scope = toScopeKey(typeId);
  if (!scope) return [];
  try {
    const raw = localStorage.getItem(`${COMP_KEYWORDS_STORAGE_PREFIX}${scope}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? normalizeKeywordList(parsed) : [];
  } catch {
    return [];
  }
}

export function saveLocalTypeKeywords(typeId, keywords) {
  const scope = toScopeKey(typeId);
  if (!scope) return;
  try {
    localStorage.setItem(
      `${COMP_KEYWORDS_STORAGE_PREFIX}${scope}`,
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
    const typeId = toScopeKey(type?._id);
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
    byType: normalizeByType(data?.byType),
  };
}

/** Merge multiple keyword lists; first-seen casing wins. */
export function mergeKeywordLists(...lists) {
  const seen = new Set();
  const result = [];
  for (const list of lists) {
    for (const keyword of list || []) {
      const trimmed = String(keyword || "").trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

export async function hydrateCompetitorKeywords() {
  try {
    let state = await fetchCompetitorKeywords();
    const isEmpty = !stateHasKeywords(state);

    if (isEmpty) {
      const local = collectLocalStorageKeywords();
      const hasLocal = stateHasKeywords(local);
      if (hasLocal) {
        const { data } = await api.post("/competitor-keywords/migrate", local);
        const migrated = {
          cached: normalizeKeywordList(data?.cached),
          byType: normalizeByType(data?.byType),
        };
        state = stateHasKeywords(migrated) || data?.migrated ? migrated : local;
      }
    }

    syncToLocalStorage(state);
    return { state, synced: true };
  } catch (err) {
    const local = collectLocalStorageKeywords();
    local.byType = normalizeByType(local.byType);
    local.cached = normalizeKeywordList(local.cached);
    return {
      state: local,
      synced: false,
      error: apiErrorMessage(err),
    };
  }
}

export async function persistTypeKeywords(typeId, keywords) {
  const scope = toScopeKey(typeId);
  const normalized = normalizeKeywordList(keywords);
  if (!scope) {
    return { ok: false, keywords: normalized, error: "Missing taxonomy id" };
  }

  try {
    await api.put(`/competitor-keywords/${encodeURIComponent(scope)}`, { keywords: normalized });
    saveLocalTypeKeywords(scope, normalized);
    return { ok: true, keywords: normalized };
  } catch (err) {
    saveLocalTypeKeywords(scope, normalized);
    return { ok: false, keywords: normalized, error: apiErrorMessage(err) };
  }
}

export async function persistCachedKeywords(keywords) {
  const normalized = normalizeKeywordList(keywords);
  try {
    await api.put("/competitor-keywords/cached", { keywords: normalized });
    saveLocalCachedKeywords(normalized);
    return { ok: true, keywords: normalized };
  } catch (err) {
    saveLocalCachedKeywords(normalized);
    return { ok: false, keywords: normalized, error: apiErrorMessage(err) };
  }
}
