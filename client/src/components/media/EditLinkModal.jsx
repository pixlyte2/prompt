import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

/* ── Platform field definitions ──────────────────────────────────────────── */
const PLATFORM_FIELDS = [
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/…",
    icon: (
      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/…",
    icon: (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "twitter",
    label: "Twitter / X",
    placeholder: "https://twitter.com/…",
    icon: (
      <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/…",
    icon: (
      <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "website",
    label: "Website",
    placeholder: "https://example.com",
    icon: (
      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
      </svg>
    ),
  },
];

function isValidUrl(val) {
  if (!val) return true;
  return /^https?:\/\/.+/.test(val.trim());
}

const emptyCustomLink = () => ({ label: "", url: "" });

/**
 * EditLinkModal — pre-populated form to update an existing media entry.
 *
 * @param {{ entry: object, categories: object[], onClose: () => void, onSaved: () => void }} props
 */
export default function EditLinkModal({ entry, categories, onClose, onSaved }) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState({
    youtube: "", facebook: "", twitter: "", instagram: "", website: "",
  });
  const [customLinks, setCustomLinks] = useState([emptyCustomLink()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Populate from entry prop
  useEffect(() => {
    if (!entry) return;
    setCategoryId(entry.categoryId || "");
    setName(entry.name || "");
    setDescription(entry.description || "");
    setPlatforms({
      youtube: entry.youtube || "",
      facebook: entry.facebook || "",
      twitter: entry.twitter || "",
      instagram: entry.instagram || "",
      website: entry.website || "",
    });
    const cls = Array.isArray(entry.customLinks) && entry.customLinks.length > 0
      ? entry.customLinks.map((cl) => ({ label: cl.label || "", url: cl.url || "" }))
      : [emptyCustomLink()];
    setCustomLinks(cls);
    setErrors({});
  }, [entry]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const validate = () => {
    const newErrors = {};
    if (!categoryId) newErrors.categoryId = "Category is required";
    if (!name.trim()) newErrors.name = "Name is required";
    for (const { key } of PLATFORM_FIELDS) {
      if (platforms[key] && !isValidUrl(platforms[key])) {
        newErrors[key] = "Must start with http:// or https://";
      }
    }
    customLinks.forEach((cl, i) => {
      if (cl.label || cl.url) {
        if (!cl.label.trim()) newErrors[`cl_label_${i}`] = "Label required";
        if (!cl.url.trim()) newErrors[`cl_url_${i}`] = "URL required";
        else if (!isValidUrl(cl.url)) newErrors[`cl_url_${i}`] = "Must start with http:// or https://";
      }
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId,
        name: name.trim(),
        description: description.trim(),
        ...Object.fromEntries(
          PLATFORM_FIELDS.map(({ key }) => [key, platforms[key].trim()])
        ),
        customLinks: customLinks
          .filter((cl) => cl.label.trim() && cl.url.trim())
          .map((cl) => ({ label: cl.label.trim(), url: cl.url.trim() })),
      };
      await api.put(`/media-entries/${entry._id}`, payload);
      toast.success("Link updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update link");
    } finally {
      setSaving(false);
    }
  };

  const updateCustomLink = (index, field, value) => {
    setCustomLinks((prev) => prev.map((cl, i) => i === index ? { ...cl, [field]: value } : cl));
  };

  const removeCustomLink = (index) => {
    setCustomLinks((prev) => prev.filter((_, i) => i !== index));
  };

  if (!entry) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-link-title"
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-lg buffer-card shadow-xl flex flex-col overflow-hidden"
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 id="edit-link-title" className="text-sm font-semibold buffer-text">Edit Link</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">

              {/* Category */}
              <div>
                <label htmlFor="edit-link-cat" className="block text-xs font-medium buffer-text mb-1">
                  Category <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select
                  id="edit-link-cat"
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setErrors((p) => ({ ...p, categoryId: undefined })); }}
                  className="buffer-input text-sm"
                  required
                >
                  <option value="" disabled>Select a category…</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
              </div>

              {/* Name + Description */}
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <label htmlFor="edit-link-name" className="block text-xs font-medium buffer-text mb-1">
                    Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="edit-link-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                    placeholder="e.g. NSW Government"
                    className="buffer-input text-sm"
                    required
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="edit-link-desc" className="block text-xs font-medium buffer-text mb-1">
                    Description
                  </label>
                  <input
                    id="edit-link-desc"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                    className="buffer-input text-sm"
                  />
                </div>
              </div>

              {/* Platform URLs */}
              <div>
                <p className="text-xs font-medium buffer-text mb-2">Platform Links</p>
                <div className="space-y-2">
                  {PLATFORM_FIELDS.map(({ key, label, placeholder, icon }) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label htmlFor={`edit-plat-${key}`} className="sr-only">{label}</label>
                        <input
                          id={`edit-plat-${key}`}
                          type="url"
                          value={platforms[key]}
                          onChange={(e) => {
                            setPlatforms((p) => ({ ...p, [key]: e.target.value }));
                            setErrors((p) => ({ ...p, [key]: undefined }));
                          }}
                          placeholder={placeholder}
                          className="buffer-input text-sm"
                        />
                        {errors[key] && <p className="text-xs text-red-500 mt-0.5">{errors[key]}</p>}
                      </div>
                      <span className="text-xs buffer-text-subtle flex-shrink-0 w-20 hidden sm:block">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Links */}
              <div>
                <p className="text-xs font-medium buffer-text mb-2">Custom Links</p>
                <div className="space-y-2">
                  {customLinks.map((cl, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-[6.5rem]">
                        <label htmlFor={`ecl-label-${i}`} className="sr-only">Custom link label</label>
                        <input
                          id={`ecl-label-${i}`}
                          type="text"
                          value={cl.label}
                          onChange={(e) => { updateCustomLink(i, "label", e.target.value); setErrors((p) => ({ ...p, [`cl_label_${i}`]: undefined })); }}
                          placeholder="Label"
                          className="buffer-input text-sm"
                        />
                        {errors[`cl_label_${i}`] && <p className="text-xs text-red-500 mt-0.5">{errors[`cl_label_${i}`]}</p>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label htmlFor={`ecl-url-${i}`} className="sr-only">Custom link URL</label>
                        <input
                          id={`ecl-url-${i}`}
                          type="url"
                          value={cl.url}
                          onChange={(e) => { updateCustomLink(i, "url", e.target.value); setErrors((p) => ({ ...p, [`cl_url_${i}`]: undefined })); }}
                          placeholder="https://…"
                          className="buffer-input text-sm"
                        />
                        {errors[`cl_url_${i}`] && <p className="text-xs text-red-500 mt-0.5">{errors[`cl_url_${i}`]}</p>}
                      </div>
                      {customLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCustomLink(i)}
                          className="flex-shrink-0 mt-1 p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          aria-label={`Remove custom link ${i + 1}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomLinks((p) => [...p, emptyCustomLink()])}
                    className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline transition-colors"
                  >
                    <Plus size={13} /> Add custom link
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                disabled={saving}
                className="buffer-button-primary text-xs py-2 flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
