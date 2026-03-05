import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
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
        <div className="border-b p-4 space-y-3">
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
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 border">
                {prompts.find(p => p._id === selectedPrompt)?.promptText?.slice(0, 150)}
                {prompts.find(p => p._id === selectedPrompt)?.promptText?.length > 150 && "..."}
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
    </AdminLayout>
  );
}
