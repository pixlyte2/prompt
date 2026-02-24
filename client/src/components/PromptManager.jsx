import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Copy, Pencil, Trash2, Download } from "lucide-react";
import api, { getRole } from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";
import PromptFormModal from "../components/PromptFormModal";
import { exportToCSV } from "../utils/csvExport";
import useLoading from "../hooks/useLoading";
import TableLoader from "../components/TableLoader";
import PageLoader from "../components/PageLoader";
import PageSectionLoader from "../components/PageSectionLoader";

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

  const [loading, setLoading] = useState(false); // for delete modal

  const { startLoading, stopLoading, isLoading } = useLoading();

  /* ================= LOAD ================= */
const loadPrompts = async () => {

  try {

    startLoading("page");

    const res = await api.get("/prompts");
    setPrompts(res.data);

  } catch {
    toast.error("Failed to load prompts");
  } finally {

    stopLoading("page");

  }

};
  const loadChannels = async () => {
    const res = await api.get("/channels");
    setChannels(res.data);
  };

  useEffect(() => {
    loadPrompts();
    loadChannels();
  }, []);

  /* ================= EXPORT ================= */
  const handleExport = () => {

    if (!selectedRows.length) {
      return toast.error("Please select at least one row");
    }

    const selectedData = prompts
      .filter(p => selectedRows.includes(p._id))
      .map(p => ({
        Channel: p.channelId?.name || "-",
        Type: p.promptTypeId?.name || "-",
        Model: p.aiModel || "-",
        Prompt: p.promptText || "-"
      }));

    exportToCSV(selectedData, "selected-prompts.csv");
    toast.success("Selected prompts exported");
  };

  /* ================= ROW SELECT ================= */
  const toggleRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  /* ================= GLOBAL SELECT ALL ================= */
  const handleGlobalSelectAll = () => {

    startLoading("selectAll");

    const allIds = prompts.map(p => p._id);

    setTimeout(() => {

      if (selectedRows.length === allIds.length) {
        setSelectedRows([]);
      } else {
        setSelectedRows(allIds);
      }

      stopLoading("selectAll");

    }, 300);

  };

  /* ================= SEARCH ================= */
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

  /* ================= COPY ================= */
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied");
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

      setPrompts(prev =>
        prev.filter(p => p._id !== promptToDelete._id)
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

  return (
    <div className="space-y-6 relative">
<PageSectionLoader show={isLoading("page")} />
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prompt Manager</h2>

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
        <div className="overflow-x-auto relative">

          <TableLoader show={isLoading("table")} />

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-gray-600">
                <th className="px-4 py-3 text-center w-16"></th>
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
                  className={`border-b ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(p._id)}
                      onChange={() => toggleRow(p._id)}
                      className="h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {p.channelId?.name || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {p.promptTypeId?.name || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {p.aiModel || "-"}
                  </td>

                  <td className="px-4 py-3 max-w-sm truncate">
                    {p.promptText}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-4">

                      <button onClick={() => copyText(p.promptText)}>
                        <Copy size={16} />
                      </button>

                      {(role === "admin" || role === "content_manager") && (
                        <button onClick={() => openEdit(p)}>
                          <Pencil size={16} />
                        </button>
                      )}

                      {role === "admin" && (
                        <button onClick={() => openDeleteModal(p)}>
                          <Trash2 size={16} />
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>

      {/* SELECT ALL */}
      {prompts.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleGlobalSelectAll}
            disabled={isLoading("selectAll")}
            className={`border px-5 py-2 rounded-lg text-sm bg-white shadow-sm 
            ${isLoading("selectAll") ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
          >
            {isLoading("selectAll")
              ? "Selecting..."
              : selectedRows.length === prompts.length
              ? "Unselect All"
              : "Select All"}
          </button>
        </div>
      )}

      <PromptFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={loadPrompts}
        editingPrompt={selectedPrompt}
        channels={channels}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Prompt"
        message="Are you sure?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={loading}
      />

    </div>
  );
}