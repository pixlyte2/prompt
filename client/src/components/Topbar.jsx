import { useState } from "react";
import { Clock, Database, ChevronDown, LogOut, Trash2, Sun, Moon, Menu } from "lucide-react";
import { clearCache, clearRecentPrompts } from "../utils/cache";
import { toast } from "react-hot-toast";
import HistoryModal from "./HistoryModal";
import { getUser, getRole, logout } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../contexts/DarkModeContext";

export default function Topbar({ title = "Dashboard", icon: Icon, onCacheClear, onOpenMobileNav }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDateLong = () =>
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const getFormattedDateShort = () =>
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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

  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <>
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={() => setShowUserMenu(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`sticky top-0 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300 bg-white dark:bg-gray-800 ${
          showUserMenu ? "z-50" : "z-30"
        }`}
      >
        <div className="px-3 sm:px-6 min-h-20 flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
            {onOpenMobileNav && (
              <button
                type="button"
                onClick={onOpenMobileNav}
                className="md:hidden flex-shrink-0 p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            )}

            {Icon && (
              <div className="flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 items-center justify-center shadow-sm flex-shrink-0">
                <Icon size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
            )}

            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </p>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                {getGreeting()}, {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block truncate">
                {getFormattedDateLong()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                {getFormattedDateShort()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-4 flex-shrink-0 flex-wrap sm:flex-nowrap pb-1 sm:pb-0 text-sm text-gray-700 dark:text-gray-300">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Clock size={16} className="flex-shrink-0" />
              <span className="hidden md:inline">History</span>
              {historyCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded-full min-w-[1.25rem] text-center">
                  {historyCount > 99 ? "99+" : historyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400"
            >
              <Database size={16} className="flex-shrink-0" />
              <span className="hidden md:inline">Clear</span>
            </button>

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1 sm:gap-2 cursor-pointer rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {(user?.name || user?.email || "U")[0].toUpperCase()}
                </div>

                <div className="hidden sm:block text-left min-w-0 max-w-[8rem] lg:max-w-[12rem]">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase truncate">
                    {roleDisplayName}
                  </p>
                </div>

                <ChevronDown size={14} className="hidden sm:block flex-shrink-0 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 rounded-lg"
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

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clear All Data
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              This action cannot be undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClearCache}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-red-700"
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
