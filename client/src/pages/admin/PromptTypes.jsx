import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";
import ConfirmModal from "../../components/ConfirmModal";

export default function PromptTypes() {
  const [channels, setChannels] = useState([]);
  const [types, setTypes] = useState([]);

  const [form, setForm] = useState({
    name: "",
    channelId: ""
  });

  const [loading, setLoading] = useState(false);

  /* ===== EDIT STATE ===== */
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  /* ===== DELETE STATE ===== */
  const [showDelete, setShowDelete] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  /* ===== LOAD DATA ===== */
  const load = async () => {
    try {
      setLoading(true);

      const ch = await api.get("/channels");
      const pt = await api.get("/prompt-types");

      setChannels(ch.data);
      setTypes(pt.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ===== CREATE ===== */
  const create = async () => {
    if (!form.name.trim() || !form.channelId) {
      return toast.error("All fields required");
    }

    try {
      setLoading(true);

      const res = await api.post("/prompt-types", form);

      // Soft add
      setTypes(prev => [res.data, ...prev]);
      setForm({ name: "", channelId: "" });

      toast.success("Prompt type created successfully");
    } catch (err) {
      toast.error("Failed to create prompt type");
    } finally {
      setLoading(false);
    }
  };

  /* ===== EDIT ===== */
  const openEdit = (type) => {
    setEditing(type);
    setEditName(type.name);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      return toast.error("Name required");
    }

    try {
      setLoading(true);

      const res = await api.put(`/prompt-types/${editing._id}`, {
        name: editName
      });

      // Soft update
      setTypes(prev =>
        prev.map(t =>
          t._id === editing._id ? res.data : t
        )
      );

      toast.success("Prompt type updated successfully");

      setShowEdit(false);
      setEditing(null);
      setEditName("");
    } catch (err) {
      toast.error("Failed to update prompt type");
    } finally {
      setLoading(false);
    }
  };

  /* ===== DELETE ===== */
  const openDelete = (type) => {
    setTypeToDelete(type);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);

      await api.delete(`/prompt-types/${typeToDelete._id}`);

      // Soft delete
      setTypes(prev =>
        prev.filter(t => t._id !== typeToDelete._id)
      );

      toast.success("Prompt type deleted successfully");

      setShowDelete(false);
      setTypeToDelete(null);
    } catch (err) {
      toast.error("Failed to delete prompt type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Prompt Types">
      <Toaster position="top-right" />

      {/* ===== HEADER ===== */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">
          Prompt Types
        </h2>
        <p className="text-gray-500 text-sm">
          Organize prompt types under channels
        </p>
      </div>

      {/* ===== CREATE SECTION ===== */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">

          <input
            placeholder="Prompt type name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="border px-4 py-2 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <select
            value={form.channelId}
            onChange={(e) =>
              setForm({ ...form, channelId: e.target.value })
            }
            className="border px-4 py-2 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select Channel</option>
            {channels.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={create}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Plus size={16} />
            )}
            Add
          </button>
        </div>
      </div>

      {/* ===== TABLE LIST ===== */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        {loading && types.length === 0 ? (
          <div className="text-center py-16">
            <span className="h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></span>
          </div>
        ) : types.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📝</div>
            <h4 className="font-semibold text-lg">
              No Prompt Types Found
            </h4>
            <p className="text-gray-500 text-sm">
              Create your first prompt type
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left font-medium text-gray-600">
                  Name
                </th>
                <th className="p-4 text-left font-medium text-gray-600">
                  Channel
                </th>
                <th className="p-4 text-center font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {types.map((t) => (
                <tr
                  key={t._id}
                  className="border-b last:border-none hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium text-gray-800">
                    {t.name}
                  </td>

                  <td className="p-4 text-gray-600">
                    {t.channelId?.name || "-"}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-4 opacity-70 hover:opacity-100 transition">
                      <button
                        onClick={() => openEdit(t)}
                        className="hover:text-blue-600"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => openDelete(t)}
                        className="hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== EDIT MODAL ===== */}
      <ConfirmModal
        isOpen={showEdit}
        title="Edit Prompt Type"
        message={
          <input
            className="w-full border px-3 py-2 rounded-lg mt-3"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        }
        confirmText="Save"
        onConfirm={saveEdit}
        onCancel={() => setShowEdit(false)}
        loading={loading}
      />

      {/* ===== DELETE MODAL ===== */}
      <ConfirmModal
        isOpen={showDelete}
        title="Delete Prompt Type"
        message={`Are you sure you want to delete "${typeToDelete?.name}"?`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowDelete(false)}
        loading={loading}
      />
    </AdminLayout>
  );
}
