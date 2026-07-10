import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import {
  Layers,
  X,
  Plus,
  Save,
  Loader2,
  Trash2,
  Tags,
  Pencil,
  Check,
  Copy,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import api from "../services/api";
import { readGeminiApiKey, isTamilEnglishKeyword } from "../utils/plannerKeywords";

const AI_FORMAT_KEYWORDS_MODEL = "gemini-2.5-flash";

export function makeEmptyPlannerCategory() {
  return { name: "", percentage: 0, subcategories: [] };
}

export function getEffectiveCategorySubcategories(category) {
  if (Array.isArray(category?.subcategories)) {
    return category.subcategories
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }
  if (category?.subcategoriesInput != null) {
    return String(category.subcategoriesInput)
      .split(",")
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }
  return [];
}

export function collectPlannerSubcategories(categories) {
  const seen = new Set();
  const result = [];
  for (const category of categories || []) {
    for (const sub of getEffectiveCategorySubcategories(category)) {
      const key = sub.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(sub);
    }
  }
  return result;
}

function calculateCategoryVideoCount(totalVideoCount, percentage) {
  const total = Math.max(0, Number(totalVideoCount) || 0);
  const pct = Math.max(0, Math.min(100, Number(percentage) || 0));
  return Math.round((total * pct) / 100);
}

export function normalizePlannerTotalVideos(value, fallback = 1) {
  const raw = Number(value);
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(500, Math.round(raw));
  }
  const fb = Math.max(1, Math.round(Number(fallback) || 1));
  return Math.min(500, fb);
}

function normalizePlannerCategoriesForSave(categories) {
  const seen = new Set();
  const out = [];
  for (const cat of categories || []) {
    const name = String(cat?.name || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      percentage: Math.max(0, Math.min(100, Math.round(Number(cat?.percentage) || 0))),
      subcategories: getEffectiveCategorySubcategories(cat),
    });
  }
  return out;
}

const CATEGORY_TABLE_GRID =
  "grid grid-cols-1 sm:grid-cols-[2rem_20ch_3.25rem_minmax(0,1fr)_3rem_2rem] gap-x-2 gap-y-1.5";

const CATEGORY_TABLE_ROW_CLASSES = `${CATEGORY_TABLE_GRID} px-2.5 items-center`;

const CATEGORY_TABLE_COL = {
  order: "sm:col-start-1",
  category: "sm:col-start-2",
  percent: "sm:col-start-3",
  keywords: "sm:col-start-4",
  videos: "sm:col-start-5",
  remove: "sm:col-start-6",
};

const COMPACT_INPUT = "buffer-input h-8 text-xs py-1 px-2";

const ICON_BTN =
  "inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";

const REORDER_ICON_BTN =
  "flex-1 min-h-0 inline-flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";

function DiscardUnsavedChangesModal({ open, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close"
      />
      <div
        role="alertdialog"
        aria-labelledby="discard-categories-title"
        aria-describedby="discard-categories-desc"
        className="relative z-10 w-full max-w-md buffer-card shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={20} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="discard-categories-title" className="text-sm font-semibold buffer-text leading-snug">
              Discard unsaved changes?
            </h2>
            <p id="discard-categories-desc" className="text-xs buffer-text-subtle mt-2 leading-relaxed">
              Keyword and taxonomy edits are staged but not saved yet. Close without saving, or go back and click
              {" "}
              <span className="font-semibold buffer-text">Save taxonomies</span>
              {" "}
              to keep them.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t buffer-border bg-gray-50/50 dark:bg-gray-800/30">
          <button type="button" onClick={onCancel} className="buffer-button-secondary text-xs py-2 px-4">
            Keep editing
          </button>
          <button type="button" onClick={onConfirm} className="buffer-button-primary text-xs py-2 px-4">
            Discard changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function parseKeywordsFromText(text) {
  return String(text || "")
    .split(/[,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeUniqueKeywords(existing, incoming) {
  const next = [...existing];
  const seen = new Set(next.map((k) => k.toLowerCase()));
  for (const item of incoming) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

function KeywordManagerPopup({ open, categoryName, keywords: initialKeywords, onClose, onSave }) {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const editInputRef = useRef(null);
  const newInputRef = useRef(null);

  // Initialize local keyword draft only when the popup opens — not when parent
  // props change while it stays open (avoids wiping in-progress edits).
  useEffect(() => {
    if (!open) return;
    setKeywords(initialKeywords.slice());
    setNewKeyword("");
    setEditingIndex(null);
    setEditingValue("");
    setCopyFeedback(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot initialKeywords at open time only
  }, [open]);

  useEffect(() => {
    if (editingIndex != null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingIndex]);

  const handleCopyAll = useCallback(async () => {
    if (!keywords.length) {
      toast.error("No keywords to copy");
      return;
    }
    const text = keywords.join(" | ");
    const showCopied = () => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    };
    try {
      await navigator.clipboard.writeText(text);
      showCopied();
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showCopied();
      } catch {
        toast.error("Could not copy to clipboard");
      }
    }
  }, [keywords]);

  const addKeywords = useCallback((items) => {
    const toAdd = Array.isArray(items) ? items : parseKeywordsFromText(items);
    if (!toAdd.length) return;
    setKeywords((prev) => mergeUniqueKeywords(prev, toAdd));
  }, []);

  const handleAddNew = useCallback(() => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    addKeywords(parseKeywordsFromText(trimmed));
    setNewKeyword("");
    newInputRef.current?.focus();
  }, [newKeyword, addKeywords]);

  const startEditing = useCallback((index) => {
    setEditingIndex(index);
    setEditingValue(keywords[index] || "");
  }, [keywords]);

  const commitEdit = useCallback(() => {
    if (editingIndex == null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setKeywords((prev) => prev.filter((_, i) => i !== editingIndex));
    } else {
      const duplicate = keywords.some(
        (k, i) => i !== editingIndex && k.toLowerCase() === trimmed.toLowerCase(),
      );
      if (!duplicate) {
        setKeywords((prev) => prev.map((k, i) => (i === editingIndex ? trimmed : k)));
      }
    }
    setEditingIndex(null);
    setEditingValue("");
  }, [editingIndex, editingValue, keywords]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue("");
  }, []);

  const removeKeyword = useCallback((index) => {
    setKeywords((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    } else if (editingIndex != null && editingIndex > index) {
      setEditingIndex((i) => (i != null ? i - 1 : i));
    }
  }, [editingIndex]);

  const collectKeywordsForSave = useCallback(() => {
    let next = keywords;

    if (editingIndex != null) {
      const trimmed = editingValue.trim();
      if (!trimmed) {
        next = next.filter((_, i) => i !== editingIndex);
      } else {
        const duplicate = next.some(
          (k, i) => i !== editingIndex && k.toLowerCase() === trimmed.toLowerCase(),
        );
        if (!duplicate) {
          next = next.map((k, i) => (i === editingIndex ? trimmed : k));
        }
      }
    }

    const pending = newKeyword.trim();
    if (pending) {
      next = mergeUniqueKeywords(next, parseKeywordsFromText(pending));
    }

    return next;
  }, [keywords, editingIndex, editingValue, newKeyword]);

  const handleSaveKeywords = useCallback(() => {
    const next = collectKeywordsForSave();
    setKeywords(next);
    setNewKeyword("");
    setEditingIndex(null);
    setEditingValue("");
    onSave(next);
  }, [collectKeywordsForSave, onSave]);

  if (!open) return null;

  const title = categoryName?.trim() ? `Keywords — ${categoryName.trim()}` : "Manage keywords";

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col buffer-card shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b buffer-border">
          <Tags size={16} className="text-primary-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold buffer-text truncate">{title}</h4>
            <p className="text-[11px] buffer-text-subtle tabular-nums">
              {keywords.length} keyword{keywords.length === 1 ? "" : "s"} — matched against cached video titles
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={keywords.length === 0}
            title={keywords.length === 0 ? "No keywords to copy" : "Copy all keywords as pipe-separated list"}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-950/25 hover:bg-primary-100 dark:hover:bg-primary-950/40 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-colors"
          >
            {copyFeedback ? (
              <>
                <Check size={12} /> Copied!
              </>
            ) : (
              <>
                <Copy size={12} /> Copy all
              </>
            )}
          </button>
          <button type="button" onClick={onClose} className={ICON_BTN} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-[min(50vh,24rem)] overflow-y-auto custom-scrollbar p-4 sm:p-5">
          {keywords.length === 0 ? (
            <p className="text-sm buffer-text-subtle text-center py-8">
              No keywords yet. Add one below or paste a comma-separated list.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {keywords.map((keyword, i) => (
                editingIndex === i ? (
                  <div
                    key={`edit-${i}`}
                    className="inline-flex items-center gap-1 min-w-[8rem] max-w-full px-2 py-1 rounded-full border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/30"
                  >
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitEdit();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      onBlur={commitEdit}
                      className="buffer-input text-xs py-0.5 px-1.5 min-w-0 flex-1 bg-transparent border-0 focus:ring-0"
                      dir="auto"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={commitEdit}
                      className="p-0.5 rounded text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40"
                      title="Save"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <span
                    key={`${keyword}-${i}`}
                    className="inline-flex items-center gap-1 max-w-full pl-2.5 pr-1 py-1 rounded-full text-xs font-medium text-primary-800 dark:text-primary-200 bg-primary-50 dark:bg-primary-950/40 border border-primary-200/70 dark:border-primary-800/50 group"
                  >
                    <button
                      type="button"
                      onClick={() => startEditing(i)}
                      className="truncate max-w-[22rem] text-left hover:underline"
                      title={keyword}
                      dir="auto"
                    >
                      {keyword}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing(i)}
                      className="p-0.5 rounded text-primary-500 dark:text-primary-400 opacity-60 group-hover:opacity-100 hover:bg-primary-100 dark:hover:bg-primary-900/40 shrink-0"
                      title="Edit keyword"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeKeyword(i)}
                      className="p-0.5 rounded text-primary-500 dark:text-primary-400 opacity-60 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 shrink-0"
                      title="Remove keyword"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t buffer-border space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={newInputRef}
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddNew();
                }
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (/[,|]/.test(text)) {
                  e.preventDefault();
                  addKeywords(text);
                  setNewKeyword("");
                }
              }}
              placeholder="Add keyword (Tamil - English) — or paste comma/pipe-separated list"
              className="buffer-input text-sm flex-1 min-w-0"
              dir="auto"
            />
            <button
              type="button"
              onClick={handleAddNew}
              disabled={!newKeyword.trim()}
              className="buffer-button-primary text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-50 shrink-0"
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <p className="text-[10px] buffer-text-subtle">
            Use <span className="font-semibold buffer-text">Tamil - English</span> format (e.g. வேலைவாய்ப்பு - employment).
            Click a keyword to edit. Duplicates are ignored.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t buffer-border">
          <button type="button" onClick={onClose} className="buffer-button-secondary text-xs py-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveKeywords}
            className="buffer-button-primary text-xs py-2 flex items-center gap-1.5"
          >
            <Save size={13} /> Save keywords
          </button>
        </div>
      </div>
    </div>
  );
}

function PlannerCategoryEditorRow({
  category,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  totalVideoCount = 0,
}) {
  const [keywordPopupOpen, setKeywordPopupOpen] = useState(false);
  const [formattingKeywords, setFormattingKeywords] = useState(false);

  const keywords = useMemo(
    () => getEffectiveCategorySubcategories(category),
    [category.subcategoriesInput, category.subcategories],
  );

  const nonConformingCount = useMemo(
    () => keywords.filter((k) => !isTamilEnglishKeyword(k)).length,
    [keywords],
  );

  const videoCount = useMemo(
    () => calculateCategoryVideoCount(totalVideoCount, category.percentage),
    [totalVideoCount, category.percentage],
  );

  const handleKeywordsSave = useCallback(
    (updated) => {
      onChange(index, {
        subcategories: [...updated],
      });
      setKeywordPopupOpen(false);
      toast.success(
        updated.length
          ? `${updated.length} keyword${updated.length === 1 ? "" : "s"} staged — click “Save taxonomies” to persist`
          : "Keywords cleared — click “Save taxonomies” to persist",
      );
    },
    [index, onChange],
  );

  const handleAiFormatKeywords = useCallback(async () => {
    if (formattingKeywords || keywords.length === 0) return;

    if (nonConformingCount === 0) {
      toast.success("All keywords already use Tamil - English format");
      return;
    }

    setFormattingKeywords(true);
    const { key, error } = await readGeminiApiKey();
    if (!key) {
      toast.error(
        error === "decrypt"
          ? "Could not read your Gemini API key. Re-save it in AI Chat → Settings."
          : "Add your Gemini API key in AI Chat → Settings to format keywords.",
      );
      setFormattingKeywords(false);
      return;
    }

    try {
      const { data } = await api.post("/planner/categories/format-keywords", {
        categoryName: category.name,
        keywords,
        apiKey: key,
        aiModel: AI_FORMAT_KEYWORDS_MODEL,
      });

      const formatted = Array.isArray(data?.keywords) ? data.keywords : [];
      if (formatted.length === 0) {
        toast.error("AI returned no keywords");
        return;
      }

      onChange(index, { subcategories: formatted });
      const stillNonConforming = formatted.filter((k) => !isTamilEnglishKeyword(k)).length;
      if (stillNonConforming > 0) {
        toast.success(
          `Reformatted ${nonConformingCount} keyword${nonConformingCount === 1 ? "" : "s"} — review and save taxonomies`,
          { icon: "✨" },
        );
      } else {
        toast.success(
          `All keywords now use Tamil - English format — click “Save taxonomies” to persist`,
          { icon: "✨" },
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to format keywords with AI");
    } finally {
      setFormattingKeywords(false);
    }
  }, [
    formattingKeywords,
    keywords,
    nonConformingCount,
    category.name,
    index,
    onChange,
  ]);

  const preview = keywords.slice(0, 2).join(", ");
  const overflow = keywords.length > 2 ? ` +${keywords.length - 2}` : "";

  return (
    <div className={`${CATEGORY_TABLE_ROW_CLASSES} py-2 sm:py-1.5`}>
      <div className={`${CATEGORY_TABLE_COL.order} flex items-center sm:justify-center min-w-0`}>
        <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle mr-auto">
          Order
        </span>
        <div className="inline-flex flex-col h-7 w-7 rounded-md border buffer-border overflow-hidden shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className={REORDER_ICON_BTN}
            title="Move taxonomy up"
            aria-label="Move taxonomy up"
          >
            <ChevronUp className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className={`${REORDER_ICON_BTN} border-t buffer-border`}
            title="Move taxonomy down"
            aria-label="Move taxonomy down"
          >
            <ChevronDown className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className={`${CATEGORY_TABLE_COL.category} min-w-0 w-full sm:w-auto`}>
        <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle">Taxonomy</span>
        <input
          type="text"
          value={category.name}
          onChange={(e) => onChange(index, { name: e.target.value })}
          placeholder="Taxonomy (e.g. Politics)"
          className={`${COMPACT_INPUT} w-full sm:w-[20ch] sm:min-w-[20ch] sm:max-w-[20ch] mt-0.5 sm:mt-0`}
        />
      </div>
      <div className={`${CATEGORY_TABLE_COL.percent} min-w-0`}>
        <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle">%</span>
        <div className="flex items-center gap-1 mt-0.5 sm:mt-0 sm:block">
          <input
            type="number"
            min={0}
            max={100}
            value={category.percentage}
            onChange={(e) => onChange(index, { percentage: e.target.value })}
            placeholder="%"
            className={`${COMPACT_INPUT} w-full tabular-nums`}
          />
          <span className="text-xs font-semibold buffer-text-subtle sm:hidden">%</span>
        </div>
      </div>
      <div className={`${CATEGORY_TABLE_COL.keywords} min-w-0`}>
        <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle">Keywords</span>
        <div className="flex items-center gap-1 mt-0.5 sm:mt-0 min-w-0">
          <button
            type="button"
            onClick={() => setKeywordPopupOpen(true)}
            className="inline-flex w-full sm:w-auto max-w-full items-center gap-1 h-8 px-2 py-1 rounded-md border text-left text-[11px] font-semibold transition-colors border-primary-200/70 dark:border-primary-800/50 bg-primary-50/80 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-950/35 hover:border-primary-300 dark:hover:border-primary-700"
            title={keywords.length ? keywords.join(", ") : "Add keywords for title matching"}
          >
            <Tags size={12} className="shrink-0 opacity-70" />
            <span className="truncate min-w-0" dir="auto">
              {keywords.length === 0 ? (
                "Manage keywords (0)"
              ) : (
                <>
                  <span className="whitespace-nowrap tabular-nums">Manage keywords ({keywords.length})</span>
                  {preview && (
                    <span className="hidden md:inline font-normal text-primary-600/80 dark:text-primary-400/80">
                      {" "}· {preview}{overflow}
                    </span>
                  )}
                </>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={handleAiFormatKeywords}
            disabled={formattingKeywords || keywords.length === 0}
            title={
              keywords.length === 0
                ? "Add keywords first"
                : nonConformingCount > 0
                  ? `AI format ${nonConformingCount} keyword${nonConformingCount === 1 ? "" : "s"} to Tamil - English`
                  : "All keywords already use Tamil - English format"
            }
            className={`${ICON_BTN} shrink-0 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/30 disabled:opacity-40`}
            aria-label="AI format keywords to Tamil - English"
          >
            {formattingKeywords ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
          </button>
        </div>
        <KeywordManagerPopup
          open={keywordPopupOpen}
          categoryName={category.name}
          keywords={keywords}
          onClose={() => setKeywordPopupOpen(false)}
          onSave={handleKeywordsSave}
        />
      </div>
      <div className={`${CATEGORY_TABLE_COL.videos} min-w-0 flex items-center sm:justify-center`}>
        <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle mr-2">Videos</span>
        <span
          className="text-xs font-semibold tabular-nums buffer-text sm:w-full sm:text-center"
          title={`${category.percentage || 0}% of ${totalVideoCount} total videos`}
        >
          {videoCount}
        </span>
      </div>
      <div className={`${CATEGORY_TABLE_COL.remove} flex items-center justify-end sm:justify-center min-w-0`}>
        <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle mr-auto">
          Remove
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className={`${ICON_BTN} hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20`}
          title="Remove taxonomy"
          aria-label="Remove taxonomy"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export function ManageCategoriesButton({ categories = [], onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 flex-shrink-0 ${
        categories.length > 0
          ? "bg-primary-500/10 dark:bg-primary-500/15 border-primary-500/30 text-primary-700 dark:text-primary-400 hover:bg-primary-500/15"
          : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 buffer-text-muted hover:border-primary-400 hover:bg-white dark:hover:bg-gray-800/60"
      } ${className}`}
    >
      <div className="flex items-center min-w-0">
        <Layers size={13} className="mr-1.5 flex-shrink-0" />
        <span className="truncate max-w-[120px]">Manage taxonomies</span>
      </div>
    </button>
  );
}

export default function CategoriesModal({ open, categories, cachedVideos = [], totalVideos, onClose, onSaved }) {
  const [draft, setDraft] = useState([]);
  const [totalVideoCount, setTotalVideoCount] = useState(1);
  const [saving, setSaving] = useState(false);
  // True once the user changes anything in the draft. Keyword edits, category
  // edits, reorders and the total-videos field are staged in-memory only —
  // this flag drives the "Unsaved changes" indicator and the close guard so
  // users know they must click "Save categories" to persist to the database.
  const [dirty, setDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Snapshot props into draft only when the modal opens — not on every parent
  // re-render (e.g. cachedVideos={[]} creates a new [] reference each render).
  useEffect(() => {
    if (!open) return;
    setDraft(
      categories?.length
        ? categories.map((c) => ({
            ...c,
            subcategories: Array.isArray(c.subcategories) ? [...c.subcategories] : [],
            subcategoriesInput: undefined,
          }))
        : [makeEmptyPlannerCategory()],
    );
    const cachedCount = cachedVideos.length;
    const savedTotal = Number(totalVideos);
    const initialTotal =
      Number.isFinite(savedTotal) && savedTotal > 0
        ? savedTotal
        : (cachedCount > 0 ? cachedCount : 1);
    setTotalVideoCount(initialTotal);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot props at open time only
  }, [open]);

  const percentTotal = useMemo(
    () => draft.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0),
    [draft],
  );

  const totalCachedVideos = cachedVideos.length;
  const normalizedTotalVideoCount = normalizePlannerTotalVideos(totalVideoCount, totalCachedVideos || 1);

  const updateCategory = useCallback((index, patch) => {
    setDraft((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const next = { ...c, ...patch };
        if (Object.prototype.hasOwnProperty.call(patch, "subcategories")) {
          delete next.subcategoriesInput;
        }
        return next;
      }),
    );
    setDirty(true);
  }, []);

  const removeCategory = useCallback((index) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const moveCategory = useCallback((index, direction) => {
    setDraft((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }, []);

  const addCategory = useCallback(() => {
    setDraft((prev) => [...prev, makeEmptyPlannerCategory()]);
    setDirty(true);
  }, []);

  const handleTotalVideosChange = useCallback((value) => {
    setTotalVideoCount(value);
    setDirty(true);
  }, []);

  const handleRequestClose = useCallback(() => {
    if (dirty) {
      setDiscardConfirmOpen(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setDiscardConfirmOpen(false);
    setDirty(false);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    const normalized = normalizePlannerCategoriesForSave(draft);
    if (!normalized.length) {
      toast.error("Add at least one named taxonomy");
      return;
    }
    const totalVideosToSave = normalizePlannerTotalVideos(totalVideoCount, totalCachedVideos || 1);
    setSaving(true);
    try {
      const { data } = await api.put("/planner/config", {
        categories: normalized,
        totalVideos: totalVideosToSave,
      });
      const savedCategories = data?.categories?.length ? data.categories : normalized;
      const savedTotalVideos = normalizePlannerTotalVideos(
        data?.totalVideos,
        totalVideosToSave,
      );
      onSaved({ categories: savedCategories, totalVideos: savedTotalVideos });
      setDirty(false);
      toast.success("Taxonomies saved");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save taxonomies");
    } finally {
      setSaving(false);
    }
  }, [draft, totalVideoCount, totalCachedVideos, onSaved, onClose]);

  if (!open) return null;

  return (
    <>
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={handleRequestClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col buffer-card shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 px-4 py-3.5 border-b buffer-border">
          <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950/30">
              <Layers size={18} className="text-primary-500" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-sm font-semibold buffer-text leading-snug truncate">
                Manage taxonomies
              </h3>
              <p className="text-[11px] buffer-text-subtle leading-snug mt-0.5 line-clamp-2 sm:line-clamp-none">
                Distribute videos by taxonomy percentage and keyword matching.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 flex-nowrap">
            <label
              className="inline-flex items-center gap-1 rounded-lg border buffer-border bg-gray-50/60 dark:bg-gray-800/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle whitespace-nowrap"
              title="Total videos to distribute across taxonomies by percentage"
            >
              <span className="hidden min-[480px]:inline">Total videos</span>
              <span className="min-[480px]:hidden">Total</span>
              <input
                type="number"
                min={1}
                max={500}
                value={totalVideoCount}
                onChange={(e) => handleTotalVideosChange(e.target.value)}
                onBlur={() =>
                  setTotalVideoCount((v) => normalizePlannerTotalVideos(v, totalCachedVideos || 1))
                }
                className="buffer-input text-xs w-12 py-0.5 px-1 text-center tabular-nums"
                aria-label="Total videos"
              />
            </label>
            {dirty && (
              <span
                className="inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/40"
                title="Keyword/taxonomy changes are staged but not yet saved. Click “Save taxonomies” to persist."
              >
                <span className="hidden sm:inline">Unsaved changes</span>
                <span className="sm:hidden">Unsaved</span>
              </span>
            )}
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap tabular-nums ${
                percentTotal === 100
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/40"
              }`}
              title="Sum of taxonomy percentages"
            >
              Total {percentTotal}%
            </span>
            <button
              type="button"
              onClick={handleRequestClose}
              className={`${ICON_BTN} shrink-0`}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4">
          <p className="text-[11px] buffer-text-subtle mb-3 leading-relaxed">
            Keywords use <span className="font-semibold buffer-text">Tamil - English</span> format (e.g. வேலைவாய்ப்பு - employment)
            and are matched against cached video titles — either part can match. Use{" "}
            <span className="font-semibold buffer-text">Manage keywords</span> to edit, or the{" "}
            <span className="font-semibold buffer-text">AI</span> button to reformat non-conforming keywords.
            The <span className="font-semibold buffer-text">Videos</span> column shows each taxonomy&apos;s share of{" "}
            <span className="font-semibold buffer-text">Total videos</span> above ({totalCachedVideos}{" "}
            {totalCachedVideos === 1 ? "video" : "videos"} currently cached).
          </p>
          <div className="rounded-xl border buffer-border overflow-hidden">
            <div
              className={`${CATEGORY_TABLE_ROW_CLASSES} hidden sm:grid py-2 bg-gray-50/80 dark:bg-gray-800/40 border-b buffer-border text-[10px] font-semibold uppercase tracking-wider buffer-text-subtle`}
              aria-hidden
            >
              <span className={`${CATEGORY_TABLE_COL.order} text-center`}>Order</span>
              <span className={CATEGORY_TABLE_COL.category}>Taxonomy</span>
              <span className={`${CATEGORY_TABLE_COL.percent} text-left`}>%</span>
              <span className={`${CATEGORY_TABLE_COL.keywords} text-left`}>Keywords</span>
              <span className={`${CATEGORY_TABLE_COL.videos} text-center`}>Videos</span>
              <span className={CATEGORY_TABLE_COL.remove} aria-hidden="true" />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {draft.map((cat, i) => (
                <PlannerCategoryEditorRow
                  key={i}
                  category={cat}
                  index={i}
                  onChange={updateCategory}
                  onRemove={removeCategory}
                  onMoveUp={() => moveCategory(i, -1)}
                  onMoveDown={() => moveCategory(i, 1)}
                  canMoveUp={i > 0}
                  canMoveDown={i < draft.length - 1}
                  totalVideoCount={normalizedTotalVideoCount}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-2 py-2 mt-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/25 transition-colors"
          >
            <Plus size={14} /> Add taxonomy
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t buffer-border bg-gray-50/40 dark:bg-gray-800/20">
          <button
            type="button"
            onClick={handleRequestClose}
            className="buffer-button-secondary text-xs py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="buffer-button-primary text-xs py-2 flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save taxonomies
          </button>
        </div>
      </div>
    </div>
    <DiscardUnsavedChangesModal
      open={discardConfirmOpen}
      onCancel={() => setDiscardConfirmOpen(false)}
      onConfirm={handleConfirmDiscard}
    />
    </>
  );
}
