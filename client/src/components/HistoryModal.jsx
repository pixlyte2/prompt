import { useState, useEffect } from "react";
import { Copy, Trash2, X, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { renderMarkdown } from "../utils/markdown";

export default function HistoryModal({ onClose, initialItemId }) {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("result");

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[88rem] h-[93vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History size={16} className="text-gray-500 dark:text-gray-400" />
            Result History
          </h3>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-60 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-6 text-center">
                <History size={20} className="text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No history yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Results will appear here</p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`group p-2.5 rounded cursor-pointer ${
                      selected?.id === item.id
                        ? "bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`text-xs font-medium line-clamp-1 flex-1 pr-1 ${
                        selected?.id === item.id ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"
                      }`}>
                        {item.title}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                        className="flex-shrink-0 p-0.5 rounded text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 space-y-0.5">
                      <div>{item.aiModel}</div>
                      {item.subType && <div className="font-medium text-gray-500 dark:text-gray-400">Sub Type: {item.subType}</div>}
                      <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.prompt.substring(0, 80)}{item.prompt.length > 80 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Channel:</span>
                      <div className="text-gray-800 dark:text-gray-200">{selected.channel || '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Type:</span>
                      <div className="text-gray-800 dark:text-gray-200">{selected.promptType || '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Model:</span>
                      <div className="text-gray-800 dark:text-gray-200 font-mono">{selected.aiModel || '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sub Type:</span>
                      <div className="text-gray-800 dark:text-gray-200">{selected.subType || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 px-4 flex gap-4">
                  {["result", "prompt"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`py-2.5 text-sm font-medium border-b-2 capitalize ${
                        tab === t
                          ? "border-blue-600 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {tab === "result" ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    <div
                      className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300 dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.result) }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed">{selected.prompt}</pre>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={() => {
                      const text = tab === "result" ? selected.result : selected.prompt;
                      navigator.clipboard.writeText(text);
                      toast.success(`${tab === "result" ? "Result" : "Prompt"} copied`);
                    }}
                    className="buffer-button-primary text-sm flex items-center gap-1.5"
                  >
                    <Copy size={14} />
                    Copy {tab === "result" ? "Result" : "Prompt"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <p className="text-sm">Select a history item to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
