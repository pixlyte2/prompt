import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Bot, X, Send, Loader2, Trash2, Minimize2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDarkMode } from "../contexts/DarkModeContext";
import { renderMarkdown } from "../utils/markdown";

const SESSION_KEY = "creatorai_assistant_session_v1";
const MODEL_OPTIONS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-flash-latest", label: "Flash latest" },
  { value: "gemini-pro-latest", label: "Pro latest" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.messages) ? data.messages : [];
  } catch {
    return [];
  }
}

function saveSession(messages) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ messages, t: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

export default function AssistantWidget() {
  const { isDark } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadSession);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const listRef = useRef(null);

  useEffect(() => {
    saveSession(messages);
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const storedKey = localStorage.getItem("GEMINI_API_KEY_ENC");
    if (!storedKey) {
      toast.error("Add your Gemini API key in AI Chat → Settings");
      return;
    }

    let apiKey;
    try {
      const { decryptData } = await import("../utils/encryption");
      apiKey = await decryptData(storedKey);
      if (!apiKey) throw new Error("decrypt");
    } catch {
      toast.error("Could not read API key. Re-save it in Settings.");
      return;
    }

    const userMessage = { role: "user", content: text };
    const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const client = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        timeout: 120000,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const res = await client.post("/ai/assistant", {
        message: text,
        history: historyForApi,
        aiModel,
        apiKey,
      });
      const reply = res.data?.response ?? "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Request failed";
      toast.error(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, aiModel]);

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(SESSION_KEY);
    toast.success("Chat cleared");
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-end gap-2 pointer-events-none">
      {open && (
        <div
          className="pointer-events-auto flex w-[min(calc(100vw-2rem),24rem)] h-[min(calc(100dvh-5.5rem),36rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-2xl shadow-gray-900/20 dark:shadow-black/40"
          role="dialog"
          aria-label="AI assistant"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <Bot size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">Assistant</p>
                <p className="text-[10px] text-blue-100 truncate">CreatorAI help · uses your Gemini key</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-white/15 text-white/90"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-white/15 text-white/90"
                title="Minimize"
                aria-label="Close assistant"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50/80 dark:bg-gray-950/50"
          >
            {messages.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-0.5">
                Ask how to use Dashboard, prompts, users, or AI Chat. Uses the same Gemini key as{" "}
                <strong className="text-gray-700 dark:text-gray-300">AI Chat → Settings</strong>.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-xl px-2.5 py-2 text-xs ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div
                      className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 [&_pre]:text-[11px]"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content, isDark) }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl rounded-bl-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-2 bg-white dark:bg-gray-900">
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              disabled={loading}
              className="w-full buffer-input text-[11px] py-1.5"
            >
              {MODEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything about CreatorAI…"
                disabled={loading}
                rows={2}
                className="buffer-input text-xs flex-1 min-h-[2.75rem] max-h-24 resize-y py-2"
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 self-end rounded-xl bg-blue-600 text-white p-2.5 hover:bg-blue-700 disabled:opacity-40"
                aria-label="Send"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/35 hover:from-blue-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transition-transform hover:scale-105 active:scale-95"
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open AI assistant"}
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>
    </div>
  );
}
