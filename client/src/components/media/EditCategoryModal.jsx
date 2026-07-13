import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

/**
 * EditCategoryModal — inline sub-modal triggered from ManageCategoriesModal.
 *
 * @param {{ category: object, onClose: () => void, onSaved: () => void }} props
 */
export default function EditCategoryModal({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(category?.name || "");
    setDescription(category?.description || "");
  }, [category]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/media-categories/${category._id}`, {
        name: trimmedName,
        description: description.trim(),
      });
      toast.success("Category updated");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-cat-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-sm buffer-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 id="edit-cat-title" className="text-sm font-semibold buffer-text">
            Edit Category
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label htmlFor="edit-cat-name" className="block text-xs font-medium buffer-text mb-1">
                Category Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="edit-cat-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="buffer-input text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-cat-desc" className="block text-xs font-medium buffer-text mb-1">
                Description
              </label>
              <input
                id="edit-cat-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                className="buffer-input text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-5 pb-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="buffer-button-secondary text-xs py-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="buffer-button-primary text-xs py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
