import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Copy, Pencil, Trash2, Download, Eye, Plus, Search, X } from "lucide-react";
import api from "../services/api";
import { getRole } from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";
import PromptFormModal from "../components/PromptFormModal";
import useLoading from "../hooks/useLoading";
import PageSectionLoader from "../components/PageSectionLoader";
import { addRecentPrompt } from "../utils/cache";

export default function PromptManager() {
  const role = getRole();
  const [prompts, setPrompts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const pageSize = 10;
  const [selectedRows, setSelectedRows] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState(null);
  const [loading, setLoading] = useState(false);
  const { startLoading, stopLoading, isLoading } = useLoading();

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

  useEffect(() => { loadPrompts(); loadChannels(); }, []);

  const handleExport = () => {
    if (!selectedRows.length) return toast.error("Select at least one row");
    const data = prompts
      .filter(p => selectedRows.includes(p._id))
      .map(p => ({ id: p._id, channel: p.channelId?.name, type: p.promptTypeId?.name, model: p.aiModel, prompt: p.promptText, createdAt: p.createdAt, updatedAt: p.updatedAt }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prompts.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  const toggleRow = (id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
    setPage(1);
  };

  const filtered = prompts.filter(p => {
    const matchSearch = p.promptText?.toLowerCase().includes(search.toLowerCase()) ||
      p.promptTypeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.channelId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!selectedChannel || p.channelId?._id === selectedChannel) && (!selectedType || p.promptTypeId?._id === selectedType);
  }).sort((a, b) => {
    if (!sortField) {
      const c = (a.channelId?.name || "").localeCompare(b.channelId?.name || "");
      return c !== 0 ? c : (a.promptTypeId?.name || "").localeCompare(b.promptTypeId?.name || "");
    }
    const map = { channel: "channelId.name", type: "promptTypeId.name", model: "aiModel", prompt: "promptText" };
    const aV = sortField === "channel" ? a.channelId?.name : sortField === "type" ? a.promptTypeId?.name : a[sortField === "model" ? "aiModel" : "promptText"] || "";
    const bV = sortField === "channel" ? b.channelId?.name : sortField === "type" ? b.promptTypeId?.name : b[sortField === "model" ? "aiModel" : "promptText"] || "";
    const r = (aV || "").localeCompare(bV || "");
    return sortDirection === "asc" ? r : -r;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const copyText = (text, prompt) => { navigator.clipboard.writeText(text); addRecentPrompt(prompt); toast.success("Copied"); };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/prompts/${promptToDelete._id}`);
      setPrompts(prev => prev.filter(p => p._id !== promptToDelete._id));
      toast.success("Deleted");
      setDeleteModalOpen(false);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  // Channel filter pills
  const channelsWithCounts = channels
    .filter(c => prompts.some(p => p.channelId?._id === c._id))
    .map(c => ({ ...c, count: prompts.filter(p => p.channelId?._id === c._id).length }))
    .sort((a, b) => b.count - a.count);

  // Type filter pills (when channel selected)
  const typesForChannel = selectedChannel
    ? [...new Set(prompts.filter(p => p.channelId?._id === selectedChannel).map(p => p.promptTypeId?._id).filter(Boolean))]
        .map(tid => {
          const t = prompts.find(p => p.promptTypeId?._id === tid)?.promptTypeId;
          return { ...t, count: prompts.filter(p => p.channelId?._id === selectedChannel && p.promptTypeId?._id === tid).length };
        })
        .sort((a, b) => b.count - a.count)
    : [];

  const allSelected = filtered.length > 0 && selectedRows.length === filtered.length;

  return (
    <div className="flex flex-col h-full">
      <PageSectionLoader show={isLoading("page")} />

      {/* Toolbar */}
      <div className="space-y-3 mb-4">
        {/* Search + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="buffer-input pl-9 py-2 text-sm"
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} results</span>
          {selectedRows.length > 0 && (
            <>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{selectedRows.length} selected</span>
              <button onClick={handleExport} className="buffer-button-secondary text-xs py-1.5 flex items-center gap-1">
                <Download size={14} /> Export
              </button>
            </>
          )}
          {(role === "admin" || role === "content_manager") && (
            <button onClick={() => { setSelectedPrompt(null); setShowFormModal(true); }} className="buffer-button-primary text-sm py-2 flex items-center gap-1.5 ml-auto">
              <Plus size={16} /> New Prompt
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">Channel:</span>
            <button
              onClick={() => { setSelectedChannel(null); setSelectedType(null); setPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ${!selectedChannel ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
            >
              All ({prompts.length})
            </button>
            {channelsWithCounts.map(c => (
              <button
                key={c._id}
                onClick={() => { setSelectedChannel(c._id); setSelectedType(null); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ${selectedChannel === c._id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
          {selectedChannel && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-l border-gray-200 dark:border-gray-700 pl-4">
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">Type:</span>
              <button
                onClick={() => { setSelectedType(null); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ${!selectedType ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
              >
                All
              </button>
              {typesForChannel.map(t => (
                <button
                  key={t._id}
                  onClick={() => { setSelectedType(t._id); setPage(1); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ${selectedType === t._id ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                >
                  {t.name} ({t.count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="buffer-card flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
              <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-3 py-3 w-10 text-center">
                  <input type="checkbox" checked={allSelected} onChange={() => setSelectedRows(allSelected ? [] : filtered.map(p => p._id))} className="h-3.5 w-3.5 accent-blue-600 cursor-pointer" />
                </th>
                <th className="px-3 py-3 text-left font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 w-28" onClick={() => handleSort("channel")}>
                  <span className="inline-flex items-center gap-1">
                    Channel
                    {sortField === "channel" && <span className="text-blue-600 dark:text-blue-400">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
                <th className="px-3 py-3 text-left font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 w-32" onClick={() => handleSort("type")}>
                  <span className="inline-flex items-center gap-1">
                    Type
                    {sortField === "type" && <span className="text-blue-600 dark:text-blue-400">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
                <th className="px-3 py-3 text-left font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 w-28" onClick={() => handleSort("model")}>
                  <span className="inline-flex items-center gap-1">
                    Sub Type
                    {sortField === "model" && <span className="text-blue-600 dark:text-blue-400">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
                <th className="px-3 py-3 text-left font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleSort("prompt")}>
                  <span className="inline-flex items-center gap-1">
                    Prompt
                    {sortField === "prompt" && <span className="text-blue-600 dark:text-blue-400">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
                <th className="px-3 py-3 text-right font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p._id} className={`border-b border-gray-50 dark:border-gray-700 group ${selectedRows.includes(p._id) ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <td className="px-3 py-2.5 w-10 text-center">
                    <input type="checkbox" checked={selectedRows.includes(p._id)} onChange={() => toggleRow(p._id)} className="h-3.5 w-3.5 accent-blue-600 cursor-pointer" />
                  </td>
                  <td className="px-3 py-2.5 w-28">
                    <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded truncate block max-w-24">{p.channelId?.name || "-"}</span>
                  </td>
                  <td className="px-3 py-2.5 w-32">
                    <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded truncate block max-w-28">{p.promptTypeId?.name || "-"}</span>
                  </td>
                  <td className="px-3 py-2.5 w-28 text-xs text-gray-500 dark:text-gray-400 font-mono">{p.aiModel || "-"}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-xs">{p.promptText?.substring(0, 60)}{p.promptText?.length > 60 ? "..." : ""}</p>
                  </td>
                  <td className="px-3 py-2.5 w-28 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => { addRecentPrompt(p); setPreviewPrompt(p); setPreviewModal(true); }} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20" title="Preview">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => copyText(p.promptText, p)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Copy">
                        <Copy size={14} />
                      </button>
                      {(role === "admin" || role === "content_manager") && (
                        <button onClick={() => { setSelectedPrompt(p); setShowFormModal(true); }} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Edit">
                          <Pencil size={14} />
                        </button>
                      )}
                      {role === "admin" && (
                        <button onClick={() => { setPromptToDelete(p); setDeleteModalOpen(true); }} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <Search size={32} className="mb-2" />
              <p className="text-sm font-medium">No prompts found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`min-w-[1.75rem] py-1 rounded-md font-medium ${page === n ? "bg-blue-600 text-white" : "border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
        message="Are you sure? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={loading}
        danger
      />

      {/* Preview Modal */}
      {previewModal && previewPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Prompt Preview</h3>
              <button onClick={() => setPreviewModal(false)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">Channel:</span>
                <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{previewPrompt.channelId?.name || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">Type:</span>
                <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">{previewPrompt.promptTypeId?.name || "-"}</span>
              </div>
              {previewPrompt.aiModel && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Sub Type:</span>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{previewPrompt.aiModel}</span>
                </div>
              )}
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed">{previewPrompt.promptText}</pre>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => { copyText(previewPrompt.promptText, previewPrompt); setPreviewModal(false); }}
                className="buffer-button-primary text-sm py-2 flex items-center gap-1.5"
              >
                <Copy size={14} /> Copy
              </button>
              <button onClick={() => setPreviewModal(false)} className="buffer-button-secondary text-sm py-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
