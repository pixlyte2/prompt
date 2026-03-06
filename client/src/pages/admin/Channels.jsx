import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Layers } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
import ConfirmModal from "../../components/ConfirmModal";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);

  const { startLoading, stopLoading, isLoading } = useLoading();

  const loadChannels = async () => {
    try {
      startLoading("page");
      const res = await api.get("/channels");
      setChannels(res.data);
    } catch {
      toast.error("Failed to load channels");
    } finally {
      stopLoading("page");
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const createChannel = async () => {
    if (!name.trim()) return toast.error("Channel name required");

    const exists = channels.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) return toast.error("Channel name already exists");

    try {
      setLoading(true);
      const res = await api.post("/channels", { name });
      setChannels(prev => [res.data, ...prev]);
      setName("");
      toast.success("Channel created successfully");
    } catch {
      toast.error("Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (channel) => {
    setEditingChannel(channel);
    setEditName(channel.name);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return toast.error("Channel name required");

    try {
      setLoading(true);
      const res = await api.put(`/channels/${editingChannel._id}`, { name: editName });
      setChannels(prev => prev.map(c => c._id === editingChannel._id ? res.data : c));
      toast.success("Channel updated successfully");
      setEditingChannel(null);
    } catch {
      toast.error("Failed to update channel");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (channel) => {
    setChannelToDelete(channel);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/channels/${channelToDelete._id}`);
      setChannels(prev => prev.filter(c => c._id !== channelToDelete._id));
      toast.success("Channel deleted successfully");
      setDeleteModalOpen(false);
    } catch {
      toast.error("Failed to delete channel");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredChannels = channels;

  return (
    <AdminLayout title="Channel Management">
      <PageSectionLoader show={isLoading("page")} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Channel Management
            </h2>
            <p className="text-blue-100">Organize your content with channels</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Create New Channel</h3>

        <div className="flex gap-3">
          <input
            placeholder="Enter channel name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="w-80 border-2 border-gray-200 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
          <button
            onClick={createChannel}
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

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-2xl">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Channels ({filteredChannels.length} {filteredChannels.length === 1 ? 'channel' : 'channels'})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr className="text-gray-700">
                  <th className="px-6 py-4 text-left font-semibold w-48">Channel Name</th>
                  <th className="px-6 py-4 text-left font-semibold w-32">Created Date</th>
                  <th className="px-6 py-4 text-center font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredChannels.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Layers className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Edit channel"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Delete channel"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredChannels.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Layers className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No channels found</h3>
                <p className="text-gray-500">Create your first channel to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* EDIT MODAL */}
        {editingChannel && (
          <ConfirmModal
            isOpen={true}
            title="Edit Channel"
            message={
              <input
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl mt-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Channel name"
              />
            }
            confirmText="Save Changes"
            onConfirm={saveEdit}
            onCancel={() => setEditingChannel(null)}
            loading={loading}
          />
        )}

        {/* DELETE MODAL */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete Channel"
          message={`Are you sure you want to delete "${channelToDelete?.name}"? This will also remove all associated prompt types and prompts. This action cannot be undone.`}
          confirmText="Delete Channel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModalOpen(false)}
          loading={deleteLoading}
          danger={true}
        />
    </AdminLayout>
  );
}