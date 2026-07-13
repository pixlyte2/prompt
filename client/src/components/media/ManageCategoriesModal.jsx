import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Trash2, Plus, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import EditCategoryModal from "./EditCategoryModal";

/**
 * ManageCategoriesModal — list, add, edit and delete media categories.
 *
 * @param {{ isOpen: boolean, categories: object[], onClose: () => void, onChanged: () => void }} props
 */
export default function ManageCategoriesModal({ isOpen, categories, onClose, onChanged }) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null); // { _id, name, entryCount }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reset add-form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewName("");
      setNewDesc("");
    }
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    setAdding(true);
    try {
      await api.post("/media-categories", { name, description: newDesc.trim() });
      toast.success("Category added");
      setNewName("");
      setNewDesc("");
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add category");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/media-categories/${deleteTarget._id}`);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-cats-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-[34rem] buffer-card shadow-xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 id="manage-cats-title" className="text-sm font-semibold buffer-text">
              Manage Categories
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

          {/* Category list */}
          <div className="px-5 pt-4 pb-2 max-h-60 overflow-y-auto custom-scrollbar space-y-2">
            {categories.length === 0 ? (
              <p className="text-xs buffer-text-subtle text-center py-6">
                No categories yet — add one below.
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium buffer-text truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs buffer-text-subtle truncate">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(cat)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                      aria-label={`Edit ${cat.name}`}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(cat)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      aria-label={`Delete ${cat.name}`}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add new form */}
          <div className="px-5 pt-3 pb-5 border-t border-gray-100 dark:border-gray-700 mt-2 flex-shrink-0">
            <p className="text-xs font-medium buffer-text-subtle uppercase tracking-wider mb-2">
              Add New
            </p>
            <form onSubmit={handleAdd} className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <label htmlFor="new-cat-name" className="sr-only">Category name</label>
                  <input
                    id="new-cat-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Category name *"
                    className="buffer-input text-sm"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="new-cat-desc" className="sr-only">Description</label>
                  <input
                    id="new-cat-desc"
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="buffer-input text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={adding || !newName.trim()}
                  className="buffer-button-primary text-xs py-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adding ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit sub-modal */}
      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => {
            setEditingCategory(null);
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
          aria-labelledby="del-cat-title"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm buffer-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 id="del-cat-title" className="text-sm font-semibold buffer-text">
                    Delete &ldquo;{deleteTarget.name}&rdquo;?
                  </h3>
                  <p className="text-xs buffer-text-subtle mt-1.5 leading-relaxed">
                    This will permanently delete this category and{" "}
                    <strong className="buffer-text">all links inside it</strong>. This can&apos;t
                    be undone.
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
                Delete Category &amp; Links
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
