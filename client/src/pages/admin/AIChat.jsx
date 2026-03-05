import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ChevronDown, ChevronUp, Copy, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";

export default function AIChat() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadPrompts = async () => {
    try {
      const res = await api.get("/prompts");
      setPrompts(res.data);
    } catch {
      toast.error("Failed to load prompts");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!selectedPrompt) {
      toast.error("Please select a prompt");
      return;
    }

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const prompt = prompts.find(p => p._id === selectedPrompt);
      const res = await api.post("/ai/chat", {
        promptId: selectedPrompt,
        sourceText,
        message: input,
        history: messages
      });

      const aiMessage = { role: "assistant", content: res.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get AI response");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AdminLayout title="AI Chat">
      <div className="bg-gray-50 p-4">
        <div className="h-[calc(100vh-10rem)] flex flex-col bg-white rounded-lg shadow border">
        {/* Header */}
        <div className="border-b p-3 md:p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Prompt
            </label>
            <select
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Choose a prompt...</option>
              {prompts.map(p => (
                <option key={p._id} value={p._id}>
                  {p.channelId?.name} - {p.promptTypeId?.name} ({p.aiModel})
                </option>
              ))}
            </select>
            {selectedPrompt && (
              <div className="mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowPromptDetails(!showPromptDetails)}
                    className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    {showPromptDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showPromptDetails ? "Hide" : "Show"} Prompt Details
                  </button>
                  <button
                    onClick={() => setPreviewModal(true)}
                    className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all flex items-center gap-1 text-sm font-medium"
                    title="Preview prompt"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prompts.find(p => p._id === selectedPrompt)?.promptText);
                      toast.success("Prompt copied");
                    }}
                    className="p-2 bg-cyan-100 text-cyan-600 hover:bg-cyan-600 hover:text-white rounded-lg transition-all flex items-center gap-1 text-sm font-medium"
                    title="Copy prompt"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
                {showPromptDetails && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex gap-4 text-sm mb-2">
                      <div>
                        <span className="text-gray-500">Channel:</span>
                        <span className="ml-1 font-medium">{prompts.find(p => p._id === selectedPrompt)?.channelId?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1 font-medium">{prompts.find(p => p._id === selectedPrompt)?.promptTypeId?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Model:</span>
                        <span className="ml-1 font-medium font-mono">{prompts.find(p => p._id === selectedPrompt)?.aiModel}</span>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700 max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">{prompts.find(p => p._id === selectedPrompt)?.promptText}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Input
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste YouTube URL, script, or any text here..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm">Select a prompt and type your message below</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Preview Modal */}
      {previewModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prompt Preview</h3>
              <button onClick={() => setPreviewModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3 border-b">
              <div className="flex gap-4">
                <div>
                  <span className="text-xs text-gray-500">Channel:</span>
                  <div className="font-medium">{prompts.find(p => p._id === selectedPrompt)?.channelId?.name || "-"}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Type:</span>
                  <div className="font-medium">{prompts.find(p => p._id === selectedPrompt)?.promptTypeId?.name || "-"}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Model:</span>
                  <div className="font-medium font-mono text-sm">{prompts.find(p => p._id === selectedPrompt)?.aiModel || "-"}</div>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">{prompts.find(p => p._id === selectedPrompt)?.promptText}</pre>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(prompts.find(p => p._id === selectedPrompt)?.promptText);
                  toast.success("Copied to clipboard");
                  setPreviewModal(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Copy size={16} />
                Copy
              </button>
              <button
                onClick={() => setPreviewModal(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
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
