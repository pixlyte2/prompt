import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag, Download, Layers, X, Search, ArrowUpDown } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import { exportToCSV } from "../../utils/csvExport";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

export default function PromptTypes() {
  const [channels, setChannels] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ name: "", channelId: "" });
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
        const [ch, pt] = await Promise.all([
          api.get("/channels"),
          api.get("/prompt-types")
        ]);
        setChannels(ch.data);
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
    if (!form.name.trim() || !form.channelId) {
      return toast.error("All fields required");
    }
    try {
      setLoading(true);
      const res = await api.post("/prompt-types", form);
      setTypes(prev => [res.data, ...prev]);
      setForm({ name: "", channelId: "" });
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
    const data = types.map(t => ({ Name: t.name, Channel: t.channelId?.name || "-" }));
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
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.channelId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aVal, bVal;
      if (sortConfig.key === 'channel') {
        aVal = a.channelId?.name?.toLowerCase() || '';
        bVal = b.channelId?.name?.toLowerCase() || '';
      } else {
        aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
        bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
      }
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
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
        >
          <Plus size={20} />
          Add New Prompt Type
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search prompt types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Add Prompt Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Add New Prompt Type
              </h3>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Channel</label>
                <select
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="" disabled>Choose a channel...</option>
                  {channels.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Prompt Type Name</label>
                <input
                  placeholder="Enter prompt type name..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={30}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Create Type
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Prompt Types ({filteredAndSortedTypes.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr className="text-gray-700">
                <th className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('channel')}>
                  <div className="flex items-center gap-2">
                    Channel
                    <ArrowUpDown size={14} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    Type Name
                    <ArrowUpDown size={14} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedTypes.map(t => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{t.channelId?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { setEditing(t); setEditName(t.name); }}
                        className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Edit prompt type"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleting(t)}
                        className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Delete prompt type"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAndSortedTypes.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No prompt types found</h3>
              <p className="text-gray-500">Create your first prompt type to get started</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Type</h3>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(null)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Delete Type</h3>
            <p className="mb-4">Delete "{deleting.name}"?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleting(null)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}