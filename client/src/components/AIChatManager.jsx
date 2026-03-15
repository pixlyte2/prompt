import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Copy, Eye, X, MessageSquare, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import { decryptData } from "../utils/encryption";
import { renderMarkdown } from "../utils/markdown";
import HistoryModal from "./HistoryModal";

export default function AIChatManager() {
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
  const [historyItemId, setHistoryItemId] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [errorModal, setErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatTab, setChatTab] = useState("source");
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    loadPrompts().then(() => {
      const s = location.state;
      if (!s) return;
      if (s.promptId) {
        setSelectedPrompt(s.promptId);
        if (s.videoLength) setVideoLength(s.videoLength);
        if (s.sourceText) setSourceText(s.sourceText);
        if (s.aiModel) setAiModel(s.aiModel);
      }
      if (s.openHistoryId) {
        setHistoryItemId(s.openHistoryId);
        setHistoryModal(true);
      } else if (s.openHistory) {
        setHistoryModal(true);
      }
      window.history.replaceState({}, "");
    });
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
    try {
      const stored = localStorage.getItem("AI_CHAT_HISTORY");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const saveToHistory = (result) => {
    const prompt = prompts.find(p => p._id === selectedPrompt);
    const promptTitle = prompt ? `${prompt.channelId?.name} - ${prompt.promptTypeId?.name}` : "Untitled";
    const history = loadHistory();
    const newItem = {
      id: Date.now(),
      title: promptTitle,
      channel: prompt?.channelId?.name || "",
      promptType: prompt?.promptTypeId?.name || "",
      subType: prompt?.aiModel || "",
      prompt: finalizedPrompt,
      result: result,
      aiModel: aiModel,
      promptId: selectedPrompt,
      sourceText: sourceText,
      videoLength: videoLength,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("AI_CHAT_HISTORY", JSON.stringify([newItem, ...history]));
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
      const { decryptData } = await import("../utils/encryption");
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

      // Create a custom axios instance with longer timeout for AI requests
      const aiApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        timeout: 120000, // 2 minutes timeout for AI requests
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const res = await aiApi.post("/ai/chat", requestPayload);

      const result = res.data.response;
      setCurrentResult(result);
      setResultModal(true);
      
      // Auto-save to history immediately
      saveToHistory(result);
      
      const aiMessage = { role: "assistant", content: result };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      let errorMessage = "Failed to get AI response";
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = "Request timed out. The AI service is taking longer than expected. Please try again.";
      } else if (err.response?.status === 429) {
        errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid API key. Please check your Gemini API key in Settings.";
      } else if (err.response?.status >= 500) {
        errorMessage = "AI service is temporarily unavailable. Please try again later.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

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
          status: err.response?.status || 'N/A',
          statusText: err.response?.statusText || 'N/A',
          message: errorMessage,
          error: err.response?.data?.error || err.code || 'Unknown',
          fullError: JSON.stringify(err.response?.data || { code: err.code, message: err.message }, null, 2)
        }
      };
      setErrorDetails(errorInfo);
      setErrorModal(true);
      toast.error(errorMessage);
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="buffer-card p-4 h-[calc(100vh-10rem)]">
      <div className="space-y-3 h-full flex flex-col">
        <div className="flex gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Video Length
            </label>
            <select
              value={videoLength}
              onChange={(e) => setVideoLength(e.target.value)}
              className="buffer-input text-sm w-40"
            >
              <option value="40s">40 seconds</option>
              <option value="2min">2 minutes</option>
              <option value="3min">3 minutes</option>
              <option value="5min">5 minutes</option>
            </select>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-500">
                Select Prompt
              </label>
              <span className="text-xs text-blue-600">💡 Use [LENGTH] & [SOURCE] in prompt</span>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPrompt}
                onChange={(e) => setSelectedPrompt(e.target.value)}
                className="buffer-input text-sm flex-1"
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
                  className="buffer-button-secondary text-sm flex items-center gap-1.5 whitespace-nowrap"
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
        <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col">
          <div className="border-b border-gray-200 px-3 flex justify-between items-center flex-shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => setChatTab("source")}
                className={`py-2 text-sm font-medium border-b-2 flex items-center gap-1.5 ${
                  chatTab === "source"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                  <MessageSquare size={14} />
                  Source Input
              </button>
              <button
                onClick={() => setChatTab("finalized")}
                className={`py-2 text-sm font-medium border-b-2 flex items-center gap-1.5 ${
                  chatTab === "finalized"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                  <Copy size={14} />
                  Finalized Prompt
              </button>
            </div>
            
            {/* Copy button - only show when finalized tab is active and there's content */}
            {chatTab === "finalized" && finalizedPrompt && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(finalizedPrompt);
                  toast.success("Copied to clipboard!");
                }}
                className="buffer-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5 ml-2"
                title="Copy finalized prompt"
              >
                <Copy size={12} />
                Copy
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="bg-white p-3 flex-1 overflow-y-auto">
            {chatTab === "source" ? (
              <div className="h-full">
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Paste YouTube URL, script, or any text here..."
                  className="w-full h-full buffer-input text-sm resize-none"
                />
              </div>
            ) : (
              <div className="h-full">
                {finalizedPrompt ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-full flex flex-col">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 flex-1 overflow-y-auto">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {finalizedPrompt}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center h-full flex flex-col items-center justify-center">
                    <Copy size={20} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No finalized prompt yet</p>
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
            className="buffer-input text-sm flex-1 disabled:bg-gray-50"
          />
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            disabled={loading}
            className="buffer-input text-sm w-56 disabled:bg-gray-50"
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
            className="buffer-button-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {historyModal && <HistoryModal onClose={() => setHistoryModal(false)} initialItemId={historyItemId} />}

      {/* Result Modal */}
      {resultModal && currentResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg w-full flex flex-col border border-gray-200 shadow-lg transition-all ${
            isFullScreen ? 'max-w-[98vw] h-[98vh]' : 'max-w-4xl max-h-[90vh]'
          }`}>
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-600" />
                AI Generated Result
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={handleCloseResultModal} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div 
                className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(currentResult) }} 
              />
            </div>
            <div className="px-4 py-3 border-t flex justify-end">
              <button
                onClick={() => { navigator.clipboard.writeText(currentResult); toast.success("Copied to clipboard"); }}
                className="buffer-button-primary text-sm flex items-center gap-1.5"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && errorDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 shadow-lg">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-50 rounded flex items-center justify-center text-red-600">⚠️</span>
                AI Generation Error
              </h3>
              <button onClick={() => setErrorModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">Request</div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-gray-500">Prompt ID</span><div className="font-mono text-gray-800 mt-0.5">{errorDetails.request.promptId}</div></div>
                    <div><span className="text-xs text-gray-500">AI Model</span><div className="font-mono text-gray-800 mt-0.5 font-medium">{errorDetails.request.aiModel}</div></div>
                    <div><span className="text-xs text-gray-500">Video Length</span><div className="font-mono text-gray-800 mt-0.5">{errorDetails.request.videoLength}</div></div>
                    <div><span className="text-xs text-gray-500">Timestamp</span><div className="font-mono text-gray-800 mt-0.5">{new Date(errorDetails.request.timestamp).toLocaleString()}</div></div>
                  </div>
                  <div className="mt-3"><span className="text-xs text-gray-500">Source Text</span><div className="font-mono text-sm text-gray-800 mt-0.5 max-h-16 overflow-y-auto">{errorDetails.request.sourceText || 'N/A'}</div></div>
                  <div className="mt-3"><span className="text-xs text-gray-500">Message</span><div className="font-mono text-sm text-gray-800 mt-0.5">{errorDetails.request.message}</div></div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">Response</div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div><span className="text-xs text-gray-500">Status Code</span><div className="font-mono text-red-600 mt-0.5 font-medium">{errorDetails.response.status || 'N/A'}</div></div>
                    <div><span className="text-xs text-gray-500">Status Text</span><div className="font-mono text-red-600 mt-0.5 font-medium">{errorDetails.response.statusText || 'N/A'}</div></div>
                  </div>
                  <div className="mb-3"><span className="text-xs text-gray-500">Error Message</span><div className="font-mono text-sm text-red-700 mt-0.5">{errorDetails.response.message}</div></div>
                  <div><span className="text-xs text-gray-500">Full Error</span>
                    <div className="bg-gray-900 p-3 rounded mt-1 max-h-48 overflow-y-auto">
                      <pre className="text-xs text-green-400 font-mono">{errorDetails.response.fullError}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  const errorText = `REQUEST INFO:\n${JSON.stringify(errorDetails.request, null, 2)}\n\nRESPONSE INFO:\n${errorDetails.response.fullError}`;
                  navigator.clipboard.writeText(errorText);
                  toast.success("Error details copied to clipboard");
                }}
                className="buffer-button-primary text-sm flex items-center gap-1.5"
              >
                <Copy size={14} />
                Copy Error Details
              </button>
              <button onClick={() => setErrorModal(false)} className="buffer-button-secondary text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 shadow-lg">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={16} className="text-gray-500" />
                Prompt Preview
              </h3>
              <button onClick={() => setPreviewModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3 border-b bg-gray-50 flex gap-6 text-sm">
              <div><span className="text-xs text-gray-500">Channel</span><div className="font-medium text-gray-800">{prompts.find(p => p._id === selectedPrompt)?.channelId?.name || "-"}</div></div>
              <div><span className="text-xs text-gray-500">Type</span><div className="font-medium text-gray-800">{prompts.find(p => p._id === selectedPrompt)?.promptTypeId?.name || "-"}</div></div>
              <div><span className="text-xs text-gray-500">Model</span><div className="font-medium font-mono text-gray-800">{prompts.find(p => p._id === selectedPrompt)?.aiModel || "-"}</div></div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                  {prompts.find(p => p._id === selectedPrompt)?.promptText
                    ?.replace(/\[SOURCE\]/g, sourceText || '[SOURCE]')
                    ?.replace(/\[LENGTH\]/g, (() => {
                      const lengthMap = { '40s': '40 seconds', '2min': '2 minutes', '3min': '3 minutes', '5min': '5 minutes' };
                      return lengthMap[videoLength] || videoLength;
                    })())}
                </pre>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(prompts.find(p => p._id === selectedPrompt)?.promptText); toast.success("Original prompt copied!"); setPreviewModal(false); }}
                className="buffer-button-secondary text-sm flex items-center gap-1.5"
              >
                <Copy size={14} />
                Copy Original
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(finalizedPrompt); toast.success("Finalized prompt copied!"); setPreviewModal(false); }}
                className="buffer-button-primary text-sm flex items-center gap-1.5"
              >
                <Copy size={14} />
                Copy Finalized
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}