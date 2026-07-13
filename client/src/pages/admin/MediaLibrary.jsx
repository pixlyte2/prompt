import { useEffect, useState, useCallback } from "react";
import { Film, List, Link2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import PageSectionLoader from "../../components/PageSectionLoader";
import MediaEntryCard from "../../components/media/MediaEntryCard";
import ManageCategoriesModal from "../../components/media/ManageCategoriesModal";
import ManageLinksModal from "../../components/media/ManageLinksModal";
import AddLinkModal from "../../components/media/AddLinkModal";
import api from "../../services/api";

/**
 * MediaLibrary — top-level admin page for the dynamic category + entry system.
 * All data is fetched here and passed down to modals via props.
 */
export default function MediaLibrary() {
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal visibility
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showManageLinks, setShowManageLinks] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);

  /** Fetch both resources in parallel */
  const loadData = useCallback(async () => {
    try {
      const [catsRes, entriesRes] = await Promise.all([
        api.get("/media-categories"),
        api.get("/media-entries"),
      ]);
      setCategories(catsRes.data);
      setEntries(entriesRes.data);
    } catch {
      toast.error("Couldn't load LinkVault — please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Called by any modal after a successful mutation */
  const handleChanged = useCallback(() => {
    loadData();
  }, [loadData]);

  /** Entries grouped by category (preserving category order) */
  const entriesByCategory = categories.map((cat) => ({
    category: cat,
    entries: entries.filter((e) => e.categoryId === cat._id),
  }));

  /** Track new entry optimistically for smooth UX */
  const handleLinkSaved = useCallback((newEntry) => {
    setEntries((prev) => [newEntry, ...prev]);
    // Full refresh to ensure consistency
    loadData();
  }, [loadData]);

  return (
    <AdminLayout title="LinkVault" icon={Film}>
      {/* Topbar action buttons — rendered as page-level content above main body */}
      <div className="flex flex-col min-h-0">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 mb-5">
          <button
            type="button"
            onClick={() => setShowManageCategories(true)}
            className="buffer-button-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <List size={13} aria-hidden="true" />
            Manage Categories
          </button>
          <button
            type="button"
            onClick={() => setShowManageLinks(true)}
            className="buffer-button-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <Link2 size={13} aria-hidden="true" />
            Manage Links
          </button>
          <button
            type="button"
            onClick={() => setShowAddLink(true)}
            className="buffer-button-primary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus size={13} aria-hidden="true" />
            Add Link
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="relative flex-1 min-h-[16rem]">
            <PageSectionLoader show={loading} />
          </div>
        ) : categories.length === 0 ? (
          /* Empty state — no categories */
          <div className="buffer-card flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Film size={24} className="text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold buffer-text">No categories yet</p>
              <p className="text-xs buffer-text-subtle mt-1 max-w-xs mx-auto">
                Create your first category to start organising media links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManageCategories(true)}
              className="buffer-button-primary text-xs py-2 flex items-center gap-1.5"
            >
              <Plus size={13} aria-hidden="true" />
              Add Category
            </button>
          </div>
        ) : (
          /* Main content — one section per category */
          <div className="space-y-8">
            {entriesByCategory.map(({ category, entries: catEntries }, catIndex) => (
              <section key={category._id} aria-labelledby={`cat-heading-${category._id}`}>
                {/* Category heading */}
                <div className="mb-1">
                  <div className="flex items-baseline gap-2">
                    <h2
                      id={`cat-heading-${category._id}`}
                      className="text-sm font-semibold buffer-text"
                    >
                      {category.name}
                    </h2>
                    <span
                      className="text-xs buffer-text-subtle bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full tabular-nums"
                      aria-label={`${catEntries.length} ${catEntries.length === 1 ? "entry" : "entries"}`}
                    >
                      {catEntries.length}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-xs buffer-text-subtle mt-0.5">{category.description}</p>
                  )}
                </div>

                {/* Entry cards */}
                {catEntries.length === 0 ? (
                  <p className="text-xs buffer-text-subtle italic mt-3">
                    No links in this category yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                    {catEntries.map((entry) => (
                      <MediaEntryCard
                        key={entry._id}
                        entry={entry}
                        categoryIndex={catIndex}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}

            {/* Uncategorised entries (orphaned) */}
            {(() => {
              const catIds = new Set(categories.map((c) => c._id));
              const orphans = entries.filter((e) => !catIds.has(e.categoryId));
              if (orphans.length === 0) return null;
              return (
                <section aria-labelledby="cat-heading-orphan">
                  <div className="mb-1">
                    <h2 id="cat-heading-orphan" className="text-sm font-semibold buffer-text">
                      Uncategorised
                    </h2>
                    <p className="text-xs buffer-text-subtle mt-0.5">
                      Links whose category has been deleted.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                    {orphans.map((entry) => (
                      <MediaEntryCard key={entry._id} entry={entry} categoryIndex={6} />
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modals */}
      <ManageCategoriesModal
        isOpen={showManageCategories}
        categories={categories}
        onClose={() => setShowManageCategories(false)}
        onChanged={handleChanged}
      />

      <ManageLinksModal
        isOpen={showManageLinks}
        categories={categories}
        entries={entries}
        onClose={() => setShowManageLinks(false)}
        onChanged={handleChanged}
      />

      <AddLinkModal
        isOpen={showAddLink}
        categories={categories}
        onClose={() => setShowAddLink(false)}
        onSaved={handleLinkSaved}
      />
    </AdminLayout>
  );
}
