import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Copy, Pencil, Trash2, Download, Eye } from "lucide-react";
import api from "../services/api";
import { getRole } from "../utils/api";
import ConfirmModal from "../components/ConfirmModal";
import PromptFormModal from "../components/PromptFormModal";
import { exportToCSV } from "../utils/csvExport";
import useLoading from "../hooks/useLoading";
import TableLoader from "../components/TableLoader";
import PageLoader from "../components/PageLoader";
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
  const [sortDirection, setSortDirection] = useState('asc');
  const pageSize = 10;
  const [selectedRows, setSelectedRows] = useState([]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState(null);

  const [loading, setLoading] = useState(false); // for delete modal

  const { startLoading, stopLoading, isLoading } = useLoading();

  // Generate consistent colors for channels
  const getChannelColor = (channelId) => {
    if (!channelId) return "bg-gray-50";
    
    const colors = [
      "bg-blue-50",
      "bg-emerald-50", 
      "bg-purple-50",
      "bg-amber-50",
      "bg-indigo-50",
      "bg-teal-50",
      "bg-orange-50",
      "bg-cyan-50",
      "bg-pink-50",
      "bg-lime-50"
    ];
    
    // Create a simple hash from channelId to get consistent color
    let hash = 0;
    for (let i = 0; i < channelId.length; i++) {
      hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get matching dot color for channel
  const getChannelDotColor = (channelId) => {
    if (!channelId) return "bg-gray-500";
    
    const dotColors = [
      "bg-blue-500",
      "bg-emerald-500", 
      "bg-purple-500",
      "bg-amber-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
      "bg-pink-500",
      "bg-lime-500"
    ];
    
    // Use same hash logic as background colors
    let hash = 0;
    for (let i = 0; i < channelId.length; i++) {
      hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return dotColors[Math.abs(hash) % dotColors.length];
  };

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
        id: p._id,
        channel: p.channelId?.name || null,
        type: p.promptTypeId?.name || null,
        model: p.aiModel || null,
        prompt: p.promptText || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));

    const jsonString = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected-prompts.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Selected prompts exported as JSON");
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

    const filteredIds = filtered.map(p => p._id);

    setTimeout(() => {

      if (selectedRows.length === filteredIds.length && filteredIds.every(id => selectedRows.includes(id))) {
        setSelectedRows([]);
      } else {
        setSelectedRows(filteredIds);
      }

      stopLoading("selectAll");

    }, 300);

  };

  /* ================= SORTING ================= */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  /* ================= SEARCH ================= */
  const filtered = prompts.filter(
    (p) => {
      const matchesSearch = p.promptText?.toLowerCase().includes(search.toLowerCase()) ||
        p.promptTypeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.channelId?.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesChannel = !selectedChannel || p.channelId?._id === selectedChannel;
      const matchesType = !selectedType || p.promptTypeId?._id === selectedType;
      
      return matchesSearch && matchesChannel && matchesType;
    }
  ).sort((a, b) => {
    if (sortField) {
      let aVal, bVal;
      
      switch (sortField) {
        case 'channel':
          aVal = a.channelId?.name || "";
          bVal = b.channelId?.name || "";
          break;
        case 'type':
          aVal = a.promptTypeId?.name || "";
          bVal = b.promptTypeId?.name || "";
          break;
        case 'model':
          aVal = a.aiModel || "";
          bVal = b.aiModel || "";
          break;
        case 'prompt':
          aVal = a.promptText || "";
          bVal = b.promptText || "";
          break;
        default:
          return 0;
      }
      
      const result = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? result : -result;
    }
    
    // Default sort by channel, then type
    const channelA = a.channelId?.name || "";
    const channelB = b.channelId?.name || "";
    const channelCompare = channelA.localeCompare(channelB);
    
    if (channelCompare !== 0) return channelCompare;
    
    const typeA = a.promptTypeId?.name || "";
    const typeB = b.promptTypeId?.name || "";
    return typeA.localeCompare(typeB);
  });

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ================= COPY ================= */
  const copyText = (text, prompt) => {
    navigator.clipboard.writeText(text);
    addRecentPrompt(prompt);
    toast.success("Prompt copied");
  };

  /* ================= PREVIEW ================= */
  const openPreview = (prompt) => {
    addRecentPrompt(prompt);
    setPreviewPrompt(prompt);
    setPreviewModal(true);
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
    <div className="bg-gray-50 p-4">
      <PageSectionLoader show={isLoading("page")} />

      {/* HEADER SECTION */}
      <div className="mb-4">
        {/* CONTROL PANEL */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {/* Channel Filters */}
          <div className="mb-4">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  setSelectedChannel(null);
                  setSelectedType(null);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !selectedChannel
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Channels ({prompts.length})
              </button>
              {channels.map((channel) => {
                const count = prompts.filter(p => p.channelId?._id === channel._id).length;
                return (
                  <button
                    key={channel._id}
                    onClick={() => {
                      setSelectedChannel(channel._id);
                      setSelectedType(null);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedChannel === channel._id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {channel.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type Filters - Only show when channel is selected */}
          {selectedChannel && (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-medium text-gray-600">Filter by Type:</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedType(null);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !selectedType
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Types ({prompts.filter(p => p.channelId?._id === selectedChannel).length})
                </button>
                {[...new Set(prompts
                  .filter(p => p.channelId?._id === selectedChannel)
                  .map(p => p.promptTypeId)
                  .filter(Boolean)
                  .map(type => type._id)
                )].map(typeId => {
                  const type = prompts.find(p => p.promptTypeId?._id === typeId)?.promptTypeId;
                  const count = prompts.filter(p => p.channelId?._id === selectedChannel && p.promptTypeId?._id === typeId).length;
                  return (
                    <button
                      key={typeId}
                      onClick={() => {
                        setSelectedType(typeId);
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedType === typeId
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type?.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  placeholder="Search prompts..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 pl-10"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Stats */}
            <div className="text-sm text-gray-600 hidden md:block">
              <div className="font-medium">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</div>
              {selectedRows.length > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {selectedRows.length} selected
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
              {/* Bulk Actions */}
              {prompts.length > 0 && (
                <button
                  onClick={handleGlobalSelectAll}
                  disabled={isLoading("selectAll")}
                  className={`px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-medium border transition-all duration-200 ${
                    isLoading("selectAll") 
                      ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200" 
                      : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {isLoading("selectAll")
                    ? "Processing..."
                    : selectedRows.length === filtered.length && filtered.every(p => selectedRows.includes(p._id))
                    ? `Deselect All`
                    : `Select All`}
                </button>
              )}

              {/* Primary Actions */}
              <button
                onClick={handleExport}
                disabled={!selectedRows.length}
                className={`px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-xs md:text-sm ${
                  selectedRows.length
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Download size={16} />
                Export JSON ({selectedRows.length})
              </button>

              {(role === "admin" || role === "content_manager") && (
                <button
                  onClick={openCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-xs md:text-sm shadow-sm"
                >
                  <span className="text-lg leading-none">+</span>
                  New Prompt
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Results Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Results ({filtered.length} {filtered.length === 1 ? 'prompt' : 'prompts'})
            </h3>
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {selectedRows.length} selected
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto relative">
          <TableLoader show={isLoading("table")} />

          <table className="w-full text-sm table-auto min-w-[800px]">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr className="text-gray-700">
                <th className="px-6 py-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedRows.length === filtered.length && filtered.every(p => selectedRows.includes(p._id))}
                    onChange={handleGlobalSelectAll}
                    className="h-4 w-4 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th 
                  className="px-6 py-4 text-left w-32 cursor-pointer hover:bg-gray-100 select-none transition-colors duration-200"
                  onClick={() => handleSort('channel')}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    Channel
                    {sortField === 'channel' && (
                      <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left w-28 cursor-pointer hover:bg-gray-100 select-none transition-colors duration-200"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    Type
                    {sortField === 'type' && (
                      <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left w-48 cursor-pointer hover:bg-gray-100 select-none transition-colors duration-200"
                  onClick={() => handleSort('model')}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    Model
                    {sortField === 'model' && (
                      <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100 select-none transition-colors duration-200"
                  onClick={() => handleSort('prompt')}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    Prompt Content
                    {sortField === 'prompt' && (
                      <span className="text-blue-600 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-center w-32 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginated.map((p, index) => {
                const channelColor = getChannelColor(p.channelId?._id);
                return (
                  <tr
                    key={p._id}
                    className={`transition-colors duration-200 ${
                      selectedRows.includes(p._id)
                        ? "bg-blue-100 border-l-4 border-blue-500"
                        : `${channelColor} hover:brightness-95`
                    }`}
                  >
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(p._id)}
                      onChange={() => toggleRow(p._id)}
                      className="h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${getChannelDotColor(p.channelId?._id)} rounded-full mr-3`}></div>
                      <span className="font-medium text-gray-900 truncate max-w-32">
                        {p.channelId?.name || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <span className="inline-flex px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full truncate max-w-28">
                      {p.promptTypeId?.name || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    <span className="text-gray-600 font-mono text-xs">
                      {p.aiModel || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    <div className="max-w-2xl">
                      <p className="text-gray-900 truncate leading-relaxed">
                        {p.promptText}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => openPreview(p)} 
                        className="p-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Preview prompt"
                      >
                        <Eye size={14} />
                      </button>

                      <button 
                        onClick={() => copyText(p.promptText, p)} 
                        className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                        title="Copy prompt"
                      >
                        <Copy size={14} />
                      </button>

                      {(role === "admin" || role === "content_manager") && (
                        <button 
                          onClick={() => openEdit(p)} 
                          className="p-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Edit prompt"
                        >
                          <Pencil size={14} />
                        </button>
                      )}

                      {role === "admin" && (
                        <button 
                          onClick={() => openDeleteModal(p)} 
                          className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Delete prompt"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filtered.length > 0 && (
          <div className="bg-white px-4 md:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm font-medium text-gray-700">
                Showing <span className="text-blue-600 font-semibold">{((page - 1) * pageSize) + 1}</span> to <span className="text-blue-600 font-semibold">{Math.min(page * pageSize, filtered.length)}</span> of <span className="text-blue-600 font-semibold">{filtered.length}</span> results
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 font-semibold text-gray-700 hover:text-blue-600 shadow-sm"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`min-w-[2.5rem] px-3 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                            page === pageNum
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105"
                              : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 font-semibold text-gray-700 hover:text-blue-600 shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
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
        message={`Are you sure you want to delete this prompt? This action cannot be undone.`}
        confirmText="Delete Prompt"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={loading}
        danger={true}
      />

      {previewModal && previewPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prompt Preview</h3>
              <button onClick={() => setPreviewModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3 border-b">
              <div className="flex gap-4">
                <div>
                  <span className="text-xs text-gray-500">Channel:</span>
                  <div className="font-medium">{previewPrompt.channelId?.name || "-"}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Type:</span>
                  <div className="font-medium">{previewPrompt.promptTypeId?.name || "-"}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Model:</span>
                  <div className="font-medium font-mono text-sm">{previewPrompt.aiModel || "-"}</div>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">{previewPrompt.promptText}</pre>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  copyText(previewPrompt.promptText, previewPrompt);
                  setPreviewModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Copy size={16} />
                Copy
              </button>
              <button
                onClick={() => setPreviewModal(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}