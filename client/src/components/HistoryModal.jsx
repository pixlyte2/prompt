import { useState, useEffect } from "react";
import { Copy, Trash2, X, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { renderMarkdown } from "../utils/markdown";

export default function HistoryModal({ onClose, initialItemId }) {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("result");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Detect dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("AI_CHAT_HISTORY");
    if (stored) {
      const h = JSON.parse(stored);
      setHistory(h);
      if (initialItemId) {
        setSelected(h.find(i => i.id === initialItemId) || h[0] || null);
      } else {
        setSelected(h[0] || null);
      }
    }
  }, [initialItemId]);

  const deleteItem = (id) => {
    const updated = history.filter(i => i.id !== id);
    setHistory(updated);
    localStorage.setItem("AI_CHAT_HISTORY", JSON.stringify(updated));
    if (selected?.id === id) setSelected(updated[0] || null);
    toast.success("Deleted");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-7xl h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <History size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Result History</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <History size={24} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No history yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your AI generation results will appear here</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      selected?.id === item.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-sm"
                        : "hover:bg-white dark:hover:bg-gray-700/50 border-2 border-transparent hover:shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className={`text-sm font-semibold line-clamp-2 flex-1 pr-2 ${
                        selected?.id === item.id ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"
                      }`}>
                        {item.title}
                      </h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                        className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {item.aiModel}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {item.prompt.substring(0, 120)}{item.prompt.length > 120 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
            {selected ? (
              <>
                {/* Info Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Channel:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selected.channel || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selected.promptType || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Model:</span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {selected.aiModel || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{new Date(selected.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex gap-8">
                    {["result", "prompt"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`py-4 text-sm font-medium border-b-2 capitalize transition-colors duration-200 ${
                          tab === t
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                {tab === "result" ? (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div
                      className="prose prose-sm max-w-none text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.result, isDarkMode) }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">{selected.prompt}</pre>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const text = tab === "result" ? selected.result : selected.prompt;
                        navigator.clipboard.writeText(text);
                        toast.success(`${tab === "result" ? "Result" : "Prompt"} copied`);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      <Copy size={16} />
                      Copy {tab === "result" ? "Result" : "Prompt"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <History size={24} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a result to view</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose an item from the history to see details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
