import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag, Download, Layers, X, Search, ArrowUpDown } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import { exportToCSV } from "../../utils/csvExport";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

export default function PromptTypes() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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
    if (!form.name.trim()) {
      return toast.error("Name is required");
    }
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
      toast.success("Updated successfully");
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
      toast.success("Deleted successfully");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!types.length) return toast.error("No data to export");
    const data = types.map(t => ({ Name: t.name }));
    exportToCSV(data, "prompt-types.csv");
    toast.success("Exported successfully");
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedTypes = types
    .filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
      const bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  return (
    <AdminLayout 
      title="Prompt Types" 
      titleInfo="Categorize your prompts with types"
      icon={Tag}
    >
      <PageSectionLoader show={isLoading("page")} />

      {/* Add Prompt Type Button and Search */}
      <div className="max-w-4xl mb-4 flex gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="buffer-button-primary flex items-center gap-1.5 text-sm py-2"
        >
          <Plus size={16} />
          Add Prompt Type
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search prompt types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="buffer-input pl-9 py-2 text-sm"
          />
        </div>
      </div>

      {/* Add Prompt Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Prompt Type</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type name</label>
              <input
                placeholder="Enter prompt type name..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={30}
                className="buffer-input text-sm"
                autoFocus
              />
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="buffer-button-secondary text-sm py-2">Cancel</button>
              <button
                onClick={create}
                disabled={loading}
                className="buffer-button-primary text-sm py-2 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                ) : (
                  <><Plus size={14} /> Create</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl">
        <div className="buffer-card flex-1 overflow-hidden flex flex-col min-h-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>
                  <span className="inline-flex items-center gap-1">Name <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort('createdAt')}>
                  <span className="inline-flex items-center gap-1">Created <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 text-right font-medium w-24">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {filteredAndSortedTypes.map(t => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Tag size={14} className="text-amber-600" />
                        </div>
                        <span className="font-medium text-gray-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => { setEditing(t); setEditName(t.name); }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleting(t)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
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
            {filteredAndSortedTypes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Tag size={32} className="mb-2" />
                <p className="text-sm font-medium">No prompt types found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Edit Type</h3>
            </div>
            <div className="p-5">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                className="buffer-input text-sm"
                autoFocus
              />
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="buffer-button-secondary text-sm py-2">Cancel</button>
              <button onClick={saveEdit} disabled={loading} className="buffer-button-primary text-sm py-2 disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Type</h3>
              <p className="text-sm text-gray-600">Delete "{deleting.name}"? This can't be undone.</p>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="buffer-button-secondary text-sm py-2">Cancel</button>
              <button onClick={confirmDelete} disabled={loading} className="buffer-button text-sm py-2 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}