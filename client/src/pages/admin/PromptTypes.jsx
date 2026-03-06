import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag, Download, Layers } from "lucide-react";
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

  return (
    <AdminLayout 
      title="Prompt Types" 
      titleInfo="Categorize your prompts with types"
      icon={Tag}
    >
      <PageSectionLoader show={isLoading("page")} />

      <div className="max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-600" />
            Create New Prompt Type
          </h3>

          <div className="flex gap-3">
            <select
              value={form.channelId}
              onChange={(e) => setForm({ ...form, channelId: e.target.value })}
              className="w-64 border-2 border-gray-200 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-all"
            >
              <option value="" disabled>Choose a channel...</option>
              {channels.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="Enter prompt type name..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={30}
              className="flex-1 max-w-md border-2 border-gray-200 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
            <button
              onClick={create}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Plus size={16} />
              )}
              Create Type
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Prompt Types ({types.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr className="text-gray-700">
                <th className="px-6 py-4 text-left font-semibold">Channel</th>
                <th className="px-6 py-4 text-left font-semibold">Type Name</th>
                <th className="px-6 py-4 text-center font-semibold w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map(t => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{t.channelId?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Tag className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { setEditing(t); setEditName(t.name); }}
                        className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Edit prompt type"
                      >
                        <Pencil size={24} />
                      </button>
                      <button
                        onClick={() => setDeleting(t)}
                        className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Delete prompt type"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {types.length === 0 && (
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