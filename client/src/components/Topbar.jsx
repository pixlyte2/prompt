import { RefreshCw } from "lucide-react";
import { clearCache, clearRecentPrompts } from "../utils/cache";
import { toast } from "react-hot-toast";

export default function Topbar({ title, titleInfo, icon: Icon, onCacheClear, onHistoryClick, historyCount }) {
  const handleClearCache = () => {
    clearCache();
    clearRecentPrompts();
    if (onCacheClear) onCacheClear();
    toast.success("Cache cleared successfully");
  };

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 md:px-6 py-4 md:py-5 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        {Icon && (
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {titleInfo && <p className="text-xs md:text-sm text-gray-600 mt-1">{titleInfo}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {onHistoryClick && (
          <button
            onClick={onHistoryClick}
            className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium group"
            title="View history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-[-360deg] transition-transform duration-500"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            <span className="hidden sm:inline">History ({historyCount || 0})</span>
          </button>
        )}
        <button
          onClick={handleClearCache}
          className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium group"
          title="Clear all cached data"
        >
          <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          <span className="hidden sm:inline">Clear Cache</span>
        </button>
      </div>
    </div>
  );
}