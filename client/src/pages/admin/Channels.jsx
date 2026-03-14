import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Layers, Search, ArrowUpDown } from "lucide-react";
import { toast } from "react-hot-toast";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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

  useEffect(() => { loadChannels(); }, []);

  const createChannel = async () => {
    if (!name.trim()) return toast.error("Channel name required");
    if (channels.some(c => c.name.toLowerCase() === name.trim().toLowerCase()))
      return toast.error("Channel name already exists");
    try {
      setLoading(true);
      const res = await api.post("/channels", { name });
      setChannels(prev => [res.data, ...prev]);
      setName("");
      setShowAddModal(false);
      toast.success("Channel created");
    } catch {
      toast.error("Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editName.trim()) return toast.error("Channel name required");
    try {
      setLoading(true);
      const res = await api.put(`/channels/${editingChannel._id}`, { name: editName });
      setChannels(prev => prev.map(c => c._id === editingChannel._id ? res.data : c));
      toast.success("Channel updated");
      setEditingChannel(null);
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/channels/${channelToDelete._id}`);
      setChannels(prev => prev.filter(c => c._id !== channelToDelete._id));
      toast.success("Channel deleted");
      setDeleteModalOpen(false);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const filteredChannels = channels
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      if (sortConfig.key === "createdAt") {
        const d = new Date(a.createdAt) - new Date(b.createdAt);
        return sortConfig.direction === "asc" ? d : -d;
      }
      const cmp = (a[sortConfig.key] || "").localeCompare(b[sortConfig.key] || "");
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });

  return (
    <AdminLayout title="Channels" titleInfo={`${channels.length} channels`} icon={Layers}>
      <PageSectionLoader show={isLoading("page")} />

      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="buffer-input pl-9 py-2 text-sm"
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="buffer-button-primary flex items-center gap-1.5 text-sm py-2">
            <Plus size={16} /> Add Channel
          </button>
        </div>

        {/* Table */}
        <div className="buffer-card flex-1 overflow-hidden flex flex-col min-h-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort("name")}>
                  <span className="inline-flex items-center gap-1">Name <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort("createdAt")}>
                  <span className="inline-flex items-center gap-1">Created <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 text-right font-medium w-24">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {filteredChannels.map((c) => (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Layers size={14} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => { setEditingChannel(c); setEditName(c.name); }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setChannelToDelete(c); setDeleteModalOpen(true); }}
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
            {filteredChannels.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Layers size={32} className="mb-2" />
                <p className="text-sm font-medium">No channels found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Channel</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel name</label>
              <input
                placeholder="e.g. Instagram, YouTube..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createChannel()}
                maxLength={30}
                className="buffer-input text-sm"
                autoFocus
              />
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => { setShowAddModal(false); setName(""); }} className="buffer-button-secondary text-sm py-2">
                Cancel
              </button>
              <button onClick={createChannel} disabled={loading} className="buffer-button-primary text-sm py-2 flex items-center gap-1.5">
                {loading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingChannel && (
        <ConfirmModal
          isOpen={true}
          title="Edit Channel"
          message={
            <input
              className="buffer-input text-sm mt-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              placeholder="Channel name"
              autoFocus
            />
          }
          confirmText="Save"
          onConfirm={saveEdit}
          onCancel={() => setEditingChannel(null)}
          loading={loading}
        />
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Channel"
        message={`Delete "${channelToDelete?.name}"? All associated prompts will be removed. This can't be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
        danger
      />
    </AdminLayout>
  );
}
