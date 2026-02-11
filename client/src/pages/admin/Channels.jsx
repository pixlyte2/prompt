import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";
import ConfirmModal from "../../components/ConfirmModal";

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);

  const [editingChannel, setEditingChannel] = useState(null);
  const [editName, setEditName] = useState("");

  /* ================= LOAD ================= */

  const loadChannels = async () => {
    try {
      setLoading(true);
      const res = await api.get("/channels");
      setChannels(res.data);
    } catch (err) {
      toast.error("Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  /* ================= CREATE ================= */

  const createChannel = async () => {
    if (!name) return toast.error("Channel name required");

    try {
      setLoading(true);
      await api.post("/channels", { name });
      toast.success("Channel created successfully");
      setName("");
      loadChannels();
    } catch (err) {
      toast.error("Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */

  const openEditModal = (channel) => {
    setEditingChannel(channel);
    setEditName(channel.name);
  };

  const saveEdit = async () => {
    if (!editName) return toast.error("Channel name required");

    try {
      setLoading(true);
      await api.put(`/channels/${editingChannel._id}`, {
        name: editName
      });

      toast.success("Channel updated successfully");
      setEditingChannel(null);
      loadChannels();
    } catch (err) {
      toast.error("Failed to update channel");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const openDeleteModal = (channel) => {
    setChannelToDelete(channel);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/channels/${channelToDelete._id}`);
      toast.success("Channel deleted successfully");
      setDeleteModalOpen(false);
      loadChannels();
    } catch (err) {
      toast.error("Failed to delete channel");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout title="Channel Management">
      <Toaster position="top-right" />

      {/* CREATE */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h3 className="text-xl font-semibold mb-4">Create Channel</h3>

        <div className="flex gap-3">
          <input
            className="border px-4 py-2 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Channel name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            onClick={createChannel}
            disabled={loading}
            className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">Channels</h3>

        {loading ? (
          <div className="text-center py-10">
            <span className="h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></span>
          </div>
        ) : channels.length === 0 ? (
          <p className="text-gray-500">No channels found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Channel Name</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {channels.map((c) => (
                <tr key={c._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3 text-center space-x-4">
                    <button
                      onClick={() => openEditModal(c)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => openDeleteModal(c)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingChannel && (
        <ConfirmModal
          isOpen={true}
          title="Edit Channel"
          message={
            <input
              className="w-full border px-3 py-2 rounded-lg mt-3"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          }
          confirmText="Save"
          onConfirm={saveEdit}
          onCancel={() => setEditingChannel(null)}
          loading={loading}
        />
      )}

      {/* DELETE MODAL */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Channel"
        message={`Are you sure you want to delete "${channelToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
}
