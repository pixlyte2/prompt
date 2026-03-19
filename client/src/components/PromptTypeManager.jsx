import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag, Search, ArrowUpDown } from "lucide-react";
import api from "../services/api";
import useLoading from "../hooks/useLoading";
import PageSectionLoader from "../components/PageSectionLoader";
import ConfirmModal from "../components/ConfirmModal";

export default function PromptTypeManager() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { startLoading, stopLoading, isLoading } = useLoading();

  useEffect(() => {
    const load = async () => {
      try {
        startLoading("page");
        const pt = await api.get("/prompt-types");
        setTypes(pt.data);
      } catch {
        toast.error("Failed to load data");
      } finally {
        stopLoading("page");
      }
    };
    load();
  }, []);

  const create = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      setLoading(true);
      const res = await api.post("/prompt-types", form);
      setTypes(prev => [res.data, ...prev]);
      setForm({ name: "" });
      setShowAddModal(false);
      toast.success("Created successfully");
    } catch {
      toast.error("Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editName.trim()) return toast.error("Name required");
    try {
      setLoading(true);
      const res = await api.put(`/prompt-types/${editing._id}`, { name: editName });
      setTypes(prev => prev.map(t => t._id === editing._id ? res.data : t));
      toast.success("Updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/prompt-types/${deleting._id}`);
      setTypes(prev => prev.filter(t => t._id !== deleting._id));
      toast.success("Deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const filtered = types
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      if (sortConfig.key === "createdAt") {
        const d = new Date(a.createdAt) - new Date(b.createdAt);
        return sortConfig.direction === "asc" ? d : -d;
      }
      const cmp = (a[sortConfig.key] || "").localeCompare(b[sortConfig.key] || "");
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });

  return (
    <>
      <PageSectionLoader show={isLoading("page")} />

      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompt types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="buffer-input pl-9 py-2 text-sm"
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="buffer-button-primary flex items-center gap-1.5 text-sm py-2">
            <Plus size={16} /> Add Type
          </button>
        </div>

        {/* Table */}
        <div className="buffer-card flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("name")}>
                    <span className="inline-flex items-center gap-1">Name <ArrowUpDown size={12} /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("createdAt")}>
                    <span className="inline-flex items-center gap-1">Created <ArrowUpDown size={12} /></span>
                  </th>
                  <th className="px-4 py-3 text-right font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                          <Tag size={14} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => { setEditing(t); setEditName(t.name); }}
                          className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleting(t)}
                          className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <Tag size={32} className="mb-2" />
                <p className="text-sm font-medium">No prompt types found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">New Prompt Type</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type name</label>
              <input
                placeholder="e.g. Script, Hook, CTA..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && create()}
                maxLength={30}
                className="buffer-input text-sm"
                autoFocus
              />
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => { setShowAddModal(false); setForm({ name: "" }); }} className="buffer-button-secondary text-sm py-2">Cancel</button>
              <button onClick={create} disabled={loading} className="buffer-button-primary text-sm py-2 flex items-center gap-1.5 disabled:opacity-50">
                {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <ConfirmModal
          isOpen={true}
          title="Edit Prompt Type"
          message={
            <input
              className="buffer-input text-sm mt-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              placeholder="Type name"
              autoFocus
            />
          }
          confirmText="Save"
          onConfirm={saveEdit}
          onCancel={() => setEditing(null)}
          loading={loading}
        />
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleting}
        title="Delete Prompt Type"
        message={`Delete "${deleting?.name}"? This can't be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        loading={loading}
        danger
      />
    </>
  );
}
