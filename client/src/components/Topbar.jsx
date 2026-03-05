import { RefreshCw } from "lucide-react";
import { clearCache, clearRecentPrompts } from "../utils/cache";
import { toast } from "react-hot-toast";

export default function Topbar({ title, onCacheClear }) {
  const handleClearCache = () => {
    clearCache();
    clearRecentPrompts();
    if (onCacheClear) onCacheClear();
    toast.success("Cache cleared successfully");
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shadow-sm">
      <div>
        <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{title}</h1>
        <div className="h-1 w-12 md:w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-1"></div>
      </div>
      <button
        onClick={handleClearCache}
        className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium group"
        title="Clear all cached data"
      >
        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
        <span className="hidden sm:inline">Clear Cache</span>
      </button>
    </div>
  );
}
