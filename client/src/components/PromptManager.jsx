import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Copy, Pencil, Trash2 } from "lucide-react";
import api, { getRole } from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";
import PromptFormModal from "../components/PromptFormModal";

export default function PromptManager() {
  const role = getRole();

  const [prompts, setPrompts] = useState([]);
  const [channels, setChannels] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);

  const [loading, setLoading] = useState(false);

  /* LOAD */
  const loadPrompts = async () => {
    const res = await api.get("/prompts");
    setPrompts(res.data);
  };

  const loadChannels = async () => {
    const res = await api.get("/channels");
    setChannels(res.data);
  };

  useEffect(() => {
    loadPrompts();
    loadChannels();
  }, []);

  /* CREATE / EDIT */
  const openCreate = () => {
    setSelectedPrompt(null);
    setShowFormModal(true);
  };

  const openEdit = (prompt) => {
    setSelectedPrompt(prompt);
    setShowFormModal(true);
  };

  /* DELETE */
  const openDeleteModal = (prompt) => {
    setPromptToDelete(prompt);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);

      await api.delete(`/prompts/${promptToDelete._id}`);

      setPrompts((prev) =>
        prev.filter((p) => p._id !== promptToDelete._id)
      );

      toast.success("Prompt deleted successfully");

      setDeleteModalOpen(false);
      setPromptToDelete(null);
    } catch (error) {
      toast.error("Failed to delete prompt");
    } finally {
      setLoading(false);
    }
  };

  /* COPY */
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied");
  };

  /* SEARCH + PAGINATION */
  const filtered = prompts.filter(
    (p) =>
      p.promptText?.toLowerCase().includes(search.toLowerCase()) ||
      p.promptTypeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.channelId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Prompt Manager
        </h2>

        {(role === "admin" || role === "content_manager") && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Prompt
          </button>
        )}
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by channel / type / text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full border px-3 py-2 rounded-lg"
      />

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Channel</th>
              <th className="p-3">Type</th>
              <th className="p-3">Model</th>
              <th className="p-3">Prompt</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((p) => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.channelId?.name || "-"}</td>
                <td className="p-3 font-medium">{p.promptTypeId?.name || "-"}</td>
                <td className="p-3">{p.aiModel || "-"}</td>
                <td className="p-3 max-w-md truncate">{p.promptText}</td>

                <td className="p-3 text-center">
                  <div className="flex justify-center items-center gap-4 opacity-70 hover:opacity-100 transition">
                    
                    {/* COPY */}
                    <button
                      onClick={() => copyText(p.promptText)}
                      className="hover:text-gray-800"
                      title="Copy"
                    >
                      <Copy size={16} />
                    </button>

                    {/* EDIT */}
                    {(role === "admin" || role === "content_manager") && (
                      <button
                        onClick={() => openEdit(p)}
                        className="hover:text-blue-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                    )}

                    {/* DELETE */}
                    {role === "admin" && (
                      <button
                        onClick={() => openDeleteModal(p)}
                        className="hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="p-4 text-gray-500">
            No prompts found
          </p>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${
                page === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      <PromptFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={loadPrompts}
        editingPrompt={selectedPrompt}
        channels={channels}
      />

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Prompt"
        message="Are you sure you want to delete this prompt? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={loading}
      />
    </div>
  );
}
