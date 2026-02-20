import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Copy, Pencil, Trash2, Download } from "lucide-react";
import api, { getRole } from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";
import PromptFormModal from "../components/PromptFormModal";
import { exportToCSV } from "../utils/csvExport";

export default function PromptManager() {
  const role = getRole();

  const [prompts, setPrompts] = useState([]);
  const [channels, setChannels] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [selectedRows, setSelectedRows] = useState([]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);

  const [loading, setLoading] = useState(false);

  /* ================= LOAD ================= */
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

  /* ================= EXPORT SELECTED ================= */
  const handleExport = () => {
    if (!selectedRows.length) {
      return toast.error("Please select at least one row");
    }

    const selectedData = prompts
      .filter((p) => selectedRows.includes(p._id))
      .map((p) => ({
        Channel: p.channelId?.name || "-",
        Type: p.promptTypeId?.name || "-",
        Model: p.aiModel || "-",
        Prompt: p.promptText || "-"
      }));

    exportToCSV(selectedData, "selected-prompts.csv");
    toast.success("Selected prompts exported");
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id]
    );
  };

  /* ================= CREATE / EDIT ================= */
  const openCreate = () => {
    setSelectedPrompt(null);
    setShowFormModal(true);
  };

  const openEdit = (prompt) => {
    setSelectedPrompt(prompt);
    setShowFormModal(true);
  };

  /* ================= DELETE ================= */
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
    } catch {
      toast.error("Failed to delete prompt");
    } finally {
      setLoading(false);
    }
  };

  /* ================= COPY ================= */
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied");
  };

  /* ================= SEARCH + PAGINATION ================= */
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

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} />
            Export Selected
          </button>

          {(role === "admin" || role === "content_manager") && (
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Prompt
            </button>
          )}
        </div>
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
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr className="text-gray-600">
                <th className="px-4 py-3 text-center w-16">Select</th>
                <th className="px-4 py-3 text-left">Channel</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Prompt</th>
                <th className="px-4 py-3 text-center w-32">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((p, index) => (
                <tr
                  key={p._id}
                  className={`border-b last:border-none transition ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(p._id)}
                      onChange={() => toggleRow(p._id)}
                      className="h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.channelId?.name || "-"}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {p.promptTypeId?.name || "-"}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {p.aiModel || "-"}
                  </td>

                  <td className="px-4 py-3 max-w-sm truncate text-gray-700">
                    {p.promptText}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center items-center gap-4">
                      <button
                        onClick={() => copyText(p.promptText)}
                        className="text-gray-500 hover:text-black transition"
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>

                      {(role === "admin" || role === "content_manager") && (
                        <button
                          onClick={() => openEdit(p)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                      )}

                      {role === "admin" && (
                        <button
                          onClick={() => openDeleteModal(p)}
                          className="text-red-500 hover:text-red-700 transition"
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
            <div className="p-8 text-center text-gray-500">
              No prompts found
            </div>
          )}
        </div>
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

      {/* DELETE MODAL */}
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