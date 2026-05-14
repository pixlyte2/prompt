import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Youtube, ExternalLink, Search, Copy, Check, Eye, ThumbsUp,
  MessageSquare, Clock, Calendar, Tag, User, Play, X, Image as ImageIcon,
  Code2, Sparkles, AlertCircle, Radio, ShieldAlert,
  EyeOff, ClipboardPaste, Loader2, Filter,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const EXAMPLES = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/dQw4w9WgXcQ",
];

/* ─── Trending Hub–aligned UI primitives ─── */

function SearchInput({ value, onChange, placeholder, onClear, inputRef }) {
  return (
    <div className="relative flex-1 min-w-[120px] max-w-md group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
      </div>
      <input
        id="yt-url"
        ref={inputRef}
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-8 py-1.5 sm:pl-9 sm:pr-9 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-[10px] sm:text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50 dark:focus:border-blue-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function FilterRow({ children, className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 flex-wrap md:flex-nowrap w-full ${className}`}>
      {children}
    </div>
  );
}

function StatsBadge({ count, label, variant = "default" }) {
  const variants = {
    default: "bg-blue-50/80 text-blue-700 border-blue-200/60 dark:bg-blue-900/30 dark:text-white dark:border-blue-700/40",
    success: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/30 dark:text-white dark:border-emerald-700/40",
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${variants[variant]}`}>
      {variant === "success" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
      )}
      <span className="text-[11px]">{count}</span>
      <span className="opacity-80 font-medium uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function GlassPanel({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/40 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl overflow-hidden shadow-lg shadow-gray-200/20 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-black/40 ${className}`}>
      {children}
    </div>
  );
}

function extractVideoId(input) {
  if (!input || typeof input !== "string") return null;
  const t = input.trim();
  if (VIDEO_ID_REGEX.test(t)) return t;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m && VIDEO_ID_REGEX.test(m[1])) return m[1];
  }
  return null;
}

function fmt(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString("en-US");
}

function CopyBtn({ text, label = "Copied" }) {
  const [copied, setCopied] = useState(false);
  const t = useRef(null);
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; clearTimeout(t.current); }; }, []);
  if (!text) return null;
  const click = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      if (!m.current) return;
      setCopied(true); toast.success(label);
      t.current = setTimeout(() => { if (m.current) setCopied(false); }, 1500);
    } catch { toast.error("Copy failed"); }
  };
  return (
    <button
      type="button"
      onClick={click}
      className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-transparent hover:border-gray-200/80 dark:hover:border-gray-600/80 transition-all duration-300"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

function Pill({ children, tone = "gray", icon: Icon }) {
  const cls = {
    gray:    "bg-gray-100/90 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-gray-600",
    red:     "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-200/80 dark:border-red-800/50",
    amber:   "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50",
    blue:    "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/50",
    purple:  "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/50",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {Icon && <Icon size={9} />}{children}
    </span>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon size={12} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />}
      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{children}</span>
    </div>
  );
}

function KV({ label, value, mono = false, copy = false }) {
  if (value == null || value === "") return null;
  const text = String(value);
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-100/80 dark:border-gray-700/50 last:border-0">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-bold flex-shrink-0 pt-px w-24">{label}</span>
      <span className={`text-[11px] text-gray-800 dark:text-gray-100 flex-1 min-w-0 break-all ${mono ? "font-mono" : ""}`}>{text}</span>
      {copy && <CopyBtn text={text} label={`${label} copied`} />}
    </div>
  );
}

function MetaCell({ label, value, mono = false, copy = false }) {
  if (value == null || value === "") return null;
  const text = String(value);
  return (
    <div className="flex items-center justify-between gap-1 py-1.5 border-b border-gray-100/80 dark:border-gray-700/50 last:border-0">
      <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-bold flex-shrink-0 w-16 truncate">{label}</span>
      <span className={`text-[10px] text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate ${mono ? "font-mono" : ""}`}>{text}</span>
      {copy && <CopyBtn text={text} label={`${label} copied`} />}
    </div>
  );
}

function Avatar({ name, size = 28 }) {
  const ch = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-md shadow-blue-500/25"
    >
      {ch}
    </div>
  );
}

function EmptyState({ onExample }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center px-6 fade-in">
      <div className="w-24 h-24 bg-red-50/50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-500/10 border border-red-100/50 dark:border-red-800/30 ring-8 ring-red-50/20 dark:ring-red-900/10">
        <Youtube size={40} className="text-red-500 dark:text-red-400" />
      </div>
      <p className="text-2xl font-black tracking-tight text-gray-800 dark:text-gray-200 mb-2">YouTube Video Inspector</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
        Paste a <span className="text-blue-600 dark:text-blue-400 font-bold">URL</span>, Shorts link, or{" "}
        <span className="text-blue-600 dark:text-blue-400 font-bold">11-character video ID</span> above, then run Analyze.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => onExample(u)}
            className="text-[10px] font-mono text-blue-600 dark:text-blue-400 px-3 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/70 border border-blue-200/60 dark:border-blue-800/50 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 font-bold"
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnalyzeSkeleton() {
  const b = "animate-pulse rounded-xl bg-gray-200/90 dark:bg-gray-700/60";
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 fade-in">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full border-[4px] border-gray-200/50 dark:border-gray-800/50" />
        <div className="absolute inset-0 rounded-full border-[4px] border-blue-500 border-t-transparent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Fetching video metadata…</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">This can take a moment for some videos</p>
      </div>
      <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 mt-4 px-2">
        <div className="space-y-2">
          <div className={`aspect-video w-full ${b}`} />
          <div className={`h-10 w-full ${b}`} />
          <div className={`h-24 w-full ${b}`} />
        </div>
        <div className="space-y-2">
          <div className={`h-8 w-2/3 ${b}`} />
          <div className={`h-4 w-full ${b}`} />
          <div className={`h-32 w-full ${b}`} />
          <div className={`h-24 w-full ${b}`} />
        </div>
      </div>
    </div>
  );
}

export default function YouTubeVideoInspector() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const previewId = useMemo(() => extractVideoId(url), [url]);

  const fetchVideo = async (rawUrl) => {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed) { toast.error("Paste a YouTube URL first"); inputRef.current?.focus(); return; }
    if (!extractVideoId(trimmed)) { toast.error("Invalid YouTube URL"); inputRef.current?.focus(); return; }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setData(null);

    try {
      const { data: payload } = await api.post("/youtube/inspect", { url: trimmed }, { timeout: 90_000, signal: ctrl.signal });
      setData(payload);
    } catch (err) {
      if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      const msg = err?.response?.data?.message || err?.message || "Request failed";
      toast.error(msg);
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { toast.error("Clipboard is empty"); return; }
      setUrl(text.trim()); fetchVideo(text);
    } catch { toast.error("Could not read clipboard"); }
  };

  const handleClear = () => {
    abortRef.current?.abort(); abortRef.current = null;
    setUrl(""); setData(null); setLoading(false);
    inputRef.current?.focus();
  };

  const stats = useMemo(() => {
    if (!data) return null;
    return {
      views:    data.viewCountCompact    || fmt(data.viewCount),
      likes:    data.likeCountCompact    || fmt(data.likeCount),
      comments: data.commentCountCompact || fmt(data.commentCount),
      duration: data.lengthFormatted,
    };
  }, [data]);

  const badges = useMemo(() => {
    if (!data) return [];
    const b = [];
    if (data.isLive)            b.push({ key: "live",      tone: "red",    icon: Radio,      label: "Live" });
    if (data.isUpcoming)        b.push({ key: "upcoming",  tone: "blue",   icon: Calendar,   label: "Upcoming" });
    if (data.isPrivate)         b.push({ key: "private",   tone: "amber",  icon: ShieldAlert,label: "Private" });
    if (data.isUnlisted)        b.push({ key: "unlisted",  tone: "purple", icon: EyeOff,     label: "Unlisted" });
    if (data.isFamilySafe===false) b.push({ key: "nsfw",   tone: "amber",  icon: AlertCircle,label: "Not family safe" });
    if (data.category)          b.push({ key: "cat",       tone: "gray",   icon: null,       label: data.category });
    if (data.cached)            b.push({ key: "cached",    tone: "emerald",icon: Sparkles,   label: "Cached" });
    return b;
  }, [data]);

  return (
    <AdminLayout
      title="YouTube Video Inspector"
      titleInfo="Deep metadata, thumbnails & channel context for any public video"
      icon={Youtube}
      contentFit
    >
      <div className="flex flex-col h-full min-h-0 overflow-y-auto sm:overflow-hidden w-full max-w-[1600px] mx-auto custom-scrollbar px-3 pt-2 pb-4 gap-1.5">

        {/* Filter strip — Trending Hub style */}
        <div className="flex-shrink-0 p-1 z-30">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchVideo(url); }}
            className="flex flex-wrap lg:flex-nowrap items-end gap-1.5 w-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-1 p-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[22px] border border-gray-200/60 dark:border-gray-700/60 flex-grow min-w-0 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_15px_40px_-12px_rgba(0,0,0,0.4)]">
              <FilterRow className="items-end px-1 sm:px-2 py-1 flex-1 min-w-0">
                  <div className="hidden sm:flex flex-col gap-1 flex-1 min-w-[200px] relative">
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-600/80 dark:text-white ml-1.5 mb-0.5">
                      <Search size={11} /> Target
                    </span>
                    <SearchInput
                      inputRef={inputRef}
                      value={url}
                      onChange={setUrl}
                      onClear={() => setUrl("")}
                      placeholder="YouTube URL, Shorts link, or video ID…"
                    />
                  </div>
                  <div className="sm:hidden flex-1 w-full -mx-0.5 px-0.5">
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-600/80 dark:text-white mb-1">
                      <Search size={11} /> Target
                    </span>
                    <SearchInput
                      inputRef={inputRef}
                      value={url}
                      onChange={setUrl}
                      onClear={() => setUrl("")}
                      placeholder="URL or video ID…"
                    />
                  </div>
              </FilterRow>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white/60 dark:bg-gray-900/70 backdrop-blur-3xl rounded-[20px] border border-white/40 dark:border-gray-700/50 flex-shrink-0 self-end mb-0 lg:mb-0 shadow-[0_10px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all duration-300"
              >
                <ClipboardPaste size={14} />
                <span className="hidden sm:inline">Paste</span>
              </button>
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent opacity-80" />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black uppercase tracking-tight shadow-lg shadow-blue-500/25 disabled:opacity-60 transition-all duration-300 border border-white/10"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          </form>
        </div>

        {/* Optional hint row */}
        {previewId && !data && !loading && (
          <div className="flex-shrink-0 flex justify-center px-1">
            <StatsBadge count={previewId} label="detected id" variant="default" />
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col">
          {!loading && !data && <EmptyState onExample={(u) => { setUrl(u); fetchVideo(u); }} />}
          {loading && <AnalyzeSkeleton />}

          {data && !loading && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 h-full pb-4">

                <div className="flex flex-col gap-3 min-w-0">
                  <GlassPanel>
                    <div className="relative bg-black aspect-video group">
                      {data.thumbnails?.largest?.url ? (
                        <img src={data.thumbnails.largest.url} alt={data.title || "Video"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 min-h-[140px]">
                          <ImageIcon size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      {data.lengthFormatted && (
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                          {data.lengthFormatted}
                        </span>
                      )}
                      {data.watchUrl && (
                        <a
                          href={data.watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-transparent hover:bg-black/20 transition"
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-red-600 text-white rounded-full p-3 shadow-xl scale-90 group-hover:scale-100">
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                          </span>
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 border-t border-gray-100/80 dark:border-gray-700/50 bg-white/30 dark:bg-gray-900/20">
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-0.5">Thumbs</span>
                      {data.thumbnails?.highDefinition?.url && (
                        <a
                          href={data.thumbnails.highDefinition.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`HD — ${data.thumbnails.highDefinition.width}×${data.thumbnails.highDefinition.height}`}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/90 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-black hover:bg-blue-500 hover:text-white transition-all duration-300"
                        >
                          <ImageIcon size={10} /> HD
                        </a>
                      )}
                      {data.thumbnails?.standardDefinition?.url && (
                        <a
                          href={data.thumbnails.standardDefinition.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`SD — ${data.thumbnails.standardDefinition.width}×${data.thumbnails.standardDefinition.height}`}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-[9px] font-black hover:bg-gray-600 hover:text-white transition-all duration-300"
                        >
                          <ImageIcon size={10} /> SD
                        </a>
                      )}
                      {data.thumbnails?.all?.slice(0, 3).map((t, i) => (
                        <a
                          key={i}
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${t.width}×${t.height}`}
                          className="inline-flex items-center px-2 py-1 rounded-lg border border-gray-200/80 dark:border-gray-600 bg-white/60 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 text-[9px] font-mono hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                          {t.width}p
                        </a>
                      ))}
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {stats?.views && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/60 dark:border-blue-800/40">
                          <Eye size={12} className="text-blue-500" />
                          <span className="text-[11px] font-black text-blue-800 dark:text-blue-200">{stats.views}</span>
                        </div>
                      )}
                      {stats?.likes && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-50/80 dark:bg-pink-900/20 border border-pink-100/60 dark:border-pink-800/40">
                          <ThumbsUp size={12} className="text-pink-500" />
                          <span className="text-[11px] font-black text-pink-800 dark:text-pink-200">{stats.likes}</span>
                        </div>
                      )}
                      {stats?.comments && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100/60 dark:border-amber-800/40">
                          <MessageSquare size={12} className="text-amber-500" />
                          <span className="text-[11px] font-black text-amber-900 dark:text-amber-200">{stats.comments}</span>
                        </div>
                      )}
                      {stats?.duration && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100/60 dark:border-emerald-800/40">
                          <Clock size={12} className="text-emerald-600" />
                          <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-200">{stats.duration}</span>
                        </div>
                      )}
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-3">
                    <SectionLabel icon={User}>Channel</SectionLabel>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={data.channel?.name} size={32} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                          {data.channel?.name || "Unknown"}
                        </div>
                        {data.channel?.url && (
                          <a
                            href={data.channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                          >
                            Open channel <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <KV label="Channel ID" value={data.channel?.id} mono copy />
                    <KV label="User ID" value={data.channel?.userId} mono copy />
                  </GlassPanel>
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                  <GlassPanel className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug break-words flex-1 min-w-0 tracking-tight">
                        {data.title || "Untitled video"}
                      </h1>
                      <CopyBtn text={data.title} label="Title copied" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {badges.map((b) => (
                        <Pill key={b.key} tone={b.tone} icon={b.icon}>{b.label}</Pill>
                      ))}
                      {data.publishedAtFormatted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
                          <Calendar size={10} />
                          {data.publishedAtFormatted}
                        </span>
                      )}
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter size={12} className="text-blue-500 dark:text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Metadata</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <MetaCell label="Video ID" value={data.videoId} mono copy />
                      <MetaCell label="Published" value={data.publishedAtFormatted || data.publishedRaw} />
                      <MetaCell label="Category" value={data.category} />
                      <MetaCell label="Language" value={data.defaultLanguage} />
                      <MetaCell label="Audio lang" value={data.defaultAudioLanguage} />
                      <MetaCell label="Family safe" value={data.isFamilySafe == null ? null : data.isFamilySafe ? "Yes" : "No"} />
                    </div>
                  </GlassPanel>

                  {data.description && (
                    <GlassPanel className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <SectionLabel icon={Code2}>Description</SectionLabel>
                        <CopyBtn text={data.description} label="Description copied" />
                      </div>
                      <pre className="whitespace-pre-wrap text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed font-sans break-words max-h-40 overflow-y-auto custom-scrollbar rounded-lg bg-gray-50/50 dark:bg-gray-900/30 p-3 border border-gray-100/80 dark:border-gray-700/40">
                        {data.description}
                      </pre>
                    </GlassPanel>
                  )}

                  {Array.isArray(data.tags) && data.tags.length > 0 && (
                    <GlassPanel className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <SectionLabel icon={Tag}>Tags ({data.tags.length})</SectionLabel>
                        <CopyBtn text={data.tags.join(", ")} label="Tags copied" />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.tags.map((tag, i) => (
                          <span
                            key={`${tag}-${i}`}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 text-blue-800 dark:text-blue-200 border border-blue-100/80 dark:border-blue-800/40 shadow-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </GlassPanel>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
