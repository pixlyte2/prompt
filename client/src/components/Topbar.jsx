import { useState, useEffect } from "react";
import { Clock, Database, ChevronDown, LogOut, Trash2, Sun, Moon } from "lucide-react";
import { clearCache, clearRecentPrompts } from "../utils/cache";
import { toast } from "react-hot-toast";
import HistoryModal from "./HistoryModal";
import { getUser, getRole, logout } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title = "Dashboard", icon: Icon, onCacheClear }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Theme load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const historyCount = (() => {
    try {
      const stored = localStorage.getItem("AI_CHAT_HISTORY");
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  })();

  const roleDisplayName =
    role === "content_manager"
      ? "CONTENT MANAGER"
      : role?.toUpperCase() || "ADMIN";

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleClearCache = () => {
    clearCache();
    clearRecentPrompts();
    localStorage.removeItem("AI_CHAT_HISTORY");
    if (onCacheClear) onCacheClear();
    setShowClearConfirm(false);
    toast.success("All data cleared successfully");
  };

  return (
    <>
      {/* TOPBAR */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">

        <div className="px-6 h-20 flex py-2 items-center justify-between">

          {/* LEFT - ICON + TITLE + GREETING */}
          <div className="flex items-center gap-3">

            {/* ICON */}
            {Icon && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center shadow-sm">
                <Icon size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
            )}

            {/* TEXT */}
            <div className="flex flex-col">
              <p className="text-base py-1 font-semibold text-gray-900 dark:text-white">
                {title}
              </p>

              <p className="text-sm  text-gray-700 py-0 dark:text-gray-300">
                {getGreeting()}, {user?.name || user?.email?.split("@")[0] || "User"}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getFormattedDate()}
              </p>
            </div>

          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-6 text-sm text-gray-700 dark:text-gray-300">

            {/* Theme Toggle */}
            <button onClick={toggleTheme}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* History */}
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 hover:text-blue-600"
            >
              <Clock size={16} />
              History
              {historyCount > 0 && (
                <span className="text-xs px-1.5 bg-blue-600 text-white rounded-full">
                  {historyCount > 99 ? "99+" : historyCount}
                </span>
              )}
            </button>

            {/* Clear */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 hover:text-red-600"
            >
              <Database size={16} />
              Clear
            </button>

            {/* USER */}
            <div className="relative">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {(user?.name || user?.email || "U")[0].toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                    {roleDisplayName}
                  </p>
                </div>

                <ChevronDown size={14} />
              </div>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Overlay */}
      {showUserMenu && (
        <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
      )}

      {/* History Modal */}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}

      {/* Clear Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clear All Data
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleClearCache}
                className="flex-1 py-2 bg-red-600 text-white rounded flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}