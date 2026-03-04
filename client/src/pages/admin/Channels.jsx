import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Hash } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";
import ConfirmModal from "../../components/ConfirmModal";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [search, setSearch] = useState("");
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

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Channel Management">
      <div className="min-h-screen bg-gray-50 p-6">
        <PageSectionLoader show={isLoading("page")} />
        <Toaster position="top-right" />

        {/* HEADER SECTION */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Channel</h3>
                  <p className="text-sm text-gray-500">Add new channels to organize your content</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
                <input
                  placeholder="Enter channel name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={createChannel}
                  disabled={loading || !name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Channel
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-end">
                <input
                  placeholder="Search channels..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Channels ({filteredChannels.length} {filteredChannels.length === 1 ? 'channel' : 'channels'})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr className="text-gray-700">
                  <th className="px-6 py-4 text-left font-semibold">Channel Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Created Date</th>
                  <th className="px-6 py-4 text-center font-semibold w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredChannels.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                          className="group relative p-2 bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Edit channel"
                        >
                          <Pencil size={14} className="group-hover:scale-110 transition-transform duration-200" />
                          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          className="group relative p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Delete channel"
                        >
                          <Trash2 size={14} className="group-hover:scale-110 transition-transform duration-200" />
                          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Delete
                          </span>
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
                  <Hash className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No channels found</h3>
                <p className="text-gray-500">
                  {search ? "Try adjusting your search criteria" : "Create your first channel to get started"}
                </p>
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
          message={`Are you sure you want to delete "${channelToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModalOpen(false)}
          loading={deleteLoading}
        />
      </div>
    </AdminLayout>
  );
}