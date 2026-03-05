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
    <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <button
        onClick={handleClearCache}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
        title="Clear all cached data"
      >
        <RefreshCw size={16} />
        Clear Cache
      </button>
    </div>
  );
}
