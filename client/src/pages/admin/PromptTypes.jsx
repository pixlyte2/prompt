import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag, Download } from "lucide-react";
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
    <AdminLayout title="Prompt Types">
      <PageSectionLoader show={isLoading("page")} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <Tag className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Prompt Types
            </h2>
            <p className="text-blue-100">Categorize your prompts with types</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Create New Prompt Type</h3>

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
            className="w-80 border-2 border-gray-200 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
          <button
            onClick={create}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus size={16} />
                Create
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold">Types ({types.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Channel</th>
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {types.map(t => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      {t.channelId?.name || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{t.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { setEditing(t); setEditName(t.name); }}
                        className="p-2 text-amber-600 hover:bg-amber-100 rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(t)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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