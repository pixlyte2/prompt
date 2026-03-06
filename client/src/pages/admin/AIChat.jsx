import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Copy, Eye, Trash2, X, History, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import { decryptData } from "../../utils/encryption";

export default function AIChat() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [videoLength, setVideoLength] = useState("reel");
  const [finalizedPrompt, setFinalizedPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadPrompts();
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    updateFinalizedPrompt();
  }, [selectedPrompt, sourceText, videoLength, prompts]);

  const updateFinalizedPrompt = () => {
    if (!selectedPrompt) {
      setFinalizedPrompt("");
      return;
    }

    const prompt = prompts.find(p => p._id === selectedPrompt);
    if (!prompt) return;

    const finalized = prompt.promptText
      .replace(/\[SOURCE\]/g, sourceText || '[SOURCE]')
      .replace(/\[LENGTH\]/g, videoLength === 'reel' ? 'Short Video 30s' : 'Long Video 3 min');
    
    setFinalizedPrompt(finalized);
  };

  const loadHistory = () => {
    const stored = localStorage.getItem("AI_CHAT_HISTORY");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const saveToHistory = (result) => {
    const prompt = prompts.find(p => p._id === selectedPrompt);
    const promptTitle = prompt ? `${prompt.channelId?.name} - ${prompt.promptTypeId?.name}` : "Untitled";
    
    const newItem = {
      id: Date.now(),
      title: promptTitle,
      prompt: finalizedPrompt,
      result: result,
      timestamp: new Date().toISOString()
    };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem("AI_CHAT_HISTORY", JSON.stringify(updated));
  };

  const deleteFromHistory = (id) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("AI_CHAT_HISTORY", JSON.stringify(updated));
    if (selectedHistory?.id === id) {
      setSelectedHistory(updated[0] || null);
    }
    toast.success("Deleted from history");
  };

  const loadPrompts = async () => {
    try {
      const res = await api.get("/prompts");
      setPrompts(res.data);
    } catch {
      toast.error("Failed to load prompts");
    }
  };

  const handleSend = async () => {
    if (!selectedPrompt) {
      toast.error("Please select a prompt");
      return;
    }

    if (!input.trim() && !finalizedPrompt) {
      toast.error("Please enter a message or select a prompt");
      return;
    }

    const userMessage = { role: "user", content: input || "Generate content based on the prompt" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        promptId: selectedPrompt,
        sourceText,
        videoLength,
        message: input || "Generate content based on the prompt",
        history: messages,
        apiKey: "mock-key"
      });

      const result = res.data.response;
      setCurrentResult(result);
      setResultModal(true);
      
      const aiMessage = { role: "assistant", content: result };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get AI response");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResultModal = () => {
    if (currentResult) {
      saveToHistory(currentResult);
    }
    setResultModal(false);
    setCurrentResult(null);
  };

  const openHistoryModal = () => {
    if (history.length > 0) {
      setSelectedHistory(history[0]);
    }
    setHistoryModal(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AdminLayout 
      title="AI Chat" 
      titleInfo="Create amazing content with AI-powered prompts"
      icon={MessageSquare}
      onHistoryClick={openHistoryModal} 
      historyCount={history.length}
    >
      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="space-y-6">
          <div className="flex gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Video Length
              </label>
              <select
                value={videoLength}
                onChange={(e) => setVideoLength(e.target.value)}
                className="w-48 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-all"
              >
                <option value="reel">Reel (30s)</option>
                <option value="long">Long (3 min)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Select Prompt
              </label>
              <div className="flex gap-3">
                <select
                  value={selectedPrompt}
                  onChange={(e) => setSelectedPrompt(e.target.value)}
                  className="w-[30rem] px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="">Choose a prompt...</option>
                  {prompts.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.channelId?.name} - {p.promptTypeId?.name} ({p.aiModel})
                    </option>
                  ))}
                </select>
                {selectedPrompt && (
                  <>
                    <button
                      onClick={() => setPreviewModal(true)}
                      className="px-4 py-2.5 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all flex items-center gap-2 font-semibold whitespace-nowrap shadow-sm hover:shadow-md"
                      title="Preview prompt"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(finalizedPrompt);
                        toast.success("Prompt copied");
                      }}
                      className="px-4 py-2.5 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all flex items-center gap-2 font-semibold whitespace-nowrap shadow-sm hover:shadow-md"
                      title="Copy prompt"
                    >
                      <Copy size={16} />
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-lg">
            <p className="text-sm text-cyan-800 font-medium">
              💡 Use [LENGTH] for video duration and [SOURCE] for content in your prompt
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Source Input
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste YouTube URL, script, or any text here..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none transition-all"
              rows={5}
            />
          </div>

          {finalizedPrompt && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-4">
              <div className="text-xs font-bold text-cyan-700 uppercase mb-2 tracking-wide">Finalized Prompt</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto bg-white p-3 rounded-lg">{finalizedPrompt}</div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type additional input or question..."
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 transition-all text-base"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg font-semibold text-base transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* History Modal - Gemini Style */}
      {historyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-[90rem] h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History size={24} />
                Result History
              </h3>
              <button onClick={() => setHistoryModal(false)} className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - History List */}
              <div className="w-72 border-r bg-gray-50 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p className="font-medium">No history yet</p>
                    <p className="text-sm mt-1">Generated results will appear here</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedHistory(item)}
                        className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                          selectedHistory?.id === item.id
                            ? "bg-cyan-100 border-2 border-cyan-500"
                            : "bg-white border border-gray-200 hover:border-cyan-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="text-xs font-bold text-cyan-700 uppercase">
                            {item.title}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFromHistory(item.id);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-1.5">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-700 line-clamp-2">
                          {item.prompt.substring(0, 60)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Panel - Selected Result */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {selectedHistory ? (
                  <>
                    <div className="p-5 border-b bg-gray-50">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Prompt</div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800">{selectedHistory.prompt}</pre>
                      </div>
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Result</div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <pre className="whitespace-pre-wrap text-sm text-gray-900">{selectedHistory.result}</pre>
                      </div>
                    </div>
                    <div className="p-4 border-t bg-white flex justify-end">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedHistory.result);
                          toast.success("Copied to clipboard");
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <Copy size={16} />
                        Copy Result
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <p className="font-medium">Select a history item to view</p>
                      <p className="text-sm mt-1">Click on any item from the left sidebar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && currentResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">AI Generated Result</h3>
              <button onClick={handleCloseResultModal} className="hover:bg-blue-700 p-2 rounded-lg transition">
                <X size={28} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
              <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-inner">
                <pre className="whitespace-pre-wrap text-base text-gray-900 font-sans leading-relaxed">{currentResult}</pre>
              </div>
            </div>
            <div className="p-6 border-t bg-white flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentResult);
                  toast.success("Copied to clipboard");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Copy size={18} />
                Copy
              </button>
              <button
                onClick={handleCloseResultModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold">Prompt Preview</h3>
              <button onClick={() => setPreviewModal(false)} className="hover:bg-blue-700 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 border-b bg-gray-50">
              <div className="flex gap-6">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Channel:</span>
                  <div className="font-bold text-gray-800">{prompts.find(p => p._id === selectedPrompt)?.channelId?.name || "-"}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Type:</span>
                  <div className="font-bold text-gray-800">{prompts.find(p => p._id === selectedPrompt)?.promptTypeId?.name || "-"}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Model:</span>
                  <div className="font-bold font-mono text-sm text-gray-800">{prompts.find(p => p._id === selectedPrompt)?.aiModel || "-"}</div>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                  {prompts.find(p => p._id === selectedPrompt)?.promptText
                    ?.replace(/\[SOURCE\]/g, sourceText || '[SOURCE]')
                    ?.replace(/\[LENGTH\]/g, videoLength === 'reel' ? 'Short Video 30s' : 'Long Video 3 min')}
                </pre>
              </div>
            </div>
            <div className="p-6 border-t bg-white flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(prompts.find(p => p._id === selectedPrompt)?.promptText);
                  toast.success("Copied to clipboard");
                  setPreviewModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Copy size={18} />
                Copy
              </button>
              <button
                onClick={() => setPreviewModal(false)}
                className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
