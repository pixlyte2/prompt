import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Youtube, ExternalLink, Search, Copy, Check, Eye, ThumbsUp,
  MessageSquare, Clock, Calendar, Tag, User, Play, X, Image as ImageIcon,
  Code2, Sparkles, AlertCircle, Radio, ShieldAlert,
  EyeOff, ClipboardPaste,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const EXAMPLES = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/dQw4w9WgXcQ",
];

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
    <button type="button" onClick={click}
      className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}

function Pill({ children, tone = "gray", icon: Icon }) {
  const cls = {
    gray:    "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600",
    red:     "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800/50",
    amber:   "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
    blue:    "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
    purple:  "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {Icon && <Icon size={9} />}{children}
    </span>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      {Icon && <Icon size={12} className="text-gray-400 flex-shrink-0" />}
      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{children}</span>
    </div>
  );
}

function KV({ label, value, mono = false, copy = false }) {
  if (value == null || value === "") return null;
  const text = String(value);
  return (
    <div className="flex items-start justify-between gap-2 py-1 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold flex-shrink-0 pt-px w-24">{label}</span>
      <span className={`text-[11px] text-gray-800 dark:text-gray-100 flex-1 min-w-0 break-all ${mono ? "font-mono" : ""}`}>{text}</span>
      {copy && <CopyBtn text={text} label={`${label} copied`} />}
    </div>
  );
}

function MetaCell({ label, value, mono = false, copy = false }) {
  if (value == null || value === "") return null;
  const text = String(value);
  return (
    <div className="flex items-center justify-between gap-1 py-1 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold flex-shrink-0 w-16 truncate">{label}</span>
      <span className={`text-[10px] text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate ${mono ? "font-mono" : ""}`}>{text}</span>
      {copy && <CopyBtn text={text} label={`${label} copied`} />}
    </div>
  );
}

function Avatar({ name, size = 28 }) {
  const ch = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
      {ch}
    </div>
  );
}

function EmptyState({ onExample }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 flex items-center justify-center text-red-500 mb-3">
        <Youtube size={22} />
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-white">Inspect any YouTube video</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">Paste a URL, Shorts link, or 11-char video ID above.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((u) => (
          <button key={u} type="button" onClick={() => onExample(u)}
            className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40">
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  const b = "animate-pulse bg-gray-200 dark:bg-gray-700/60 rounded";
  return (
    <div className="grid grid-cols-[280px_1fr] gap-3 h-full">
      <div className="space-y-2">
        <div className={`aspect-video w-full ${b}`} />
        <div className={`h-3 w-3/4 ${b}`} />
        <div className={`h-3 w-1/2 ${b}`} />
        <div className={`h-16 ${b}`} />
        <div className={`h-16 ${b}`} />
      </div>
      <div className="space-y-2">
        <div className={`h-4 w-2/3 ${b}`} />
        <div className={`h-3 w-full ${b}`} />
        <div className={`h-3 w-5/6 ${b}`} />
        <div className={`h-24 ${b}`} />
        <div className={`h-24 ${b}`} />
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
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
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
    <AdminLayout title="YouTube Video Inspector" icon={Youtube} noPadding>
      <div className="flex flex-col h-full px-3 pt-3 pb-3 gap-2 min-h-0">

        {/* Search bar */}
        <form onSubmit={(e) => { e.preventDefault(); fetchVideo(url); }}
          className="flex gap-2 items-center buffer-card px-3 py-2 flex-shrink-0">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef} id="yt-url" type="text" autoComplete="off" spellCheck={false}
            className="flex-1 min-w-0 bg-transparent text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
            placeholder="Paste YouTube URL, Shorts link, or video ID…"
            value={url} onChange={(e) => setUrl(e.target.value)}
          />
          {url && (
            <button type="button" onClick={handleClear} className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <X size={13} />
            </button>
          )}
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <button type="button" onClick={handlePaste}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0">
            <ClipboardPaste size={12} /><span className="hidden sm:inline">Paste</span>
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60 flex-shrink-0 transition">
            {loading
              ? <div className="h-3 w-3 rounded-full border-2 border-blue-300 border-t-white animate-spin" />
              : <Sparkles size={12} />}
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </form>

        {/* Content area */}
        <div className="flex-1 min-h-0">
          {!loading && !data && <EmptyState onExample={(u) => { setUrl(u); fetchVideo(u); }} />}
          {loading && <Skeleton />}

          {data && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-2 h-full">

              {/* LEFT COLUMN — thumbnail + channel + links */}
              <div className="flex flex-col gap-2 min-w-0">

                {/* Thumbnail */}
                <div className="buffer-card overflow-hidden flex-shrink-0">
                  <div className="relative bg-black aspect-video">
                    {data.thumbnails?.largest?.url
                      ? <img src={data.thumbnails.largest.url} alt={data.title || "Video"} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={28} /></div>
                    }
                    {data.lengthFormatted && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                        {data.lengthFormatted}
                      </span>
                    )}
                    {data.watchUrl && (
                      <a href={data.watchUrl} target="_blank" rel="noreferrer"
                        className="absolute inset-0 flex items-center justify-center group bg-transparent hover:bg-black/25 transition">
                        <span className="opacity-0 group-hover:opacity-100 transition bg-red-600 text-white rounded-full p-2.5 shadow-lg">
                          <Play size={16} fill="currentColor" />
                        </span>
                      </a>
                    )}
                  </div>
                  {/* Thumbnail preview icons */}
                  <div className="flex items-center gap-1.5 px-2 py-1.5 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mr-0.5">Thumbnails</span>
                    {data.thumbnails?.highDefinition?.url && (
                      <a href={data.thumbnails.highDefinition.url} target="_blank" rel="noreferrer" title={`HD — ${data.thumbnails.highDefinition.width}×${data.thumbnails.highDefinition.height}`}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                        <ImageIcon size={9} />HD
                      </a>
                    )}
                    {data.thumbnails?.standardDefinition?.url && (
                      <a href={data.thumbnails.standardDefinition.url} target="_blank" rel="noreferrer" title={`SD — ${data.thumbnails.standardDefinition.width}×${data.thumbnails.standardDefinition.height}`}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 text-[9px] font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <ImageIcon size={9} />SD
                      </a>
                    )}
                    {data.thumbnails?.all?.slice(0, 3).map((t, i) => (
                      <a key={i} href={t.url} target="_blank" rel="noreferrer" title={`${t.width}×${t.height}`}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 text-[9px] font-mono hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        {t.width}p
                      </a>
                    ))}
                  </div>
                </div>

                {/* Stats under thumbnail — single row */}
                <div className="buffer-card px-2.5 py-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    {stats.views && (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Eye size={11} className="text-blue-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 truncate">{stats.views}</span>
                      </div>
                    )}
                    {stats.likes && (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <ThumbsUp size={11} className="text-pink-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-pink-700 dark:text-pink-300 truncate">{stats.likes}</span>
                      </div>
                    )}
                    {stats.comments && (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <MessageSquare size={11} className="text-amber-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate">{stats.comments}</span>
                      </div>
                    )}
                    {stats.duration && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock size={11} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{stats.duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Channel */}
                <div className="buffer-card p-2.5 flex-shrink-0">
                  <SectionLabel icon={User}>Channel</SectionLabel>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={data.channel?.name} size={28} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
                        {data.channel?.name || "Unknown"}
                      </div>
                      {data.channel?.url && (
                        <a href={data.channel.url} target="_blank" rel="noreferrer"
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">
                          Open channel <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                  <KV label="Channel ID" value={data.channel?.id} mono copy />
                  <KV label="User ID" value={data.channel?.userId} mono copy />
                </div>




              </div>

              {/* RIGHT COLUMN — title, stats, meta, description, tags, embed code */}
              <div className="flex flex-col gap-2 min-w-0 overflow-y-auto custom-scrollbar pr-0.5">

                {/* Title + badges */}
                <div className="buffer-card p-2.5 flex-shrink-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-snug break-words flex-1 min-w-0">
                      {data.title || "Untitled video"}
                    </h1>
                    <CopyBtn text={data.title} label="Title copied" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {badges.map((b) => <Pill key={b.key} tone={b.tone} icon={b.icon}>{b.label}</Pill>)}
                    {data.publishedAtFormatted && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                        <Calendar size={9} />{data.publishedAtFormatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="buffer-card p-2.5 flex-shrink-0">
                  <SectionLabel icon={Sparkles}>Metadata</SectionLabel>
                  <div className="grid grid-cols-2 gap-x-4">
                    <MetaCell label="Video ID"    value={data.videoId}   mono copy />
                    <MetaCell label="Published"   value={data.publishedAtFormatted || data.publishedRaw} />
                    <MetaCell label="Category"    value={data.category} />
                    <MetaCell label="Language"    value={data.defaultLanguage} />
                    <MetaCell label="Audio lang"  value={data.defaultAudioLanguage} />
                    <MetaCell label="Family safe" value={data.isFamilySafe == null ? null : data.isFamilySafe ? "Yes" : "No"} />
                  </div>
                </div>

                {/* Description */}
                {data.description && (
                  <div className="buffer-card p-2.5 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <SectionLabel icon={Code2}>Description</SectionLabel>
                      <CopyBtn text={data.description} label="Description copied" />
                    </div>
                    <pre className="whitespace-pre-wrap text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed font-sans break-words max-h-16 overflow-y-auto custom-scrollbar">
                      {data.description}
                    </pre>
                  </div>
                )}

                {/* Tags */}
                {Array.isArray(data.tags) && data.tags.length > 0 && (
                  <div className="buffer-card p-2.5 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <SectionLabel icon={Tag}>Tags ({data.tags.length})</SectionLabel>
                      <CopyBtn text={data.tags.join(", ")} label="Tags copied" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {data.tags.map((tag) => (
                        <span key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-800/40">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}



              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
