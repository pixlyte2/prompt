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
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="space-y-5">
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
                <option value="40s">40 seconds</option>
                <option value="2min">2 minutes</option>
                <option value="3min">3 minutes</option>
                <option value="5min">5 minutes</option>
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
                  <button
                    onClick={() => setPreviewModal(true)}
                    className="px-4 py-2.5 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all flex items-center gap-2 font-semibold whitespace-nowrap shadow-sm hover:shadow-md"
                    title="Preview prompt"
                  >
                    <Eye size={16} />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
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
              rows={4}
            />
          </div>

          {finalizedPrompt && (
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-200 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full animate-pulse"></div>
                  <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">Finalized Prompt</h3>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(finalizedPrompt);
                    toast.success("Finalized prompt copied to clipboard!");
                  }}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg font-semibold text-base transition-all"
                >
                  <Copy size={16} />
                  Copy Prompt
                </button>
              </div>
              <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-inner">
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium max-h-32 overflow-y-auto">
                  {finalizedPrompt}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                <span className="font-medium">Ready to generate amazing content</span>
              </div>
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
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              disabled={loading}
              className="w-64 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white disabled:bg-gray-50 transition-all font-medium"
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
                    {/* Tabs */}
                    <div className="border-b bg-gray-50">
                      <div className="flex">
                        <button
                          onClick={() => setHistoryTab("result")}
                          className={`px-4 py-2 font-semibold text-sm transition-all ${
                            historyTab === "result"
                              ? "bg-white text-blue-600 border-b-2 border-blue-600"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          Result
                        </button>
                        <button
                          onClick={() => setHistoryTab("prompt")}
                          className={`px-4 py-2 font-semibold text-sm transition-all ${
                            historyTab === "prompt"
                              ? "bg-white text-blue-600 border-b-2 border-blue-600"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          Prompt
                        </button>
                      </div>
                    </div>

                    {/* Tab Content */}
                    {historyTab === "result" ? (
                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div 
                            className="prose prose-sm max-w-none"
                            style={{
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              lineHeight: '1.6',
                              color: '#1f2937',
                              fontSize: '0.875rem'
                            }}
                            dangerouslySetInnerHTML={{ 
                              __html: selectedHistory.result
                                // Code blocks first (before other replacements)
                                .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #1f2937; color: #f9fafb; padding: 0.5rem; border-radius: 0.375rem; overflow-x: auto; margin: 0.5rem 0; font-family: monospace; font-size: 0.75rem;"><code>$1</code></pre>')
                                // Headings
                                .replace(/^#### (.+)$/gm, '<h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 0.75rem; margin-bottom: 0.25rem; color: #1f2937;">$1</h4>')
                                .replace(/^### (.+)$/gm, '<h3 style="font-size: 1rem; font-weight: 700; margin-top: 0.875rem; margin-bottom: 0.375rem; color: #1f2937;">$1</h3>')
                                .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.125rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #111827;">$1</h2>')
                                .replace(/^# (.+)$/gm, '<h1 style="font-size: 1.25rem; font-weight: 800; margin-top: 1.125rem; margin-bottom: 0.625rem; color: #111827;">$1</h1>')
                                // Horizontal rule
                                .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0.75rem 0;" />')
                                // Bold and italic
                                .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700; color: #111827;">$1</strong>')
                                .replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>')
                                // Lists
                                .replace(/^\* (.+)$/gm, '<li style="margin-left: 1.25rem; margin-bottom: 0.125rem; list-style-type: disc;">$1</li>')
                                .replace(/^- (.+)$/gm, '<li style="margin-left: 1.25rem; margin-bottom: 0.125rem; list-style-type: disc;">$1</li>')
                                .replace(/^\d+\. (.+)$/gm, '<li style="margin-left: 1.25rem; margin-bottom: 0.125rem; list-style-type: decimal;">$1</li>')
                                // Inline code
                                .replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; padding: 0.0625rem 0.25rem; border-radius: 0.1875rem; font-family: monospace; font-size: 0.8em; color: #dc2626;">$1</code>')
                                // Paragraphs
                                .split('\n\n')
                                .map(para => {
                                  para = para.trim();
                                  if (!para) return '';
                                  if (para.startsWith('<h') || para.startsWith('<pre') || para.startsWith('<hr') || para.startsWith('<li')) {
                                    return para;
                                  }
                                  return `<p style="margin-bottom: 0.5rem; line-height: 1.5;">${para}</p>`;
                                })
                                .join('')
                                // Wrap consecutive list items in ul/ol
                                .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
                                  if (match.includes('list-style-type: decimal')) {
                                    return `<ol style="margin: 0.5rem 0;">${match}</ol>`;
                                  }
                                  return `<ul style="margin: 0.5rem 0;">${match}</ul>`;
                                })
                            }} 
                          />
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
