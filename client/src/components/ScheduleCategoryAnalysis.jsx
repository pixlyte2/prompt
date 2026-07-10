import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  X,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  Check,
  Wand2,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  ListVideo,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import {
  videoTitleMatchesKeyword,
  readGeminiApiKey,
  isTamilEnglishKeyword,
  getTitleKeywordHighlightSegments,
} from "../utils/plannerKeywords";

export { videoTitleMatchesKeyword, isTamilEnglishKeyword };

/**
 * Shared "Category distribution" analysis used across date-group headers
 * (Trending Hub schedule, Production Hub, Voice-over console, Script library).
 *
 * A group of tasks for a given date is compared against the planner category
 * config (target % vs actual %). Tasks are matched to categories by title.
 * Keywords in "Tamil - English" format match if the title contains either part.
 */

/** Normalize a planner category's subcategory terms from either input shape. */
export function getEffectiveCategorySubcategories(category) {
  if (category?.subcategoriesInput != null) {
    return String(category.subcategoriesInput)
      .split(",")
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }
  return (Array.isArray(category?.subcategories) ? category.subcategories : [])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
}

/** A video belongs to a category if its title matches any subcategory term
 *  (or the category name when there are no subcategories). */
export function videoMatchesPlannerCategory(video, category) {
  const subs = getEffectiveCategorySubcategories(category);
  if (subs.length === 0) return videoTitleMatchesKeyword(video, category?.name);
  return subs.some((s) => videoTitleMatchesKeyword(video, s));
}

/**
 * Titles of tasks that match NO planner category (the "Uncategorized" bucket).
 * De-duplicated (case-insensitive) so the AI only classifies each distinct title once.
 */
export function getUncategorizedTaskTitles(tasks, categories) {
  const list = Array.isArray(tasks) ? tasks : [];
  const normalizedCategories = (Array.isArray(categories) ? categories : [])
    .map((cat) => ({
      name: String(cat?.name || "").trim(),
      subcategories: getEffectiveCategorySubcategories(cat),
    }))
    .filter((cat) => cat.name);

  const seen = new Set();
  const titles = [];
  for (const task of list) {
    const title = String(task?.title || "").trim();
    if (!title) continue;
    const matched = normalizedCategories.some((cat) => videoMatchesPlannerCategory(task, cat));
    if (matched) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    titles.push(title);
  }
  return titles;
}

/**
 * Full task objects assigned to a specific planner category (first-match
 * assignment — same logic as buildScheduleCategoryDistribution).
 */
export function getTasksForPlannerCategory(tasks, categories, categoryName) {
  const list = Array.isArray(tasks) ? tasks : [];
  const targetName = String(categoryName || "").trim();
  if (!targetName) return [];

  const normalizedCategories = (Array.isArray(categories) ? categories : [])
    .map((cat) => ({
      name: String(cat?.name || "").trim(),
      subcategories: getEffectiveCategorySubcategories(cat),
    }))
    .filter((cat) => cat.name);

  const result = [];
  for (const task of list) {
    const matched = normalizedCategories.find((cat) => videoMatchesPlannerCategory(task, cat));
    if (matched?.name === targetName) result.push(task);
  }
  return result;
}

/**
 * Full task objects that match NO planner category (same logic as the
 * "Uncategorized" bucket in buildScheduleCategoryDistribution).
 */
export function getUncategorizedTasks(tasks, categories) {
  const list = Array.isArray(tasks) ? tasks : [];
  const normalizedCategories = (Array.isArray(categories) ? categories : [])
    .map((cat) => ({
      name: String(cat?.name || "").trim(),
      subcategories: getEffectiveCategorySubcategories(cat),
    }))
    .filter((cat) => cat.name);

  const result = [];
  for (const task of list) {
    const matched = normalizedCategories.some((cat) => videoMatchesPlannerCategory(task, cat));
    if (!matched) result.push(task);
  }
  return result;
}

function formatTaskAssignee(task) {
  const assignedTo = task?.assignedTo;
  if (!assignedTo || (Array.isArray(assignedTo) && assignedTo.length === 0)) return null;
  const arr = Array.isArray(assignedTo) ? assignedTo.filter(Boolean) : [assignedTo].filter(Boolean);
  return arr.length > 0 ? arr.join(", ") : null;
}

function formatTaskVideoFormat(task) {
  const fmt = task?.videoFormat;
  if (fmt === "short") return "Short";
  if (fmt === "long") return "Long";
  return null;
}

/**
 * Compares tasks for a date against the planner category config.
 *
 * Each task is assigned to the FIRST planner category (in config order) whose
 * subcategory terms match the task title. This first-match assignment keeps
 * every task in exactly one bucket so the actual percentages sum to 100. Tasks
 * that match no category fall into "Uncategorized".
 *
 * Actual % = round((tasks in category / total tasks) * 100)
 * Target % = configured category percentage
 * Expected count = round((total tasks × target %) / 100)
 * Count gap = actual count − expected count (positive = over, negative = under)
 */
export function buildScheduleCategoryDistribution(tasks, categories) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;

  const normalizedCategories = (Array.isArray(categories) ? categories : [])
    .map((cat) => ({
      name: String(cat?.name || "").trim(),
      percentage: Math.max(0, Math.min(100, Math.round(Number(cat?.percentage) || 0))),
      subcategories: getEffectiveCategorySubcategories(cat),
    }))
    .filter((cat) => cat.name);

  const counts = new Map(normalizedCategories.map((cat) => [cat.name, 0]));
  let uncategorized = 0;

  for (const task of list) {
    const matched = normalizedCategories.find((cat) => videoMatchesPlannerCategory(task, cat));
    if (matched) counts.set(matched.name, (counts.get(matched.name) || 0) + 1);
    else uncategorized += 1;
  }

  const pct = (count) => (total > 0 ? Math.round((count / total) * 100) : 0);

  const rows = normalizedCategories.map((cat) => {
    const count = counts.get(cat.name) || 0;
    const actualPct = pct(count);
    const expectedCount = total > 0 ? Math.round((total * cat.percentage) / 100) : 0;
    const countDelta = count - expectedCount;
    return {
      name: cat.name,
      target: cat.percentage,
      actual: actualPct,
      count,
      expectedCount,
      countDelta,
      isUncategorized: false,
    };
  });

  if (uncategorized > 0) {
    const actualPct = pct(uncategorized);
    rows.push({
      name: "Uncategorized",
      target: null,
      actual: actualPct,
      count: uncategorized,
      expectedCount: null,
      countDelta: null,
      isUncategorized: true,
    });
  }

  return {
    rows,
    total,
    targetTotal: normalizedCategories.reduce((sum, cat) => sum + cat.percentage, 0),
    hasConfig: normalizedCategories.length > 0,
  };
}

/**
 * Loads planner categories (target percentages) from /planner/config.
 * Non-fatal on failure: the Analyze modal shows a "no categories configured"
 * state when the list is empty.
 */
export function usePlannerCategories(enabled = true) {
  const [categories, setCategories] = useState([]);
  const [totalVideos, setTotalVideos] = useState(null);
  const [aiCategorizePrompt, setAiCategorizePrompt] = useState(null);
  const [defaultAiCategorizePrompt, setDefaultAiCategorizePrompt] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  /** Apply PUT response immediately so modals that reopen before GET finishes see fresh data. */
  const applySaved = useCallback((payload) => {
    if (Array.isArray(payload?.categories)) {
      setCategories(payload.categories);
    }
    const savedTotal = Number(payload?.totalVideos);
    if (Number.isFinite(savedTotal) && savedTotal > 0) {
      setTotalVideos(savedTotal);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/planner/config");
        if (!cancelled) {
          setCategories(Array.isArray(data?.categories) ? data.categories : []);
          const savedTotal = Number(data?.totalVideos);
          setTotalVideos(
            Number.isFinite(savedTotal) && savedTotal > 0 ? savedTotal : null,
          );
          setAiCategorizePrompt(data?.aiCategorizePrompt ?? null);
          setDefaultAiCategorizePrompt(String(data?.defaultAiCategorizePrompt || ""));
        }
      } catch {
        // Non-fatal: Analyze will show a "no categories configured" state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadToken]);

  return {
    categories,
    totalVideos,
    aiCategorizePrompt,
    defaultAiCategorizePrompt,
    refresh,
    applySaved,
  };
}

export function ScheduleCategoryGapBadge({ row, prominent = false }) {
  const sizeCls = prominent ? "text-xs px-2.5 py-1" : "text-[11px] px-2 py-0.5";
  const iconSize = prominent ? 12 : 10;

  if (row?.isUncategorized || row?.countDelta == null) {
    return <span className="text-xs tabular-nums buffer-text-subtle">—</span>;
  }

  const gap = row.countDelta;
  const tooltip = getGapTooltip(row);

  if (gap === 0) {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full font-medium border bg-blue-50 dark:bg-blue-950/25 text-blue-700 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/40 ${sizeCls}`}
      >
        <Check size={iconSize} aria-hidden />
        <span className="tabular-nums">0</span>
      </span>
    );
  }

  const over = gap > 0;
  const pillCls = over
    ? "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/40"
    : "bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/40";

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-0.5 rounded-full font-semibold tabular-nums border ${pillCls} ${sizeCls}`}
    >
      {over ? <TrendingUp size={iconSize} aria-hidden /> : <TrendingDown size={iconSize} aria-hidden />}
      {over ? "+" : "−"}
      {Math.abs(gap)}
    </span>
  );
}

function getGapTooltip(row) {
  if (row?.isUncategorized || row?.expectedCount == null) return undefined;
  const expected = row.expectedCount;
  const actual = row.count;
  const gap = row.countDelta;
  if (gap === 0) return `Expected ${expected}, have ${actual} — on target`;
  if (gap < 0) return `Expected ${expected}, have ${actual} — need ${Math.abs(gap)} more`;
  return `Expected ${expected}, have ${actual} — ${gap} extra`;
}

function getRowStatus(row) {
  if (row.isUncategorized) return "none";
  if (row.countDelta > 0) return "over";
  if (row.countDelta < 0) return "under";
  return "on";
}

/** Small status dot — accent only, not full-row tint. */
const ROW_STATUS_DOT = {
  none: "bg-gray-300 dark:bg-gray-600",
  over: "bg-emerald-500",
  under: "bg-rose-500",
  on: "bg-blue-500",
};

/** Left accent bar on desktop table rows. */
const ROW_STATUS_ACCENT = {
  none: "",
  over: "bg-emerald-500",
  under: "bg-rose-500",
  on: "bg-blue-500",
};

/** Shared 4-column grid for header + data rows (category / target / actual / gap). */
const MODAL_TABLE_GRID =
  "grid-cols-[minmax(0,1fr)_4.5rem_5rem_minmax(4.5rem,auto)]";

/** Expected task count for a category's configured target %. */
function targetCountForRow(row, total) {
  if (row.expectedCount != null) return row.expectedCount;
  if (row.target == null || total <= 0) return null;
  return Math.round((total * row.target) / 100);
}

/** Compact single-line metric: "30% · 3" */
function CategoryMetricCell({ pct, count, emphasize = false, empty = false, align = "right" }) {
  const alignCls = align === "left" ? "text-left" : "text-right";
  if (empty || pct == null) {
    return <span className={`text-sm tabular-nums buffer-text-subtle ${alignCls}`}>—</span>;
  }
  return (
    <span className={`${alignCls} text-sm tabular-nums leading-none`}>
      <span className={emphasize ? "font-semibold buffer-text" : "font-medium buffer-text"}>
        {pct}%
      </span>
      {count != null && (
        <span className="text-xs buffer-text-subtle">
          {" · "}
          {count}
        </span>
      )}
    </span>
  );
}

const AI_CATEGORIZE_MODEL = "gemini-2.5-flash";

/**
 * "AI Auto-Categorize" panel shown when a date group has uncategorized tasks.
 *
 * Sends the uncategorized titles + the configured categories to Gemini, which
 * maps each title to an existing category and derives concise keyword terms.
 * The user reviews the proposed keyword additions, then applies them: keywords
 * are merged into the matching categories, saved via PUT /planner/config, and
 * the parent is notified so the distribution refreshes live.
 */
/**
 * One editable review card for a single uncategorized task: shows the task
 * title, the AI-proposed category (changeable), and its suggested keywords as
 * editable chips (inline edit + delete), plus an add-keyword input. The whole
 * suggestion can be skipped via the trash button.
 */
function KeywordEditorCard({ suggestion, categoryNames, disabled, onPatch, onRemove }) {
  const [addText, setAddText] = useState("");

  const commitAdd = () => {
    const term = addText.trim();
    if (!term) return;
    onPatch(suggestion.id, (s) => {
      const exists = s.keywords.some((k) => k.trim().toLowerCase() === term.toLowerCase());
      if (exists) return s;
      return { ...s, keywords: [...s.keywords, term] };
    });
    setAddText("");
  };

  return (
    <div className="buffer-card px-3 py-2.5">
      <div className="flex items-start gap-2">
        <p
          className="min-w-0 flex-1 text-xs buffer-text-muted truncate"
          title={suggestion.title}
        >
          <span className="font-medium buffer-text">Task:</span>{" "}
          {suggestion.title}
        </p>
        <button
          type="button"
          onClick={() => onRemove(suggestion.id)}
          disabled={disabled}
          title="Skip this suggestion (don't add its keywords)"
          className="shrink-0 -mt-0.5 p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle shrink-0">
          Taxonomy
        </span>
        <select
          value={suggestion.category}
          disabled={disabled}
          onChange={(e) => onPatch(suggestion.id, (s) => ({ ...s, category: e.target.value }))}
          className="buffer-input text-xs py-1 min-w-0 flex-1 disabled:opacity-60"
        >
          {categoryNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {suggestion.keywords.map((kw, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-0.5 rounded-full text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-2 pr-0.5 py-0.5"
          >
            <input
              value={kw}
              disabled={disabled}
              onChange={(e) =>
                onPatch(suggestion.id, (s) => ({
                  ...s,
                  keywords: s.keywords.map((k, i) => (i === idx ? e.target.value : k)),
                }))
              }
              size={Math.max((kw || "").length, 2)}
              aria-label="Edit keyword"
              className="bg-transparent outline-none text-[11px] font-medium text-gray-700 dark:text-gray-300 min-w-[1.5rem] disabled:opacity-60"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onPatch(suggestion.id, (s) => ({
                  ...s,
                  keywords: s.keywords.filter((_, i) => i !== idx),
                }))
              }
              title="Remove keyword"
              className="shrink-0 rounded-full p-0.5 text-gray-400 hover:text-rose-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <span className="inline-flex items-center rounded-full border border-dashed border-gray-300 dark:border-gray-600 pl-2 pr-0.5 py-0.5">
          <input
            value={addText}
            disabled={disabled}
            onChange={(e) => setAddText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitAdd();
              }
            }}
            placeholder="add keyword (Tamil - English)"
            size={Math.max(addText.length || 1, 8)}
            aria-label="Add keyword"
            className="bg-transparent outline-none text-[11px] font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400 min-w-[3.5rem] disabled:opacity-60"
          />
          <button
            type="button"
            disabled={disabled || !addText.trim()}
            onClick={commitAdd}
            title="Add keyword"
            className="shrink-0 rounded-full p-0.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            <Plus size={11} />
          </button>
        </span>
      </div>
    </div>
  );
}

function AiCategorizePanel({ categories, uncategorizedTitles, onApplied }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | review | saving
  // One entry per AI-matched uncategorized task: { id, title, category, keywords[] }
  const [suggestions, setSuggestions] = useState([]);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [savedPrompt, setSavedPrompt] = useState(null);
  const [defaultPrompt, setDefaultPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptDirty, setPromptDirty] = useState(false);

  const busy = phase === "loading" || phase === "saving";

  const categoryNames = useMemo(
    () =>
      (Array.isArray(categories) ? categories : [])
        .map((c) => String(c?.name || "").trim())
        .filter(Boolean),
    [categories],
  );

  // Apply is enabled only when at least one suggestion still has a non-empty keyword.
  const hasApplicable = useMemo(
    () => suggestions.some((s) => s.category && s.keywords.some((k) => k.trim())),
    [suggestions],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/planner/config");
        if (cancelled) return;
        const def = String(data?.defaultAiCategorizePrompt || "");
        const saved = data?.aiCategorizePrompt ?? null;
        setDefaultPrompt(def);
        setSavedPrompt(saved);
        setPromptDraft(saved || def);
        setPromptDirty(false);
      } catch {
        // Non-fatal: prompt editor falls back to empty until user resets.
      } finally {
        if (!cancelled) setPromptLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchSuggestion = useCallback((id, updater) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }, []);

  const removeSuggestion = useCallback((id) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /** Prompt sent to Gemini: custom when draft differs from built-in default. */
  const promptForRun = useMemo(() => {
    const trimmed = promptDraft.trim();
    const defTrimmed = defaultPrompt.trim();
    if (!trimmed || trimmed === defTrimmed) return null;
    return trimmed;
  }, [promptDraft, defaultPrompt]);

  const handlePromptChange = useCallback((e) => {
    setPromptDraft(e.target.value);
    setPromptDirty(true);
  }, []);

  const savePrompt = useCallback(async () => {
    setPromptSaving(true);
    try {
      const { data: current } = await api.get("/planner/config");
      const trimmed = promptDraft.trim();
      const isDefault = !trimmed || trimmed === defaultPrompt.trim();
      const toSave = isDefault ? null : trimmed;

      const { data } = await api.put("/planner/config", {
        categories: Array.isArray(current?.categories) ? current.categories : [],
        ...(Number.isFinite(Number(current?.totalVideos)) ? { totalVideos: current.totalVideos } : {}),
        aiCategorizePrompt: toSave,
      });

      const saved = data?.aiCategorizePrompt ?? null;
      setSavedPrompt(saved);
      setPromptDraft(saved || defaultPrompt);
      setPromptDirty(false);
      toast.success("AI prompt saved.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save prompt");
    } finally {
      setPromptSaving(false);
    }
  }, [promptDraft, defaultPrompt]);

  const resetPrompt = useCallback(() => {
    setPromptDraft(defaultPrompt);
    setPromptDirty((savedPrompt || "") !== defaultPrompt);
  }, [defaultPrompt, savedPrompt]);

  const runAnalyze = useCallback(async () => {
    if (busy) return;
    if (uncategorizedTitles.length === 0) return;

    setPhase("loading");
    const { key, error } = await readGeminiApiKey();
    if (!key) {
      toast.error(
        error === "decrypt"
          ? "Could not read your Gemini API key. Re-save it in AI Chat → Settings."
          : "Add your Gemini API key in AI Chat → Settings to use AI taxonomy.",
      );
      setPhase("idle");
      return;
    }

    const categoriesPayload = (Array.isArray(categories) ? categories : [])
      .map((c) => ({
        name: String(c?.name || "").trim(),
        subcategories: getEffectiveCategorySubcategories(c),
      }))
      .filter((c) => c.name);

    try {
      const { data } = await api.post("/planner/categories/ai-categorize", {
        titles: uncategorizedTitles,
        categories: categoriesPayload,
        apiKey: key,
        aiModel: AI_CATEGORIZE_MODEL,
        ...(promptForRun ? { customPrompt: promptForRun } : {}),
      });

      const mappings = Array.isArray(data?.mappings) ? data.mappings : [];
      const canonicalByLower = new Map(
        categoriesPayload.map((c) => [c.name.toLowerCase(), c.name]),
      );

      // Build one editable suggestion per matched uncategorized title.
      const next = [];
      let seq = 0;
      for (const m of mappings) {
        const canonical = canonicalByLower.get(String(m?.category || "").trim().toLowerCase());
        if (!canonical) continue; // Never trust a category outside the provided list.
        const title = String(m?.title || "").trim();
        if (!title) continue;

        const seen = new Set();
        const keywords = [];
        for (const kw of Array.isArray(m?.suggestedKeywords) ? m.suggestedKeywords : []) {
          const term = String(kw || "").trim();
          if (!term) continue;
          const low = term.toLowerCase();
          if (seen.has(low)) continue;
          seen.add(low);
          keywords.push(term);
        }
        if (keywords.length === 0) continue;

        next.push({ id: `s${seq++}`, title, category: canonical, keywords });
      }

      if (next.length === 0) {
        toast("AI couldn't confidently match these tasks to a taxonomy.", { icon: "🤔" });
        setPhase("idle");
        return;
      }

      setSuggestions(next);
      setPhase("review");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "AI taxonomy failed";
      toast.error(msg);
      setPhase("idle");
    }
  }, [busy, uncategorizedTitles, categories, promptForRun]);

  const applyProposals = useCallback(async () => {
    if (phase !== "review" || !hasApplicable) return;
    setPhase("saving");

    try {
      // Preserve the user's existing config (totalVideos + untouched categories).
      const { data: current } = await api.get("/planner/config");
      const currentCats = Array.isArray(current?.categories) ? current.categories : [];
      const totalVideos = current?.totalVideos;

      // Aggregate the (edited) keywords per category, case-insensitively.
      const additionsByLower = new Map();
      for (const s of suggestions) {
        const catLower = String(s.category || "").trim().toLowerCase();
        if (!catLower) continue;
        if (!additionsByLower.has(catLower)) additionsByLower.set(catLower, []);
        const arr = additionsByLower.get(catLower);
        for (const kw of s.keywords) {
          const term = String(kw || "").trim();
          if (term) arr.push(term);
        }
      }

      let addedCount = 0;
      const touched = new Set();
      const merged = currentCats.map((c) => {
        const subs = getEffectiveCategorySubcategories(c);
        const additions = additionsByLower.get(String(c?.name || "").trim().toLowerCase());
        if (!additions || additions.length === 0) {
          return { name: c.name, percentage: c.percentage, subcategories: subs };
        }
        const seen = new Set(subs.map((x) => x.toLowerCase()));
        const nextSubs = [...subs];
        for (const term of additions) {
          const low = term.toLowerCase();
          if (seen.has(low)) continue; // Dedupe against existing + within this batch.
          seen.add(low);
          nextSubs.push(term);
          addedCount += 1;
          touched.add(c.name);
        }
        return { name: c.name, percentage: c.percentage, subcategories: nextSubs };
      });

      if (addedCount === 0) {
        toast("Those keywords are already in your taxonomies.", { icon: "✅" });
        setPhase("review");
        return;
      }

      const { data: saved } = await api.put("/planner/config", {
        categories: merged,
        ...(Number.isFinite(Number(totalVideos)) ? { totalVideos } : {}),
        aiCategorizePrompt: current?.aiCategorizePrompt ?? null,
      });

      const savedCategories = Array.isArray(saved?.categories) ? saved.categories : merged;
      const catCount = touched.size;

      toast.success(
        `Added ${addedCount} keyword${addedCount === 1 ? "" : "s"} across ${catCount} taxonom${catCount === 1 ? "y" : "ies"}.`,
      );

      setSuggestions([]);
      setPhase("idle");
      onApplied?.(savedCategories);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save taxonomies";
      toast.error(msg);
      setPhase("review");
    }
  }, [phase, hasApplicable, suggestions, onApplied]);

  const cancelReview = useCallback(() => {
    setSuggestions([]);
    setPhase("idle");
  }, []);

  const promptEditor = (
    <div className="border-t buffer-border pt-3">
      <button
        type="button"
        onClick={() => setPromptOpen((o) => !o)}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs font-medium buffer-text-subtle hover:buffer-text transition-colors disabled:opacity-50"
      >
        <Settings size={13} />
        Customize AI prompt
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${promptOpen ? "rotate-180" : ""}`}
        />
        {promptDirty && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Unsaved changes" aria-hidden />
        )}
      </button>
      {promptOpen && (
        <div className="mt-3 space-y-2">
          <p className="text-xs buffer-text-subtle leading-relaxed">
            Controls how AI assigns uncategorized tasks to your taxonomies. Include{" "}
            <code className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
              {"{{CATEGORIES}}"}
            </code>{" "}
            and{" "}
            <code className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
              {"{{TITLES}}"}
            </code>{" "}
            where the taxonomy list and task titles should appear.
          </p>
          <textarea
            value={promptDraft}
            onChange={handlePromptChange}
            disabled={busy || promptLoading}
            rows={8}
            spellCheck={false}
            aria-label="AI taxonomy prompt"
            className="buffer-input text-xs font-mono leading-relaxed resize-y min-h-[8rem] disabled:opacity-60"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] buffer-text-subtle tabular-nums">
              {promptDraft.length.toLocaleString()} / 8,000 characters
              {promptDirty && !promptSaving && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">Unsaved</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetPrompt}
                disabled={busy || promptSaving || promptLoading}
                className="buffer-button-secondary text-xs py-1.5 px-3 disabled:opacity-50"
              >
                Reset to default
              </button>
              <button
                type="button"
                onClick={savePrompt}
                disabled={busy || promptSaving || promptLoading || !promptDirty}
                className="buffer-button-primary text-xs py-1.5 px-3 inline-flex items-center gap-1 disabled:opacity-50"
              >
                {promptSaving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Saving…
                  </>
                ) : (
                  "Save prompt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="buffer-card p-4">
      {phase !== "review" ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 shrink-0">
                <Sparkles size={15} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold buffer-text">AI Auto-Taxonomy</p>
                <p className="text-xs buffer-text-subtle mt-0.5 leading-relaxed">
                  Let AI sort the {uncategorizedTitles.length} uncategorized{" "}
                  {uncategorizedTitles.length === 1 ? "task" : "tasks"} into your taxonomies. Keywords
                  are suggested in <span className="font-medium buffer-text">Tamil - English</span> format.
                  You can edit them before applying.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={runAnalyze}
              disabled={busy || promptLoading}
              className="buffer-button-primary text-xs py-2 px-4 inline-flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {phase === "loading" ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Wand2 size={13} /> AI Auto-Taxonomy
                </>
              )}
            </button>
          </div>
          {promptEditor}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 shrink-0">
              <Sparkles size={15} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold buffer-text">
                Review keywords for {suggestions.length}{" "}
                {suggestions.length === 1 ? "uncategorized task" : "uncategorized tasks"}
              </p>
              <p className="text-xs buffer-text-subtle mt-0.5 leading-relaxed">
                Edit, add or remove keywords (use <span className="font-medium buffer-text">Tamil - English</span>{" "}
                format), change the taxonomy, or skip a task. On apply, the kept keywords are added to each
                taxonomy so matching tasks re-classify.
              </p>
            </div>
          </div>
          <div className="space-y-2 max-h-[38vh] sm:max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {suggestions.map((s) => (
              <KeywordEditorCard
                key={s.id}
                suggestion={s}
                categoryNames={categoryNames}
                disabled={phase === "saving"}
                onPatch={patchSuggestion}
                onRemove={removeSuggestion}
              />
            ))}
            {suggestions.length === 0 && (
              <p className="text-xs italic buffer-text-subtle py-3 text-center">
                All suggestions skipped. Cancel or re-run.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelReview}
              disabled={phase === "saving"}
              className="buffer-button-secondary text-xs py-2 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyProposals}
              disabled={phase === "saving" || !hasApplicable}
              className="buffer-button-primary text-xs py-2 inline-flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {phase === "saving" ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check size={13} /> Apply keywords
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryTasksModal({
  open,
  tasks,
  categories,
  title,
  subtitle,
  initialCategoryName = "",
  onCategoriesApplied,
  onClose,
}) {
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedTaskKey, setSelectedTaskKey] = useState(null);
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(
    () =>
      (Array.isArray(categories) ? categories : [])
        .map((c) => String(c?.name || "").trim())
        .filter(Boolean),
    [categories],
  );

  useEffect(() => {
    if (!open) {
      setKeywordInput("");
      setSelectedTaskKey(null);
      setSaving(false);
      return;
    }
    if (categoryOptions.length > 0) {
      const preferred = String(initialCategoryName || "").trim();
      const pick =
        preferred && categoryOptions.some((name) => name === preferred)
          ? preferred
          : categoryOptions[0];
      setSelectedCategoryName(pick);
    } else {
      setSelectedCategoryName("");
    }
  }, [open, categoryOptions, initialCategoryName]);

  const handleSelectTask = useCallback((task, key) => {
    setSelectedTaskKey(key);
    const title = String(task?.title || "").trim();
    if (title) setKeywordInput(title);
  }, []);

  const handleAddKeyword = useCallback(async () => {
    const trimmed = keywordInput.trim();
    const categoryName = String(selectedCategoryName || "").trim();

    if (!categoryName) {
      toast.error("Select a taxonomy");
      return;
    }
    if (!trimmed) {
      toast.error("Enter a keyword");
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      const { data: current } = await api.get("/planner/config");
      const currentCats = Array.isArray(current?.categories) ? current.categories : [];
      const totalVideos = current?.totalVideos;
      const catLower = categoryName.toLowerCase();

      let added = false;
      const merged = currentCats.map((c) => {
        const subs = getEffectiveCategorySubcategories(c);
        if (String(c?.name || "").trim().toLowerCase() !== catLower) {
          return { name: c.name, percentage: c.percentage, subcategories: subs };
        }
        const seen = new Set(subs.map((x) => x.toLowerCase()));
        if (seen.has(trimmed.toLowerCase())) {
          return { name: c.name, percentage: c.percentage, subcategories: subs };
        }
        added = true;
        return { name: c.name, percentage: c.percentage, subcategories: [...subs, trimmed] };
      });

      if (!added) {
        toast("That keyword is already in this taxonomy.", { icon: "✅" });
        return;
      }

      const { data: saved } = await api.put("/planner/config", {
        categories: merged,
        ...(Number.isFinite(Number(totalVideos)) ? { totalVideos } : {}),
        aiCategorizePrompt: current?.aiCategorizePrompt ?? null,
      });

      const savedCategories = Array.isArray(saved?.categories) ? saved.categories : merged;
      toast.success(`Added keyword to ${categoryName}.`);
      setKeywordInput("");
      onCategoriesApplied?.(savedCategories);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save keyword";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [keywordInput, selectedCategoryName, saving, onCategoriesApplied]);

  if (!open) return null;

  const count = tasks.length;
  const canAddKeyword = categoryOptions.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[70vh] flex flex-col rounded-xl bg-white dark:bg-gray-900 border buffer-border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="category-tasks-title"
      >
        <div className="flex items-start gap-3 px-4 py-3 border-b buffer-border shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 shrink-0">
            <ListVideo size={18} className="text-gray-600 dark:text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="category-tasks-title" className="text-base font-semibold buffer-text">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs buffer-text-subtle mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {count === 0 ? (
            <p className="text-sm buffer-text-subtle text-center py-12 px-6">
              No tasks in this taxonomy.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {tasks.map((task, idx) => {
                const title = String(task?.title || "").trim() || "(Untitled)";
                const assignee = formatTaskAssignee(task);
                const format = formatTaskVideoFormat(task);
                const key = task?._id || `${title}-${idx}`;

                const isSelected = selectedTaskKey === key;

                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => handleSelectTask(task, key)}
                      className={`w-full text-left px-3 py-1.5 transition-colors ${
                        isSelected
                          ? "bg-primary-50/80 dark:bg-primary-950/20 border-l-2 border-primary-500"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-6 shrink-0 text-xs text-gray-400 tabular-nums text-right pt-px">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium buffer-text leading-tight">{title}</p>
                          {(assignee || format) && (
                            <p className="text-[10px] buffer-text-subtle mt-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {assignee && <span>{assignee}</span>}
                              {assignee && format && (
                                <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                                  ·
                                </span>
                              )}
                              {format && (
                                <span
                                  className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                    format === "Short"
                                      ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                  }`}
                                >
                                  {format}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t buffer-border bg-gray-50/30 dark:bg-gray-800/20 px-4 py-3 space-y-3">
          {canAddKeyword ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedCategoryName}
                onChange={(e) => setSelectedCategoryName(e.target.value)}
                disabled={saving}
                aria-label="Taxonomy"
                className="buffer-input text-xs py-2 sm:max-w-[9rem] shrink-0 disabled:opacity-60"
              >
                {categoryOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                disabled={saving}
                placeholder="Tamil - English"
                aria-label="Keyword"
                className="buffer-input text-xs py-2 flex-1 min-w-0 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                disabled={saving || !keywordInput.trim()}
                className="buffer-button-primary text-xs py-2 px-3 inline-flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Plus size={13} /> Add keyword
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-xs buffer-text-subtle">Configure taxonomies to add keywords from here.</p>
          )}
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="buffer-button-secondary text-xs py-2 px-4">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ScheduleCategoryAnalysisModal({
  open,
  dateLabel,
  distribution,
  onClose,
  tasks,
  categories,
  onCategoriesApplied,
}) {
  /** Category row name when the tasks list modal is open (`null` = closed). */
  const [tasksModalCategory, setTasksModalCategory] = useState(null);

  const uncategorizedTitles = useMemo(
    () => getUncategorizedTaskTitles(tasks, categories),
    [tasks, categories],
  );

  const tasksModalTasks = useMemo(() => {
    if (!tasksModalCategory) return [];
    if (tasksModalCategory === "Uncategorized") {
      return getUncategorizedTasks(tasks, categories);
    }
    return getTasksForPlannerCategory(tasks, categories, tasksModalCategory);
  }, [tasksModalCategory, tasks, categories]);

  const tasksModalMeta = useMemo(() => {
    if (!tasksModalCategory) return null;
    const count = tasksModalTasks.length;
    if (tasksModalCategory === "Uncategorized") {
      return {
        title: "Uncategorized videos",
        subtitle: `${count} untagged ${count === 1 ? "task" : "tasks"} — no taxonomy keyword matched`,
        initialCategoryName: "",
      };
    }
    return {
      title: tasksModalCategory,
      subtitle: `${count} ${count === 1 ? "task" : "tasks"} matched to this taxonomy`,
      initialCategoryName: tasksModalCategory,
    };
  }, [tasksModalCategory, tasksModalTasks.length]);

  const handleClose = useCallback(() => {
    setTasksModalCategory(null);
    onClose();
  }, [onClose]);

  if (!open) return null;

  const { rows = [], total = 0, targetTotal = 0, hasConfig = false } = distribution || {};
  const canAiCategorize =
    hasConfig &&
    total > 0 &&
    uncategorizedTitles.length > 0 &&
    Array.isArray(categories) &&
    categories.length > 0;

  return (
    <>
      {createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl bg-white dark:bg-gray-900 border buffer-border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-3 border-b buffer-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 shrink-0">
            <BarChart3 size={18} className="text-gray-600 dark:text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold buffer-text">Taxonomy distribution</h3>
            {dateLabel && (
              <p className="text-sm buffer-text-subtle mt-0.5 truncate">{dateLabel}</p>
            )}
          </div>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 buffer-text-muted shrink-0 tabular-nums"
            title="Total tasks analyzed"
          >
            {total} {total === 1 ? "task" : "tasks"}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3">
          {!hasConfig ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden />
              </div>
              <p className="text-sm font-semibold buffer-text">No taxonomies configured</p>
              <p className="text-sm buffer-text-subtle max-w-sm leading-relaxed">
                Add taxonomies with target percentages via “Manage taxonomies” in Production Hub or Trending Hub to
                compare the distribution against your plan.
              </p>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800">
                <CalendarDays className="h-6 w-6 text-gray-400" aria-hidden />
              </div>
              <p className="text-sm font-semibold buffer-text">No tasks to analyze</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] buffer-text-subtle mb-2 leading-snug">
                Actual % is the share of tasks matching each taxonomy (first match wins). Gap shows
                how many tasks above or below the expected count for each taxonomy.
              </p>

              {/* Buffer-style table */}
              <div className="rounded-lg border buffer-border overflow-hidden">
                {/* Column headers */}
                <div
                  className={`hidden sm:grid ${MODAL_TABLE_GRID} gap-x-3 items-center px-3 py-1.5 bg-gray-50/80 dark:bg-gray-800/40 border-b buffer-border text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle`}
                >
                  <span>Taxonomy</span>
                  <span className="text-right">Target</span>
                  <span className="text-right">Actual</span>
                  <span className="text-right">Gap</span>
                </div>

                {/* Data rows */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((row) => {
                    const targetCount = targetCountForRow(row, total);
                    const status = getRowStatus(row);
                    const isClickable = row.count > 0;
                    const handleRowClick = isClickable
                      ? () => setTasksModalCategory(row.name)
                      : undefined;
                    const rowInteractiveCls = isClickable
                      ? "cursor-pointer hover:bg-gray-100/70 dark:hover:bg-gray-800/50"
                      : row.isUncategorized
                        ? "bg-gray-50/60 dark:bg-gray-800/25"
                        : "hover:bg-gray-50/60 dark:hover:bg-gray-800/30";

                    return (
                      <div
                        key={row.name}
                        className={`relative transition-colors ${rowInteractiveCls}`}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onClick={handleRowClick}
                        onKeyDown={
                          isClickable
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setTasksModalCategory(row.name);
                                }
                              }
                            : undefined
                        }
                        title={
                          isClickable
                            ? row.isUncategorized
                              ? "View uncategorized tasks"
                              : `View ${row.name} tasks`
                            : undefined
                        }
                      >
                        {/* Left accent bar — status dot equivalent on desktop */}
                        {!row.isUncategorized && (
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-0.5 ${ROW_STATUS_ACCENT[status]}`}
                            aria-hidden
                          />
                        )}
                        {row.isUncategorized && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-0.5 border-l border-dashed border-gray-300 dark:border-gray-600"
                            aria-hidden
                          />
                        )}

                        {/* Desktop row */}
                        <div
                          className={`hidden sm:grid ${MODAL_TABLE_GRID} gap-x-3 items-center pl-3 pr-3 py-2`}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${ROW_STATUS_DOT[status]}`}
                              aria-hidden
                            />
                            <span
                              className={`text-sm font-medium truncate leading-tight ${
                                row.isUncategorized
                                  ? "buffer-text-subtle italic"
                                  : "buffer-text"
                              }`}
                            >
                              {row.name}
                            </span>
                          </span>
                          <CategoryMetricCell
                            pct={row.target}
                            count={targetCount}
                            empty={row.target == null}
                          />
                          <CategoryMetricCell pct={row.actual} count={row.count} emphasize />
                          <span className="flex justify-end">
                            <ScheduleCategoryGapBadge row={row} />
                          </span>
                        </div>

                        {/* Mobile row */}
                        <div className="sm:hidden px-3 py-2.5 space-y-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${ROW_STATUS_DOT[status]}`}
                              aria-hidden
                            />
                            <span
                              className={`text-sm font-medium truncate leading-tight ${
                                row.isUncategorized
                                  ? "buffer-text-subtle italic"
                                  : "buffer-text"
                              }`}
                            >
                              {row.name}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pl-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle leading-none">
                                Target
                              </p>
                              <div className="mt-1">
                                <CategoryMetricCell
                                  pct={row.target}
                                  count={targetCount}
                                  empty={row.target == null}
                                  align="left"
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle leading-none">
                                Actual
                              </p>
                              <div className="mt-1">
                                <CategoryMetricCell
                                  pct={row.actual}
                                  count={row.count}
                                  emphasize
                                  align="left"
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle leading-none">
                                Gap
                              </p>
                              <div className="mt-1">
                                <ScheduleCategoryGapBadge row={row} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {canAiCategorize && (
          <div className="shrink-0 border-t buffer-border px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50">
            <AiCategorizePanel
              categories={categories}
              uncategorizedTitles={uncategorizedTitles}
              onApplied={onCategoriesApplied}
            />
          </div>
        )}

        {hasConfig && total > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t buffer-border bg-gray-50/30 dark:bg-gray-800/20">
            <span className="text-xs buffer-text-subtle">
              Target total{" "}
              <span className="font-semibold tabular-nums buffer-text">{targetTotal}%</span>
            </span>
            <span className="inline-flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 text-xs buffer-text-subtle">
              <span className="inline-flex items-center gap-1.5" title="More tasks than the expected count">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                Over (+N)
              </span>
              <span className="inline-flex items-center gap-1.5" title="Fewer tasks than the expected count">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden />
                Under (−N)
              </span>
              <span className="inline-flex items-center gap-1.5" title="Actual count matches the expected count">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden />
                On target (0)
              </span>
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
      )}
      <CategoryTasksModal
        open={tasksModalCategory != null}
        tasks={tasksModalTasks}
        categories={categories}
        title={tasksModalMeta?.title ?? ""}
        subtitle={tasksModalMeta?.subtitle}
        initialCategoryName={tasksModalMeta?.initialCategoryName ?? ""}
        onCategoriesApplied={onCategoriesApplied}
        onClose={() => setTasksModalCategory(null)}
      />
    </>
  );
}

const DEFAULT_ANALYZE_BUTTON_CLASS =
  "inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors shadow-sm";

/**
 * Self-contained Analyze pill + modal. Drop into any date-group header, passing
 * that group's tasks and the loaded planner categories.
 */
export function AnalyzeButton({
  tasks,
  categories,
  dateLabel,
  className,
  iconSize = 11,
  label = "Analyze",
  title = "Analyze taxonomy distribution vs target taxonomies",
  stopPropagation = true,
  onCategoriesUpdated,
}) {
  const [open, setOpen] = useState(false);
  // Categories saved by the in-modal "AI Auto-Categorize" flow, so the
  // distribution refreshes live even before the parent re-fetches its config.
  const [overrideCategories, setOverrideCategories] = useState(null);

  // A new set of categories from the parent supersedes any local override.
  useEffect(() => {
    setOverrideCategories(null);
  }, [categories]);

  const effectiveCategories = overrideCategories ?? categories;

  const distribution = useMemo(
    () => buildScheduleCategoryDistribution(tasks, effectiveCategories),
    [tasks, effectiveCategories],
  );

  const handleCategoriesApplied = useCallback(
    (savedCategories) => {
      if (Array.isArray(savedCategories)) setOverrideCategories(savedCategories);
      onCategoriesUpdated?.();
    },
    [onCategoriesUpdated],
  );

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          setOpen(true);
        }}
        className={className || DEFAULT_ANALYZE_BUTTON_CLASS}
        title={title}
      >
        <BarChart3 size={iconSize} />
        {label && <span className="hidden sm:inline">{label}</span>}
      </button>

      <ScheduleCategoryAnalysisModal
        open={open}
        dateLabel={dateLabel}
        distribution={distribution}
        onClose={() => setOpen(false)}
        tasks={tasks}
        categories={effectiveCategories}
        onCategoriesApplied={handleCategoriesApplied}
      />
    </>
  );
}
