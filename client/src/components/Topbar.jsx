import { useState } from "react";
import { RefreshCw, History, Trash2, Clock, Database, ChevronDown, Settings, HelpCircle, LogOut } from "lucide-react";
import { clearCache, clearRecentPrompts } from "../utils/cache";
import { toast } from "react-hot-toast";
import HistoryModal from "./HistoryModal";
import { getUser, getRole, logout } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title, titleInfo, icon: Icon, onCacheClear, actions = [] }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  
  const user = getUser();
  const role = getRole();

  const getHistoryCount = () => {
    try {
      const stored = localStorage.getItem("AI_CHAT_HISTORY");
      return stored ? JSON.parse(stored).length : 0;
    } catch { return 0; }
  };

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

  const historyCount = getHistoryCount();
  const roleDisplayName = role === 'content_manager' ? 'Content Manager' : role?.charAt(0).toUpperCase() + role?.slice(1) || 'User';

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Main Title Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Page Info */}
            <div className="flex items-center gap-4">
              {Icon && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50">
                  <Icon size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
                  {titleInfo && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {titleInfo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">CreatorAI</span>
                  <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{roleDisplayName}</span>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-3">
              {/* Custom Actions */}
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    action.variant === 'primary' 
                      ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm' 
                      : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm'
                  }`}
                  title={action.tooltip}
                >
                  {action.icon && <action.icon size={16} />}
                  <span>{action.label}</span>
                </button>
              ))}

              {/* History Button */}
              <button
                onClick={() => setShowHistory(true)}
                className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 shadow-sm"
                title="View AI Chat history"
              >
                <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                <span>History</span>
                {historyCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-blue-600 rounded-full">
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                )}
              </button>

              {/* Clear Cache Button */}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-700 hover:text-red-700 dark:hover:text-red-400 transition-all duration-200 shadow-sm"
                title="Clear all cached data"
              >
                <Database size={16} className="text-gray-500 dark:text-gray-400" />
                <span>Clear Cache</span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 shadow-sm"
                >
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
                  <ChevronDown size={14} className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                    showUserMenu ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user?.name || user?.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{roleDisplayName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                      >
                        <LogOut size={16} className="text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* History Modal */}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}

      {/* Clear Cache Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/50 flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clear All Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">This will clear:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    All cached API responses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    Recent prompts history
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    AI chat conversation history ({historyCount} items)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    Temporary application data
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCache}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
