import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Layers, X } from "lucide-react";
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
  const [showAddModal, setShowAddModal] = useState(false);

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
      setShowAddModal(false);
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
    <AdminLayout 
      title="Channel Management" 
      titleInfo="Organize your content with channels"
      icon={Layers}
    >
      <PageSectionLoader show={isLoading("page")} />

      {/* Add Channel Button */}
      <div className="max-w-3xl mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
        >
          <Plus size={20} />
          Add New Channel
        </button>
      </div>

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Add New Channel
              </h3>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Channel Name</label>
              <input
                placeholder="Enter channel name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createChannel}
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
                    Create Channel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Channels ({filteredChannels.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr className="text-gray-700">
                <th className="px-4 py-3 text-left font-semibold">Channel Name</th>
                <th className="px-4 py-3 text-left font-semibold">Created Date</th>
                <th className="px-4 py-3 text-center font-semibold w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredChannels.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Edit channel"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(c)}
                        className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Delete channel"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredChannels.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No channels found</h3>
              <p className="text-gray-500">Create your first channel to get started</p>
            </div>
          )}
        </div>
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