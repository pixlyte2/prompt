import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Copy, Eye, Trash2, X, History, MessageSquare, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import { decryptData } from "../../utils/encryption";

export default function AIChat() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [videoLength, setVideoLength] = useState("40s");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
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
  const [errorModal, setErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [historyTab, setHistoryTab] = useState("result");
  const [chatTab, setChatTab] = useState("source");
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

    const lengthMap = {
      '40s': '40 seconds',
      '2min': '2 minutes', 
      '3min': '3 minutes',
      '5min': '5 minutes'
    };
    
    const finalized = prompt.promptText
      .replace(/\[SOURCE\]/g, sourceText || '[SOURCE]')
      .replace(/\[LENGTH\]/g, lengthMap[videoLength] || videoLength);
    
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
      aiModel: aiModel,
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

    // Check for API key
    const storedKey = localStorage.getItem("GEMINI_API_KEY_ENC");
    if (!storedKey) {
      toast.error("Please configure your Gemini API key in Settings first");
      return;
    }

    // Decrypt API key
    let apiKey;
    try {
      const { decryptData } = await import("../../utils/encryption");
      apiKey = await decryptData(storedKey);
      if (!apiKey) {
        toast.error("Failed to decrypt API key. Please reconfigure in Settings");
        return;
      }
    } catch (err) {
      toast.error("Error accessing API key. Please reconfigure in Settings");
      return;
    }

    const userMessage = { role: "user", content: input || "Generate content based on the prompt" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const requestPayload = {
        promptId: selectedPrompt,
        sourceText,
        videoLength,
        aiModel: aiModel,
        message: input || "Generate content based on the prompt",
        history: messages,
        apiKey: apiKey
      };

      console.log("=== Sending AI Chat Request ===");
      console.log("AI Model being sent:", aiModel);
      console.log("AI Model type:", typeof aiModel);
      console.log("Full payload:", { ...requestPayload, apiKey: "[HIDDEN]" });

      const res = await api.post("/ai/chat", requestPayload);

      const result = res.data.response;
      setCurrentResult(result);
      setResultModal(true);
      
      // Auto-save to history immediately
      saveToHistory(result);
      
      const aiMessage = { role: "assistant", content: result };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorInfo = {
        request: {
          promptId: selectedPrompt,
          sourceText: sourceText?.substring(0, 100) + (sourceText?.length > 100 ? '...' : ''),
          videoLength,
          aiModel,
          message: input || "Generate content based on the prompt",
          timestamp: new Date().toISOString()
        },
        response: {
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.response?.data?.message || err.message,
          error: err.response?.data?.error,
          fullError: JSON.stringify(err.response?.data || err.message, null, 2)
        }
      };
      setErrorDetails(errorInfo);
      setErrorModal(true);
      toast.error(err.response?.data?.message || "Failed to get AI response");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResultModal = () => {
    setResultModal(false);
    setCurrentResult(null);
    setIsFullScreen(false);
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
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 h-[calc(100vh-8rem)]">
        <div className="space-y-3 h-full flex flex-col">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Video Length
              </label>
              <select
                value={videoLength}
                onChange={(e) => setVideoLength(e.target.value)}
                className="w-40 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-all text-sm"
              >
                <option value="40s">40 seconds</option>
                <option value="2min">2 minutes</option>
                <option value="3min">3 minutes</option>
                <option value="5min">5 minutes</option>
              </select>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Select Prompt
                </label>
                <div className="flex items-center gap-1 text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                  <span className="font-semibold">💡 Use [LENGTH] & [SOURCE] in prompt</span>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedPrompt}
                  onChange={(e) => setSelectedPrompt(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-all text-sm"
                >
                  <option value="">Choose a prompt...</option>
                  {prompts.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.channelId?.name} - {p.promptTypeId?.name} ({p.aiModel})
                    </option>
                  ))}
                </select>
                {selectedPrompt && (
                  <button
                    onClick={() => setPreviewModal(true)}
                    className="px-3 py-2 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all flex items-center gap-1.5 font-semibold whitespace-nowrap shadow-sm hover:shadow-md text-sm"
                    title="Preview prompt"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs for Source Input and Finalized Prompt */}
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden flex-1 flex flex-col">
            {/* Tab Headers */}
            <div className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 via-blue-50/30 to-gray-50 px-3 flex-shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={() => setChatTab("source")}
                  className={`relative px-4 py-2.5 font-bold text-xs transition-all duration-300 rounded-t-lg ${
                    chatTab === "source"
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    Source Input
                  </span>
                  {chatTab === "source" && (
                    <>
                      <div className="absolute inset-0 bg-white rounded-t-lg shadow-lg" />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-t-sm" />
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-t-lg" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setChatTab("finalized")}
                  className={`relative px-4 py-2.5 font-bold text-xs transition-all duration-300 rounded-t-lg ${
                    chatTab === "finalized"
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Copy size={14} />
                    Finalized Prompt
                  </span>
                  {chatTab === "finalized" && (
                    <>
                      <div className="absolute inset-0 bg-white rounded-t-lg shadow-lg" />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-t-sm" />
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-t-lg" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white p-3 flex-1 overflow-y-auto">
              {chatTab === "source" ? (
                <div className="h-full">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste YouTube URL, script, or any text here..."
                    className="w-full h-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none transition-all text-sm"
                  />
                </div>
              ) : (
                <div className="h-full">
                  {finalizedPrompt ? (
                    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-200 rounded-xl p-3 shadow-lg h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full animate-pulse"></div>
                          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Finalized Prompt</h3>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(finalizedPrompt);
                            toast.success("Finalized prompt copied to clipboard!");
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg font-semibold text-xs transition-all"
                        >
                          <Copy size={12} />
                          Copy
                        </button>
                      </div>
                      <div className="bg-white border border-indigo-200 rounded-lg p-2.5 shadow-inner flex-1 overflow-y-auto">
                        <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                          {finalizedPrompt}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center h-full flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Copy size={20} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-semibold text-xs">No finalized prompt yet</p>
                      <p className="text-xs text-gray-400 mt-1">Select a prompt and add source text</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type additional input or question..."
              disabled={loading}
              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 transition-all text-sm"
            />
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              disabled={loading}
              className="w-56 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white disabled:bg-gray-50 transition-all font-medium text-xs"
            >
              <option value="gemini-2.5-flash">⚡ Gemini 2.5 Flash (Recommended)</option>
              <option value="gemini-2.5-pro">💎 Gemini 2.5 Pro (Best Quality)</option>
              <option value="gemini-flash-latest">🆕 Flash Latest</option>
              <option value="gemini-pro-latest">🆕 Pro Latest</option>
              <option value="gemini-2.0-flash">⚡ Gemini 2.0 Flash</option>
            </select>
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg font-semibold text-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
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
          <div className="bg-white rounded-xl w-full max-w-[90rem] h-[95vh] flex flex-col shadow-2xl">
            <div className="p-3 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History size={20} />
                Result History
              </h3>
              <button onClick={() => setHistoryModal(false)} className="hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - History List */}
              <div className="w-64 border-r bg-gradient-to-b from-gray-50 via-blue-50/30 to-gray-50 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <History size={24} className="text-blue-600" />
                    </div>
                    <p className="font-bold text-gray-700 text-sm">No history yet</p>
                    <p className="text-xs text-gray-500 mt-1">Results will appear here</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {history.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedHistory(item)}
                        className={`group relative p-2.5 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedHistory?.id === item.id
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg transform scale-[1.01]"
                            : "bg-white border border-gray-200 hover:border-blue-400 hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:via-blue-50/50 hover:to-indigo-50/30 hover:transform hover:scale-[1.01] hover:-translate-y-0.5"
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        {/* Accent bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg transition-all duration-300 ${
                          selectedHistory?.id === item.id
                            ? "bg-white"
                            : "bg-gradient-to-b from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100"
                        }`} />

                        <div className="flex justify-between items-start mb-1.5">
                          <div className={`text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 flex-1 pr-1 line-clamp-1 ${
                            selectedHistory?.id === item.id 
                              ? "text-white" 
                              : "text-gray-700 group-hover:text-blue-700"
                          }`}>
                            {item.title} {item.aiModel && `(${item.aiModel})`}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFromHistory(item.id);
                            }}
                            className={`flex-shrink-0 p-1 rounded transition-all duration-300 hover:scale-110 ${
                              selectedHistory?.id === item.id
                                ? "text-white/80 hover:text-white hover:bg-white/20"
                                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                            }`}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className={`flex items-center gap-1 text-[10px] mb-1.5 transition-all duration-300 ${
                          selectedHistory?.id === item.id 
                            ? "text-white/90" 
                            : "text-gray-500 group-hover:text-blue-600"
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${
                            selectedHistory?.id === item.id ? "bg-white/90" : "bg-blue-400"
                          }`} />
                          <span className="font-medium">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>

                        <div className={`text-[10px] leading-relaxed line-clamp-2 transition-all duration-300 ${
                          selectedHistory?.id === item.id 
                            ? "text-white/95 font-medium" 
                            : "text-gray-600 group-hover:text-gray-800"
                        }`}>
                          {item.prompt.substring(0, 60)}{item.prompt.length > 60 ? '...' : ''}
                        </div>

                        {/* Selection indicator */}
                        {selectedHistory?.id === item.id && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Panel - Selected Result */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {selectedHistory ? (
                  <>
                    {/* Tabs */}
                    <div className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 via-blue-50/30 to-gray-50 px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setHistoryTab("result")}
                          className={`relative px-6 py-3.5 font-bold text-sm transition-all duration-300 rounded-t-xl ${
                            historyTab === "result"
                              ? "text-blue-600"
                              : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                          }`}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            <MessageSquare size={16} />
                            Result
                          </span>
                          {historyTab === "result" && (
                            <>
                              <div className="absolute inset-0 bg-white rounded-t-xl shadow-lg" />
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-t-sm" />
                              <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-t-xl" />
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setHistoryTab("prompt")}
                          className={`relative px-6 py-3.5 font-bold text-sm transition-all duration-300 rounded-t-xl ${
                            historyTab === "prompt"
                              ? "text-blue-600"
                              : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                          }`}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            <Copy size={16} />
                            Prompt
                          </span>
                          {historyTab === "prompt" && (
                            <>
                              <div className="absolute inset-0 bg-white rounded-t-xl shadow-lg" />
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-t-sm" />
                              <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-t-xl" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tab Content */}
                    {historyTab === "result" ? (
                      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20">
                        <div className="p-6">
                          {/* Content Card */}
                          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
                            <div className="p-8">
                              <div 
                                className="prose prose-base max-w-none"
                                style={{
                                  fontFamily: 'system-ui, -apple-system, sans-serif',
                                  lineHeight: '1.75',
                                  color: '#1f2937'
                                }}
                                dangerouslySetInnerHTML={{ 
                                  __html: selectedHistory.result
                                    // Code blocks first (before other replacements)
                                    .replace(/```([\s\S]*?)```/g, '<pre style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: #f9fafb; padding: 1.25rem; border-radius: 0.75rem; overflow-x: auto; margin: 1.25rem 0; font-family: monospace; font-size: 0.875rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #374151;"><code>$1</code></pre>')
                                    // Headings
                                    .replace(/^#### (.+)$/gm, '<h4 style="font-size: 1.125rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1f2937; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb;">$1</h4>')
                                    .replace(/^### (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 700; margin-top: 1.75rem; margin-bottom: 0.875rem; color: #1f2937; padding-bottom: 0.5rem; border-bottom: 2px solid #dbeafe;">$1</h3>')
                                    .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #111827; padding-bottom: 0.75rem; border-bottom: 3px solid #3b82f6; background: linear-gradient(to right, #dbeafe, transparent); padding-left: 1rem; border-radius: 0.25rem;">$1</h2>')
                                    .replace(/^# (.+)$/gm, '<h1 style="font-size: 1.875rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1.25rem; color: #111827; padding: 1rem; background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-left: 4px solid #3b82f6; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">$1</h1>')
                                    // Horizontal rule
                                    .replace(/^---$/gm, '<hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, #3b82f6, transparent); margin: 2rem 0;" />')
                                    // Bold and italic
                                    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700; color: #111827; background: linear-gradient(to right, #dbeafe, transparent); padding: 0.125rem 0.25rem; border-radius: 0.25rem;">$1</strong>')
                                    .replace(/\*(.+?)\*/g, '<em style="font-style: italic; color: #4b5563;">$1</em>')
                                    // Lists
                                    .replace(/^\* (.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem; padding-left: 0.5rem; list-style-type: none; position: relative;"><span style="position: absolute; left: -1.25rem; color: #3b82f6; font-weight: bold;">•</span>$1</li>')
                                    .replace(/^- (.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem; padding-left: 0.5rem; list-style-type: none; position: relative;"><span style="position: absolute; left: -1.25rem; color: #3b82f6; font-weight: bold;">•</span>$1</li>')
                                    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem; padding-left: 0.5rem; list-style-type: decimal; color: #1f2937;">$1</li>')
                                    // Inline code
                                    .replace(/`([^`]+)`/g, '<code style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-family: monospace; font-size: 0.875em; color: #dc2626; font-weight: 600; border: 1px solid #fbbf24;">$1</code>')
                                    // Paragraphs
                                    .split('\n\n')
                                    .map(para => {
                                      para = para.trim();
                                      if (!para) return '';
                                      if (para.startsWith('<h') || para.startsWith('<pre') || para.startsWith('<hr') || para.startsWith('<li')) {
                                        return para;
                                      }
                                      return `<p style="margin-bottom: 1rem; line-height: 1.75; color: #374151; font-size: 1rem;">${para}</p>`;
                                    })
                                    .join('')
                                    // Wrap consecutive list items in ul/ol
                                    .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
                                      if (match.includes('list-style-type: decimal')) {
                                        return `<ol style="margin: 1rem 0; padding: 1rem; background: linear-gradient(to right, #f0f9ff, transparent); border-left: 3px solid #3b82f6; border-radius: 0.5rem;">${match}</ol>`;
                                      }
                                      return `<ul style="margin: 1rem 0; padding: 1rem; background: linear-gradient(to right, #f0f9ff, transparent); border-left: 3px solid #3b82f6; border-radius: 0.5rem;">${match}</ul>`;
                                    })
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">{selectedHistory.prompt}</pre>
                        </div>
                      </div>
                    )}

                    <div className="p-3 border-t bg-white flex justify-end">
                      <button
                        onClick={() => {
                          const textToCopy = historyTab === "result" ? selectedHistory.result : selectedHistory.prompt;
                          navigator.clipboard.writeText(textToCopy);
                          toast.success(`${historyTab === "result" ? "Result" : "Prompt"} copied to clipboard`);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all text-sm"
                      >
                        <Copy size={14} />
                        Copy {historyTab === "result" ? "Result" : "Prompt"}
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
          <div className={`bg-white rounded-2xl w-full flex flex-col shadow-2xl transition-all ${
            isFullScreen ? 'max-w-[98vw] h-[98vh]' : 'max-w-5xl max-h-[90vh]'
          }`}>
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">AI Generated Result</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className="hover:bg-blue-700 p-2 rounded-lg transition"
                  title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
                <button onClick={handleCloseResultModal} className="hover:bg-blue-700 p-2 rounded-lg transition">
                  <X size={28} />
                </button>
              </div>
            </div>
            <div className={`overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 to-blue-50 ${
              isFullScreen ? 'p-4' : 'p-8'
            }`}>
              <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${
                isFullScreen ? 'p-4' : 'p-8'
              }`}>
                <div 
                  className="prose prose-lg max-w-none"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    lineHeight: isFullScreen ? '1.6' : '1.75',
                    color: '#1f2937',
                    fontSize: isFullScreen ? '0.875rem' : '1rem'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: currentResult
                      // Code blocks first (before other replacements)
                      .replace(/```([\s\S]*?)```/g, `<pre style="background-color: #1f2937; color: #f9fafb; padding: ${isFullScreen ? '0.75rem' : '1rem'}; border-radius: 0.5rem; overflow-x: auto; margin: ${isFullScreen ? '0.75rem' : '1rem'} 0; font-family: monospace; font-size: ${isFullScreen ? '0.75rem' : '0.875rem'};"><code>$1</code></pre>`)
                      // Headings
                      .replace(/^#### (.+)$/gm, `<h4 style="font-size: ${isFullScreen ? '1rem' : '1.25rem'}; font-weight: 700; margin-top: ${isFullScreen ? '1rem' : '1.25rem'}; margin-bottom: ${isFullScreen ? '0.375rem' : '0.5rem'}; color: #1f2937;">$1</h4>`)
                      .replace(/^### (.+)$/gm, `<h3 style="font-size: ${isFullScreen ? '1.125rem' : '1.5rem'}; font-weight: 700; margin-top: ${isFullScreen ? '1.125rem' : '1.5rem'}; margin-bottom: ${isFullScreen ? '0.5rem' : '0.75rem'}; color: #1f2937;">$1</h3>`)
                      .replace(/^## (.+)$/gm, `<h2 style="font-size: ${isFullScreen ? '1.25rem' : '1.875rem'}; font-weight: 700; margin-top: ${isFullScreen ? '1.25rem' : '2rem'}; margin-bottom: ${isFullScreen ? '0.625rem' : '1rem'}; color: #111827;">$1</h2>`)
                      .replace(/^# (.+)$/gm, `<h1 style="font-size: ${isFullScreen ? '1.5rem' : '2.25rem'}; font-weight: 800; margin-top: ${isFullScreen ? '1.5rem' : '2rem'}; margin-bottom: ${isFullScreen ? '0.75rem' : '1rem'}; color: #111827;">$1</h1>`)
                      // Horizontal rule
                      .replace(/^---$/gm, `<hr style="border: none; border-top: 2px solid #e5e7eb; margin: ${isFullScreen ? '1rem' : '1.5rem'} 0;" />`)
                      // Bold and italic
                      .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700; color: #111827;">$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>')
                      // Lists
                      .replace(/^\* (.+)$/gm, `<li style="margin-left: 1.5rem; margin-bottom: ${isFullScreen ? '0.25rem' : '0.5rem'}; list-style-type: disc;">$1</li>`)
                      .replace(/^- (.+)$/gm, `<li style="margin-left: 1.5rem; margin-bottom: ${isFullScreen ? '0.25rem' : '0.5rem'}; list-style-type: disc;">$1</li>`)
                      .replace(/^\d+\. (.+)$/gm, `<li style="margin-left: 1.5rem; margin-bottom: ${isFullScreen ? '0.25rem' : '0.5rem'}; list-style-type: decimal;">$1</li>`)
                      // Inline code
                      .replace(/`([^`]+)`/g, `<code style="background-color: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: ${isFullScreen ? '0.8em' : '0.875em'}; color: #dc2626;">$1</code>`)
                      // Paragraphs
                      .split('\n\n')
                      .map(para => {
                        para = para.trim();
                        if (!para) return '';
                        if (para.startsWith('<h') || para.startsWith('<pre') || para.startsWith('<hr') || para.startsWith('<li')) {
                          return para;
                        }
                        return `<p style="margin-bottom: ${isFullScreen ? '0.75rem' : '1rem'}; line-height: ${isFullScreen ? '1.6' : '1.75'};">${para}</p>`;
                      })
                      .join('')
                      // Wrap consecutive list items in ul/ol
                      .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
                        if (match.includes('list-style-type: decimal')) {
                          return `<ol style="margin: ${isFullScreen ? '0.75rem' : '1rem'} 0;">${match}</ol>`;
                        }
                        return `<ul style="margin: ${isFullScreen ? '0.75rem' : '1rem'} 0;">${match}</ul>`;
                      })
                  }} 
                />
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
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && errorDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">⚠️ AI Generation Error</h3>
              <button onClick={() => setErrorModal(false)} className="hover:bg-red-700 p-2 rounded-lg transition">
                <X size={28} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
              {/* Request Info */}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Request Information
                </div>
                <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Prompt ID:</span>
                      <div className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded">{errorDetails.request.promptId}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">AI Model:</span>
                      <div className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded font-bold">{errorDetails.request.aiModel}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Video Length:</span>
                      <div className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded">{errorDetails.request.videoLength}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Timestamp:</span>
                      <div className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded">{new Date(errorDetails.request.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Source Text:</span>
                    <div className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded max-h-20 overflow-y-auto">{errorDetails.request.sourceText || 'N/A'}</div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Message:</span>
                    <div className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded">{errorDetails.request.message}</div>
                  </div>
                </div>
              </div>

              {/* Response Info */}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Response Information
                </div>
                <div className="bg-white p-5 rounded-xl border-2 border-red-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Status Code:</span>
                      <div className="font-mono text-sm text-red-600 bg-red-50 px-3 py-2 rounded font-bold">{errorDetails.response.status || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Status Text:</span>
                      <div className="font-mono text-sm text-red-600 bg-red-50 px-3 py-2 rounded font-bold">{errorDetails.response.statusText || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Error Message:</span>
                    <div className="font-mono text-sm text-red-700 bg-red-50 px-3 py-2 rounded font-medium">{errorDetails.response.message}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Full Error Details:</span>
                    <div className="bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-xs text-green-400 font-mono">{errorDetails.response.fullError}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-white flex justify-end gap-3">
              <button
                onClick={() => {
                  const errorText = `REQUEST INFO:\n${JSON.stringify(errorDetails.request, null, 2)}\n\nRESPONSE INFO:\n${errorDetails.response.fullError}`;
                  navigator.clipboard.writeText(errorText);
                  toast.success("Error details copied to clipboard");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Copy size={18} />
                Copy Error Details
              </button>
              <button
                onClick={() => setErrorModal(false)}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Close
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
                    ?.replace(/\[LENGTH\]/g, (() => {
                      const lengthMap = {
                        '40s': '40 seconds',
                        '2min': '2 minutes', 
                        '3min': '3 minutes',
                        '5min': '5 minutes'
                      };
                      return lengthMap[videoLength] || videoLength;
                    })())}
                </pre>
              </div>
            </div>
            <div className="p-6 border-t bg-white flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(prompts.find(p => p._id === selectedPrompt)?.promptText);
                  toast.success("Original prompt copied to clipboard!");
                  setPreviewModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Copy size={18} />
                Copy Original
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(finalizedPrompt);
                  toast.success("Finalized prompt copied to clipboard!");
                  setPreviewModal(false);
                }}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Copy size={18} />
                Copy Finalized
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
