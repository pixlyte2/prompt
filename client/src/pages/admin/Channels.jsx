import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
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

  /* ================= LOAD ================= */

  const loadChannels = async () => {

    try {

      startLoading("page");   // 🔥 ONLY CHANNELS SECTION LOAD

      setLoading(true);

      const res = await api.get("/channels");
      setChannels(res.data);

    } catch {
      toast.error("Failed to load channels");
    } finally {

      setLoading(false);
      stopLoading("page");

    }

  };

  useEffect(() => {
    loadChannels();
  }, []);

  /* ================= CREATE ================= */

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

  /* ================= EDIT ================= */

  const openEditModal = (channel) => {
    setEditingChannel(channel);
    setEditName(channel.name);
  };

  const saveEdit = async () => {

    if (!editName.trim()) return toast.error("Channel name required");

    try {

      setLoading(true);

      const res = await api.put(`/channels/${editingChannel._id}`, {
        name: editName
      });

      setChannels(prev =>
        prev.map(c =>
          c._id === editingChannel._id ? res.data : c
        )
      );

      toast.success("Channel updated successfully");
      setEditingChannel(null);

    } catch {
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

      setChannels(prev =>
        prev.filter(c => c._id !== channelToDelete._id)
      );

      toast.success("Channel deleted successfully");
      setDeleteModalOpen(false);

    } catch {
      toast.error("Failed to delete channel");
    } finally {
      setDeleteLoading(false);
    }

  };

  /* ================= FILTER ================= */

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Channel Management">

      <div className="relative">

        {/* 🔥 PAGE SECTION LOADER */}
        <PageSectionLoader show={isLoading("page")} />

        <Toaster position="top-right" />

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">
            Channel Management
          </h2>
          <p className="text-gray-500 text-sm">
            Organize and manage your company channels
          </p>
        </div>

        {/* CREATE + SEARCH */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">

            <div className="flex gap-3 w-full md:w-auto">
              <input
                placeholder="New channel name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border px-4 py-2 rounded-xl outline-none w-full md:w-72"
              />

              <button
                onClick={createChannel}
                disabled={loading || !name.trim()}
                className="bg-blue-600 text-white px-5 rounded-xl flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={18} />
                Add
              </button>
            </div>

            <input
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-4 py-2 rounded-xl outline-none w-full md:w-72"
            />
          </div>
        </div>

        {/* LIST */}
        <div className="bg-white rounded-2xl border overflow-hidden">

          {filteredChannels.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📡</div>
              <h4 className="font-semibold text-lg">
                No Channels Found
              </h4>
              <p className="text-gray-500 text-sm">
                Try adjusting your search or create a new channel
              </p>
            </div>
          ) : (
            filteredChannels.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between px-6 py-4 border-b last:border-none hover:bg-gray-50"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    {c.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-5">
                  <button onClick={() => openEditModal(c)}>
                    <Pencil size={16} />
                  </button>

                  <button onClick={() => openDeleteModal(c)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
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
          message={`Are you sure you want to delete "${channelToDelete?.name}"?`}
          confirmText="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModalOpen(false)}
          loading={deleteLoading}
        />

      </div>
    </AdminLayout>
  );
}