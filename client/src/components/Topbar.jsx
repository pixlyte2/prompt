import { useState } from "react";
import { RefreshCw, History } from "lucide-react";
import { clearCache, clearRecentPrompts } from "../utils/cache";
import { toast } from "react-hot-toast";
import HistoryModal from "./HistoryModal";

export default function Topbar({ title, titleInfo, icon: Icon, onCacheClear }) {
  const [showHistory, setShowHistory] = useState(false);

  const getHistoryCount = () => {
    try {
      const stored = localStorage.getItem("AI_CHAT_HISTORY");
      return stored ? JSON.parse(stored).length : 0;
    } catch { return 0; }
  };

  const handleClearCache = () => {
    clearCache();
    clearRecentPrompts();
    localStorage.removeItem("AI_CHAT_HISTORY");
    if (onCacheClear) onCacheClear();
    toast.success("Cache cleared");
  };

  const historyCount = getHistoryCount();

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} className="text-gray-400" />}
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
            {titleInfo && <span className="text-xs text-gray-400">{titleInfo}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title="View AI Chat history"
          >
            <History size={14} />
            <span className="hidden sm:inline">History{historyCount > 0 ? ` (${historyCount})` : ""}</span>
          </button>
          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title="Clear cache"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Clear Cache</span>
          </button>
        </div>
      </div>

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </>
  );
}
