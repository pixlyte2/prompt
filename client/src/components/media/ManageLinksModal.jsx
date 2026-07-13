import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Trash2, Loader2, AlertTriangle, Search, GripVertical, ChevronsUp, ChevronsDown, ChevronUp, ChevronDown, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import EditLinkModal from "./EditLinkModal";

const LS_KEY = "linkvault_sort_order";

/** Persist current local order to localStorage */
function persistToLocalStorage(localEntries) {
  try {
    const order = localEntries.map((e) => ({ id: e._id, sortOrder: e.sortOrder ?? 0 }));
    localStorage.setItem(LS_KEY, JSON.stringify(order));
  } catch { /* ignore */ }
}

/** Restore order from localStorage, merging into entries array */
function restoreFromLocalStorage(entries) {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!saved.length) return entries;
    const orderMap = {};
    saved.forEach(({ id, sortOrder }) => { orderMap[id] = sortOrder; });
    return entries
      .map((e) => orderMap[e._id] !== undefined ? { ...e, sortOrder: orderMap[e._id] } : e)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch { return entries; }
}

/**
 * ManageLinksModal — browse, filter, edit, reorder and delete all media entries.
 */
export default function ManageLinksModal({ isOpen, categories, entries, onClose, onChanged }) {
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [localEntries, setLocalEntries] = useState(() => restoreFromLocalStorage(entries));
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync when parent entries change (but don't clobber unsaved local order)
  useEffect(() => {
    if (!hasUnsaved) {
      setLocalEntries(restoreFromLocalStorage(entries));
    }
  }, [entries, hasUnsaved]);

  useEffect(() => {
    if (isOpen) {
      setFilterCategory("");
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const categoryMap = useMemo(() => {
    const m = {};
    for (const cat of categories) m[cat._id] = cat;
    return m;
  }, [categories]);

  const filteredEntries = useMemo(() => {
    let list = localEntries;
    if (filterCategory) list = list.filter((e) => e.categoryId === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.website?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [localEntries, filterCategory, searchQuery]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const entry of filteredEntries) {
      const id = entry.categoryId || "__none__";
      if (!groups[id]) groups[id] = [];
      groups[id].push(entry);
    }
    const catOrder = categories.map((c) => c._id);
    return Object.entries(groups).sort(([a], [b]) => {
      const ai = catOrder.indexOf(a);
      const bi = catOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filteredEntries, categories]);

  /** Move entry locally only — no API call */
  const moveEntry = useCallback((entry, direction) => {
    const catId = entry.categoryId || "__none__";
    const catList = localEntries
      .filter((e) => (e.categoryId || "__none__") === catId)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const idx = catList.findIndex((e) => e._id === entry._id);
    if (idx === -1) return;

    let newIdx;
    if (direction === "top")         newIdx = 0;
    else if (direction === "bottom") newIdx = catList.length - 1;
    else if (direction === "up")     newIdx = Math.max(0, idx - 1);
    else                             newIdx = Math.min(catList.length - 1, idx + 1);

    if (newIdx === idx) return;

    const reordered = [...catList];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, moved);

    setLocalEntries((prev) => {
      const others = prev.filter((e) => (e.categoryId || "__none__") !== catId);
      const updated = reordered.map((e, i) => ({ ...e, sortOrder: i }));
      const next = [...others, ...updated];
      persistToLocalStorage(next);
      return next;
    });
    setHasUnsaved(true);
  }, [localEntries]);

  /** Save all pending order changes to the server */
  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      // Group by category and send one reorder call per category
      const catGroups = {};
      for (const e of localEntries) {
        const catId = e.categoryId || "__none__";
        if (!catGroups[catId]) catGroups[catId] = [];
        catGroups[catId].push(e);
      }
      await Promise.all(
        Object.values(catGroups).map((group) => {
          const sorted = group.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          return api.put("/media-entries/reorder", {
            orderedIds: sorted.map((e) => e._id),
          });
        })
      );
      localStorage.removeItem(LS_KEY);
      setHasUnsaved(false);
      toast.success("Sort order saved");
    } catch (err) {
      console.error("handleSaveOrder error:", err);
      toast.error(err?.response?.data?.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  /** Primary domain from a URL for display */
  const primaryDomain = (entry) => {
    const url = entry.website || entry.youtube || entry.facebook || entry.twitter || entry.instagram;
    if (!url) return null;
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/media-entries/${deleteTarget._id}`);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete link");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-links-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-[38rem] buffer-card shadow-xl flex flex-col"
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 id="manage-links-title" className="text-sm font-semibold buffer-text">
              Manage Links
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Filter bar */}
          <div className="px-5 pt-3 pb-2.5 flex gap-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex-shrink-0" style={{ minWidth: 0, width: "11rem" }}>
              <label htmlFor="link-filter-cat" className="sr-only">Filter by category</label>
              <select
                id="link-filter-cat"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="buffer-input text-sm"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative min-w-0">
              <label htmlFor="link-search" className="sr-only">Search links</label>
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                id="link-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search links…"
                className="buffer-input text-sm pl-8"
              />
            </div>
          </div>

          {/* Links grouped by category */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-4 min-h-0">
            {grouped.length === 0 ? (
              <p className="text-xs buffer-text-subtle text-center py-10">
                {entries.length === 0 ? "No links yet — add one." : "No links match the current filter."}
              </p>
            ) : (
              grouped.map(([catId, catEntries]) => {
                const cat = categoryMap[catId];
                return (
                  <div key={catId}>
                    <p className="text-[11px] font-semibold buffer-text-subtle uppercase tracking-wider mb-1.5">
                      {cat ? cat.name : "Uncategorised"}
                    </p>
                    <div className="space-y-1.5">
                      {catEntries.map((entry, idx) => (
                        <div
                          key={entry._id}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 group"
                        >
                          {/* Drag handle (visual only) */}
                          <span className="text-gray-300 dark:text-gray-600 cursor-grab flex-shrink-0" title="Drag to reorder">
                            <GripVertical size={14} />
                          </span>

                          {/* Name + domain */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium buffer-text truncate">{entry.name}</p>
                            {primaryDomain(entry) && (
                              <p className="text-xs buffer-text-subtle truncate">{primaryDomain(entry)}</p>
                            )}
                          </div>

                          {/* Sort + action buttons — always visible on mobile, hover on desktop */}
                          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {/* Move to top */}
                            <button
                              type="button"
                              onClick={() => moveEntry(entry, "top")}
                              disabled={idx === 0}
                              className="p-1 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Move to top"
                              title="Move to top"
                            >
                              <ChevronsUp size={13} />
                            </button>
                            {/* Move up */}
                            <button
                              type="button"
                              onClick={() => moveEntry(entry, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Move up"
                              title="Move up"
                            >
                              <ChevronUp size={13} />
                            </button>
                            {/* Move down */}
                            <button
                              type="button"
                              onClick={() => moveEntry(entry, "down")}
                              disabled={idx === catEntries.length - 1}
                              className="p-1 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Move down"
                              title="Move down"
                            >
                              <ChevronDown size={13} />
                            </button>
                            {/* Move to bottom */}
                            <button
                              type="button"
                              onClick={() => moveEntry(entry, "bottom")}
                              disabled={idx === catEntries.length - 1}
                              className="p-1 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Move to bottom"
                              title="Move to bottom"
                            >
                              <ChevronsDown size={13} />
                            </button>
                            {/* Separator */}
                            <span className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-0.5" />
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => setEditingEntry(entry)}
                              className="p-1 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                              aria-label={`Edit ${entry.name}`}
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(entry)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              aria-label={`Delete ${entry.name}`}
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* Footer — Save Order button appears when there are unsaved changes */}
        {hasUnsaved && (
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 flex-shrink-0 bg-amber-50 dark:bg-amber-950/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              You have unsaved sort changes
            </p>
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={saving}
              className="buffer-button-primary text-xs py-1.5 flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? "Saving…" : "Save Order"}
            </button>
          </div>
        )}
      </div>

      {/* Edit sub-modal */}
      {editingEntry && (
        <EditLinkModal
          entry={editingEntry}
          categories={categories}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            onChanged();
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="del-link-title"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div
            className="relative z-10 w-full max-w-sm buffer-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 id="del-link-title" className="text-sm font-semibold buffer-text">
                    Delete &ldquo;{deleteTarget.name}&rdquo;?
                  </h3>
                  <p className="text-xs buffer-text-subtle mt-1.5">
                    This link will be permanently removed. This can&apos;t be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="buffer-button-secondary text-xs py-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="buffer-button text-xs py-2 text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading && <Loader2 size={13} className="animate-spin" />}
                Delete Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
