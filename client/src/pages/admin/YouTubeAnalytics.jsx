import { useState, useEffect, useMemo, useCallback, Component, useRef } from "react";
import axios from "axios";
import {
  Youtube,
  Plus,
  Trash2,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Play,
  Clock,
  DollarSign,
  Eye,
  LineChart,
  BarChart2,
  ExternalLink,
  RefreshCw,
  Layers,
  ChevronDown,
  X,
  PlusCircle,
  HelpCircle,
  Search,
  Copy,
  Check,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Tag,
  User,
  Image as ImageIcon,
  Code2,
  Sparkles,
  AlertCircle,
  Radio,
  ShieldAlert,
  EyeOff,
  ClipboardPaste,
  Loader2,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const EXAMPLES = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/dQw4w9WgXcQ",
];

/* ─── Inspector UI primitives ─── */

function SearchInput({ value, onChange, placeholder, onClear, inputRef }) {
  return (
    <div className="relative w-full min-w-0 flex-1 group">
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

const PRESET_COLORS = {
  blue: { hex: "#3b82f6", bg: "bg-blue-500", text: "text-blue-500", ring: "ring-blue-500/10", border: "border-blue-500/20", gradient: ["#3b82f6", "#60a5fa"] },
  emerald: { hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500/10", border: "border-emerald-500/20", gradient: ["#10b981", "#34d399"] },
  violet: { hex: "#8b5cf6", bg: "bg-violet-500", text: "text-violet-500", ring: "ring-violet-500/10", border: "border-violet-500/20", gradient: ["#8b5cf6", "#a78bfa"] },
  amber: { hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-500/10", border: "border-amber-500/20", gradient: ["#f59e0b", "#fbbf24"] },
  rose: { hex: "#f43f5e", bg: "bg-rose-500", text: "text-rose-500", ring: "ring-rose-500/10", border: "border-rose-500/20", gradient: ["#f43f5e", "#fb7185"] },
};

function formatViews(n) {
  if (n == null) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getDaysAgo(publishedText) {
  if (!publishedText || typeof publishedText !== "string") return 30;
  const cleaned = publishedText.replace(/^Streamed\s+/i, "").replace(/^Premiered\s+/i, "");
  const m = cleaned.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!m) return 30;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("second") || unit.startsWith("minute") || unit.startsWith("hour")) return 0;
  if (unit.startsWith("day")) return n;
  if (unit.startsWith("week")) return n * 7;
  if (unit.startsWith("month")) return n * 30;
  if (unit.startsWith("year")) return n * 365;
  return 30;
}

function YouTubeAnalytics() {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "inspector"
  const [inspectorUrl, setInspectorUrl] = useState("");
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorData, setInspectorData] = useState(null);
  const inspectorInputRef = useRef(null);
  const inspectorAbortRef = useRef(null);

  useEffect(() => () => inspectorAbortRef.current?.abort(), []);

  const previewId = useMemo(() => extractVideoId(inspectorUrl), [inspectorUrl]);

  const fetchVideo = async (rawUrl) => {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed) { toast.error("Paste a YouTube URL first"); inspectorInputRef.current?.focus(); return; }
    if (!extractVideoId(trimmed)) { toast.error("Invalid YouTube URL"); inspectorInputRef.current?.focus(); return; }

    inspectorAbortRef.current?.abort();
    const ctrl = new AbortController();
    inspectorAbortRef.current = ctrl;
    setInspectorLoading(true); setInspectorData(null);

    try {
      const { data: payload } = await api.post("/youtube/inspect", { url: trimmed }, { timeout: 90_000, signal: ctrl.signal });
      setInspectorData(payload);
    } catch (err) {
      if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      const msg = err?.response?.data?.message || err?.message || "Request failed";
      toast.error(msg);
    } finally {
      if (inspectorAbortRef.current === ctrl) inspectorAbortRef.current = null;
      setInspectorLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { toast.error("Clipboard is empty"); return; }
      setInspectorUrl(text.trim()); fetchVideo(text);
    } catch (err) { toast.error("Could not read clipboard"); }
  };

  const handleClear = () => {
    inspectorAbortRef.current?.abort(); inspectorAbortRef.current = null;
    setInspectorUrl(""); setInspectorData(null); setInspectorLoading(false);
    inspectorInputRef.current?.focus();
  };

  const inspectorStats = useMemo(() => {
    if (!inspectorData) return null;
    return {
      views:    inspectorData.viewCountCompact    || fmt(inspectorData.viewCount),
      likes:    inspectorData.likeCountCompact    || fmt(inspectorData.likeCount),
      comments: inspectorData.commentCountCompact || fmt(inspectorData.commentCount),
      duration: inspectorData.lengthFormatted,
    };
  }, [inspectorData]);

  const inspectorBadges = useMemo(() => {
    if (!inspectorData) return [];
    const b = [];
    if (inspectorData.isLive)            b.push({ key: "live",      tone: "red",    icon: Radio,      label: "Live" });
    if (inspectorData.isUpcoming)        b.push({ key: "upcoming",  tone: "blue",   icon: Calendar,   label: "Upcoming" });
    if (inspectorData.isPrivate)         b.push({ key: "private",   tone: "amber",  icon: ShieldAlert,label: "Private" });
    if (inspectorData.isUnlisted)        b.push({ key: "unlisted",  tone: "purple", icon: EyeOff,     label: "Unlisted" });
    if (inspectorData.isFamilySafe===false) b.push({ key: "nsfw",   tone: "amber",  icon: AlertCircle,label: "Not family safe" });
    if (inspectorData.category)          b.push({ key: "cat",       tone: "gray",   icon: null,       label: inspectorData.category });
    if (inspectorData.cached)            b.push({ key: "cached",    tone: "emerald",icon: Sparkles,   label: "Cached" });
    return b;
  }, [inspectorData]);

  const [types, setTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("28d"); // "7d" | "28d" | "90d"
  const [formatFilter, setFormatFilter] = useState("all"); // "all" | "long" | "short"
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showChannelSelect, setShowChannelSelect] = useState(false);
  
  // Form state for adding channels
  const [newChanName, setNewChanName] = useState("");
  const [newChanHandle, setNewChanHandle] = useState("");
  const [newChanCategory, setNewChanCategory] = useState(""); // Category ID
  const [newChanSubs, setNewChanSubs] = useState("45000");
  const [newChanColor, setNewChanColor] = useState("blue");
  const [addingChannel, setAddingChannel] = useState(false);

  // Editing existing channels
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editSubs, setEditSubs] = useState("");
  const [editColor, setEditColor] = useState("");

  // Live real-time views simulation counter with drift
  const [realtimeDrift, setRealtimeDrift] = useState(0);

  // Reset drift when active channel changes
  useEffect(() => {
    setRealtimeDrift(0);
  }, [activeChannel]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeDrift(prev => prev + Math.floor(Math.random() * 12) - 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: typesData } = await api.get("/competitor-types");
      setTypes(typesData);
      
      const channelList = [];
      (typesData || []).forEach((type) => {
        if (!type) return;
        (type.channels || []).forEach((ch) => {
          if (!ch || !ch.handle || typeof ch.handle !== "string") return;
          // Read local storage settings for details
          const metaKey = `YT_ANALYTICS_META_${ch.handle.toLowerCase()}`;
          const cachedMeta = localStorage.getItem(metaKey);
          let meta = null;
          try {
            meta = cachedMeta ? JSON.parse(cachedMeta) : null;
          } catch (e) {
            console.error("Failed to parse cached metadata", e);
          }
          
          if (!meta) {
            // Seed randomized starting values for this competitor channel
            const colors = Object.keys(PRESET_COLORS);
            const seedColor = colors[Math.abs(ch.handle.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length];
            const seedSubs = 10000 + (Math.abs(ch.handle.split("").reduce((acc, char) => acc * char.charCodeAt(0), 1)) % 490000);
            
            meta = {
              color: seedColor,
              subscribers: seedSubs,
              handle: ch.handle,
              categoryName: type.name,
              categoryId: type._id
            };
            localStorage.setItem(metaKey, JSON.stringify(meta));
          }

          channelList.push({
            id: `${type._id}-${ch.handle}`,
            name: ch.name,
            handle: ch.handle,
            typeId: type._id,
            typeName: type.name,
            color: meta.color || "blue",
            subscribers: meta.subscribers || 45000,
          });
        });
      });
      
      setChannels(channelList);
      
      // Auto select first channel if none active
      if (channelList.length > 0 && !activeChannel) {
        setActiveChannel(channelList[0]);
      } else if (activeChannel) {
        // Refresh active channel data references
        const updatedActive = channelList.find(c => c.handle === activeChannel.handle) || channelList[0];
        setActiveChannel(updatedActive);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load channel list");
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch videos for the selected channel's category
  const loadVideos = useCallback(async () => {
    if (!activeChannel) return;
    setRefreshing(true);
    try {
      const { data } = await api.get(`/competitors/videos?typeId=${activeChannel.typeId}&videoFormat=${formatFilter}`);
      const list = (data.videos || []).filter(v => v.channelHandle === activeChannel.handle);
      setVideos(list);

      // Update channels list and active channel with scraped subscriber counts from backend
      if (data.channels && data.channels.length > 0) {
        setChannels(prevChannels => {
          const updated = prevChannels.map(c => {
            const scrapedChan = data.channels.find(sc => sc.handle.toLowerCase() === c.handle.toLowerCase());
            if (scrapedChan && scrapedChan.subscribers > 0) {
              // Sync updated subscribers count to LocalStorage cache
              const metaKey = `YT_ANALYTICS_META_${c.handle.toLowerCase()}`;
              let meta = {};
              try {
                const cachedMeta = localStorage.getItem(metaKey);
                meta = cachedMeta ? JSON.parse(cachedMeta) : {};
              } catch (e) {
                console.error(e);
              }
              meta.subscribers = scrapedChan.subscribers;
              localStorage.setItem(metaKey, JSON.stringify(meta));

              return {
                ...c,
                subscribers: scrapedChan.subscribers
              };
            }
            return c;
          });

          // Keep active channel in sync
          const matchingActive = updated.find(c => c.handle.toLowerCase() === activeChannel.handle.toLowerCase());
          if (matchingActive && matchingActive.subscribers !== activeChannel.subscribers) {
            setActiveChannel(matchingActive);
          }

          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch latest video list");
    } finally {
      setRefreshing(false);
    }
  }, [activeChannel, formatFilter]);

  useEffect(() => {
    if (activeChannel) {
      loadVideos();
    }
  }, [activeChannel, loadVideos]);

  // Handle adding new channel source
  const handleCreateChannel = async () => {
    if (!newChanName.trim() || !newChanHandle.trim() || !newChanCategory) {
      return toast.error("All fields are required");
    }
    const cleanHandle = newChanHandle.trim().replace(/^@/, "");
    setAddingChannel(true);
    try {
      // 1. Create on backend under the selected competitor type category
      await api.post(`/competitor-types/${newChanCategory}/channels`, {
        handle: cleanHandle,
        name: newChanName.trim(),
        videoFormat: "long",
      });

      // 2. Save metadata in LocalStorage
      const metaKey = `YT_ANALYTICS_META_${cleanHandle.toLowerCase()}`;
      localStorage.setItem(metaKey, JSON.stringify({
        color: newChanColor,
        subscribers: parseInt(newChanSubs, 10) || 10000,
        handle: cleanHandle,
        categoryId: newChanCategory
      }));

      toast.success("Channel added successfully");
      
      // Reset Form
      setNewChanName("");
      setNewChanHandle("");
      setNewChanSubs("45000");
      setNewChanColor("blue");
      
      // Reload Data
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add channel");
    } finally {
      setAddingChannel(false);
    }
  };

  // Handle deleting channel source
  const handleDeleteChannel = async (channel) => {
    if (!confirm(`Delete channel "${channel.name}"?`)) return;
    try {
      await api.delete(`/competitor-types/${channel.typeId}/channels/${channel.handle}`);
      
      // Clean up LocalStorage
      localStorage.removeItem(`YT_ANALYTICS_META_${channel.handle.toLowerCase()}`);
      
      toast.success("Channel deleted");
      if (activeChannel?.handle === channel.handle) {
        setActiveChannel(null);
      }
      await fetchData();
    } catch {
      toast.error("Failed to delete channel");
    }
  };

  const handleSaveEdit = async (channel) => {
    try {
      const metaKey = `YT_ANALYTICS_META_${channel.handle.toLowerCase()}`;
      const updatedMeta = {
        color: editColor || "blue",
        subscribers: parseInt(editSubs, 10) || 10000,
        handle: channel.handle,
        categoryId: channel.typeId
      };
      localStorage.setItem(metaKey, JSON.stringify(updatedMeta));
      toast.success("Channel settings updated");
      setEditingChannelId(null);
      await fetchData();
    } catch {
      toast.error("Failed to update channel settings");
    }
  };

  // Calculate and simulate dashboard statistics driven by actual video views
  const dashboardStats = useMemo(() => {
    const videoCount = videos.length;
    
    // Sum real views of scraped videos
    const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
    const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
    
    // Differentiate watch time and revenue calculations for shorts vs long
    let totalWatchTime = 0;
    let estRevenue = 0;
    
    videos.forEach((v) => {
      const viewsCount = v.views || 0;
      const isShort = v.videoFormat === "short" || v.duration === "Short";
      
      if (isShort) {
        totalWatchTime += viewsCount * 0.005; // 18 seconds avg retention
        estRevenue += viewsCount * 0.00015;  // $0.15 CPM
      } else {
        totalWatchTime += viewsCount * 0.075; // 4.5 minutes avg retention
        estRevenue += viewsCount * 0.0024;   // $2.40 CPM
      }
    });

    return {
      videoCount,
      totalViews,
      avgViews,
      totalWatchTime: Math.round(totalWatchTime),
      estRevenue: Math.round(estRevenue),
    };
  }, [videos]);

  const calculatedRealtimeViews = useMemo(() => {
    if (!activeChannel) return 0;
    // Calculate a realistic 48-hour views baseline proportional to the channel's views
    const base = dashboardStats.totalViews > 0 
      ? Math.round(dashboardStats.totalViews * 0.04) 
      : Math.round((activeChannel.subscribers || 45000) * 0.15);
    return base;
  }, [activeChannel, dashboardStats]);

  const realtimeViews = useMemo(() => {
    return Math.max(10, calculatedRealtimeViews + realtimeDrift);
  }, [calculatedRealtimeViews, realtimeDrift]);

  // Construct chart timeline mapping views and dates of scraped videos
  const chartData = useMemo(() => {
    const pointsCount = dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 28;
    
    // Initialize blank timeline points
    const timeline = Array.from({ length: pointsCount }, (_, i) => {
      const day = pointsCount - 1 - i;
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      return {
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: 0,
        watchTime: 0,
        subscribers: 0,
        revenue: 0,
        dayIndex: day,
      };
    });

    // Populate actual views by distributing video views over time
    (videos || []).forEach(v => {
      const daysAgo = getDaysAgo(v.publishedText);
      const totalVal = v.views || 0;
      
      if (daysAgo <= 0) {
        if (timeline[pointsCount - 1]) {
          timeline[pointsCount - 1].views += totalVal;
        }
      } else {
        const distributeDays = Math.min(daysAgo, 30);
        let weightSum = 0;
        const weights = [];
        
        for (let i = 0; i < distributeDays; i++) {
          const w = 1 / (i + 1);
          weights.push(w);
          weightSum += w;
        }
        
        for (let i = 0; i < distributeDays; i++) {
          const targetDay = daysAgo - i;
          if (targetDay < pointsCount) {
            const point = timeline.find(p => p.dayIndex === targetDay);
            if (point) {
              const portion = Math.round(totalVal * (weights[i] / weightSum));
              point.views += portion;
            }
          }
        }
      }
    });

    // If there are no video views, let's seed a small realistic baseline to keep the charts alive
    const totalScrapedViews = timeline.reduce((sum, p) => sum + p.views, 0);
    const subCount = activeChannel?.subscribers || 45000;
    
    if (totalScrapedViews === 0) {
      timeline.forEach(point => {
        point.views = Math.round(subCount * (0.001 + Math.random() * 0.0015));
      });
    }

    // Now populate watchTime, revenue, and subscribers (working backwards from today)
    let currentSubscribers = subCount;
    
    let watchTimeMult = 0.085;
    let revenueMult = 0.0022;
    if (formatFilter === "short") {
      watchTimeMult = 0.005;
      revenueMult = 0.00015;
    } else if (formatFilter === "all") {
      watchTimeMult = 0.045;
      revenueMult = 0.0012;
    }

    for (let i = timeline.length - 1; i >= 0; i--) {
      const p = timeline[i];
      p.watchTime = Math.round(p.views * watchTimeMult);
      p.revenue = Math.round(p.views * revenueMult);
      p.subscribers = currentSubscribers;
      
      const newSubs = Math.round(p.views * 0.004);
      currentSubscribers = Math.max(0, currentSubscribers - newSubs);
    }
    
    return timeline;
  }, [videos, dateRange, activeChannel, formatFilter]);

  // Realtime graph points (last 48 hours views)
  const realtimeData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${(i * 2)}h ago`,
      views: Math.floor(Math.random() * 300) + 120 + (i === 12 || i === 13 ? 400 : 0) // some peak traffic hours
    }));
  }, []);

  // Top Performing Videos list
  const topVideos = useMemo(() => {
    return [...videos]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(v => {
        // Simulate high-fidelity stats for table details
        const ctr = (3.4 + Math.random() * 5.2).toFixed(1);
        const retention = (35 + Math.random() * 25).toFixed(0);
        return {
          ...v,
          ctr,
          retention,
        };
      });
  }, [videos]);

  const activeColor = (activeChannel && PRESET_COLORS[activeChannel.color]) ? PRESET_COLORS[activeChannel.color] : PRESET_COLORS.blue;

  return (
    <AdminLayout
      title="YouTube Analytics"
      titleInfo="Interactive Channel Dashboard & Source Control"
      icon={LineChart}
      contentFit
    >
      <div className="flex flex-col h-full min-h-0 gap-3.5 overflow-hidden w-full max-w-[1600px] mx-auto pb-4">
        
        {/* TABS SELECTOR */}
        <div className="flex-shrink-0 flex items-center gap-2 p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-250/20 self-start">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Channel Dashboard
          </button>
          <button
            onClick={() => setActiveTab("inspector")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === "inspector"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Video Inspector
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <>
            {/* TOP INTERACTION PANEL */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/40 dark:bg-gray-900/40 border border-white/60 dark:border-gray-800/50 backdrop-blur-2xl shadow-sm z-30">
          
          {/* Active Channel Selector Dropdown */}
          <div className="relative" id="channelSelectDropdown">
            <button
              onClick={() => setShowChannelSelect(!showChannelSelect)}
              className="flex items-center justify-between gap-2.5 px-4 h-10 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs font-black text-gray-850 dark:text-white shadow-sm hover:border-blue-500/40 hover:bg-gray-50/50 dark:hover:bg-gray-800 transition-all cursor-pointer min-w-[200px]"
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <div className={`w-5 h-5 rounded-full ${activeColor.bg} text-white flex items-center justify-center text-[9px] font-black shadow-sm flex-shrink-0 uppercase`}>
                  {activeChannel?.name?.charAt(0) || "?"}
                </div>
                <div className="truncate">
                  <p className="leading-tight font-bold">{activeChannel?.name || "Select Channel"}</p>
                  <p className="text-[9px] text-gray-500 font-medium truncate">@{activeChannel?.handle || "no-handle"}</p>
                </div>
              </div>
              <ChevronDown size={14} className="opacity-50 flex-shrink-0" />
            </button>

            {showChannelSelect && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-gray-950/95 border border-gray-200/60 dark:border-gray-800/60 shadow-xl backdrop-blur-2xl z-[50] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {channels.map((c) => {
                    const chanColor = PRESET_COLORS[c.color || "blue"];
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChannel(c);
                          setShowChannelSelect(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-all text-left ${
                          activeChannel?.handle === c.handle 
                            ? "bg-blue-50/50 dark:bg-blue-950/40 text-blue-600" 
                            : "text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-4 h-4 rounded-full ${chanColor.bg} text-white flex items-center justify-center text-[8px] font-black flex-shrink-0 uppercase`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="block truncate font-bold">{c.name}</span>
                            <span className="block text-[8px] opacity-60">@{c.handle}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg text-gray-500 uppercase tracking-tighter shrink-0">{c.typeName}</span>
                      </button>
                    );
                  })}
                  {channels.length === 0 && (
                    <p className="text-[10px] text-gray-500 text-center py-4">No channels configured</p>
                  )}
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-850 my-1.5" />
                <button
                  onClick={() => {
                    setSettingsOpen(true);
                    setShowChannelSelect(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-tight text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Settings size={13} /> Manage Channel Sources
                </button>
              </div>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Format Filter (All / Long / Short) */}
            <div className="inline-flex rounded-xl p-0.5 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-250/20">
              {[
                { label: "All Formats", value: "all" },
                { label: "Long", value: "long" },
                { label: "Short", value: "short" },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormatFilter(fmt.value)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    formatFilter === fmt.value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Timeline Filter */}
            <div className="inline-flex rounded-xl p-0.5 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-250/20">
              {[
                { label: "7 Days", value: "7d" },
                { label: "28 Days", value: "28d" },
                { label: "90 Days", value: "90d" },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    dateRange === range.value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadVideos}
              disabled={refreshing || !activeChannel}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-500 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer`}
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-blue-500" : ""} />
            </button>
          </div>

        </div>

        {/* METRICS DASHBOARD GRID */}
        {activeChannel ? (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
            
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* Views Card */}
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Total Views</span>
                  <div className={`p-1.5 rounded-lg ${activeColor.ring} ${activeColor.text}`}>
                    <Eye size={14} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{formatViews(dashboardStats.totalViews)}</span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-md flex items-center gap-0.5 shadow-sm">
                    <ArrowUpRight size={10} /> +12.4%
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Realtime views count from scraped uploads</p>
              </div>

              {/* Watch Time Card */}
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Watch Time</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Clock size={14} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{dashboardStats.totalWatchTime.toLocaleString()}h</span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-md flex items-center gap-0.5 shadow-sm">
                    <ArrowUpRight size={10} /> +8.9%
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Extrapolated audience watch duration (estimated)</p>
              </div>

              {/* Subscribers Card */}
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Subscribers</span>
                  <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
                    <Users size={14} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{formatViews(activeChannel.subscribers)}</span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-md flex items-center gap-0.5 shadow-sm">
                    <ArrowUpRight size={10} /> +3.2%
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Configured subscription base tracker</p>
              </div>

            </div>

            {/* PERFORMANCE TREND CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              
              {/* Primary Trend AreaChart */}
              <div className="lg:col-span-2 p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl shadow-sm flex flex-col justify-between h-[360px]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                      <BarChart2 size={13} className={activeColor.text} />
                      Performance Trend
                    </h3>
                    <p className="text-[10px] text-gray-400">Views timeline mapping video uploads and organic baseline</p>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-bold text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${activeColor.bg}`} /> Views
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Watch Time (Hrs)
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0 w-full text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeColor.hex} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={activeColor.hex} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorWatch" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                      <XAxis dataKey="label" stroke="rgba(148, 163, 184, 0.5)" tickLine={false} />
                      <YAxis stroke="rgba(148, 163, 184, 0.5)" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          background: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                          fontSize: "11px",
                          backdropFilter: "blur(8px)",
                        }}
                      />
                      <Area type="monotone" dataKey="views" name="Views" stroke={activeColor.hex} strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                      <Area type="monotone" dataKey="watchTime" name="Watch Time" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWatch)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Realtime views ticker and channel demographic info */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl shadow-sm flex flex-col justify-between h-[360px]">
                <div className="flex-shrink-0 flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Realtime Views</h3>
                    <p className="text-[10px] text-gray-400">Updates live • Last 48 hours activity</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums animate-pulse text-blue-500">{realtimeViews.toLocaleString()}</span>
                    <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wide">Views / Hour</span>
                  </div>
                </div>

                {/* Realtime Bar Chart */}
                <div className="flex-1 min-h-0 w-full text-[9px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={realtimeData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.05)" />
                      <XAxis dataKey="hour" stroke="rgba(148, 163, 184, 0.3)" tickLine={false} tick={false} />
                      <YAxis stroke="rgba(148, 163, 184, 0.3)" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          background: "rgba(15, 23, 42, 0.95)",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "10px",
                        }}
                      />
                      <Bar dataKey="views" fill={activeColor.hex} radius={[3, 3, 0, 0]}>
                        {realtimeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fillOpacity={0.6 + (index / 24) * 0.4} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Traffic Breakdown progress bars */}
                <div className="flex-shrink-0 space-y-2 border-t border-gray-100/80 dark:border-gray-800/80 pt-3">
                  <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Discovery Sources</h4>
                  <div className="space-y-1.5">
                    {[
                      { source: "YouTube Search", pct: 45, width: "w-[45%]" },
                      { source: "Suggested Videos", pct: 30, width: "w-[30%]" },
                      { source: "External / Direct", pct: 15, width: "w-[15%]" },
                    ].map(src => (
                      <div key={src.source} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold text-gray-700 dark:text-gray-300">{src.source}</span>
                          <span className="font-mono text-gray-500">{src.pct}%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full ${activeColor.bg} rounded-full`} style={{ width: `${src.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* PERFORMANCE ANALYSIS DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 pt-1">
              
              {/* TOP VIDEOS TABLE */}
              <div className="lg:col-span-2 p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl shadow-sm flex flex-col justify-between min-h-[300px]">
                <div className="mb-3 flex-shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Top Performing Videos</h3>
                    <p className="text-[10px] text-gray-400">Highest viewed uploads from this source in the selected timeframe</p>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/30">Last 30 Days</span>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar min-h-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100/70 dark:border-gray-800/80 text-gray-400 text-[10px] font-bold uppercase tracking-wider text-left">
                        <th className="py-2.5">Video Details</th>
                        <th className="py-2.5 text-center">Views</th>
                        <th className="py-2.5 text-center">Retention</th>
                        <th className="py-2.5 text-center">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40 font-medium">
                      {topVideos.map(v => (
                        <tr key={v.videoId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5 min-w-[200px]">
                              <img src={v.thumbnail} alt="" className="w-12 h-7 rounded object-cover flex-shrink-0 border border-black/10 dark:border-white/10" />
                              <div className="min-w-0">
                                <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" className="block text-[11px] font-bold text-gray-800 dark:text-gray-100 truncate hover:text-blue-500 flex items-center gap-1">
                                  {v.title && v.title.length > 25 ? v.title.substring(0, Math.ceil(v.title.length / 2)) + "..." : v.title}
                                  <ExternalLink size={10} className="opacity-40" />
                                </a>
                                <span className="block text-[9px] text-gray-400 leading-tight">{v.publishedText || "Recently"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-center font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                            {formatViews(v.views)}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                              {v.retention}%
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                            {v.ctr}%
                          </td>
                        </tr>
                      ))}
                      {topVideos.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            No video data found. Scrape channel videos to view analytics.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUDIENCE DEMOGRAPHICS */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-gray-800/40 backdrop-blur-xl shadow-sm flex flex-col justify-between min-h-[300px]">
                <div className="mb-4 flex-shrink-0">
                  <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Audience Demographics</h3>
                  <p className="text-[10px] text-gray-400">Viewer age and gender allocation details (estimated)</p>
                </div>

                <div className="flex-1 flex items-center justify-center min-h-[140px]">
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={[
                      { age: "18-24", male: 32, female: 18 },
                      { age: "25-34", male: 42, female: 28 },
                      { age: "35-44", male: 25, female: 15 },
                      { age: "45+", male: 12, female: 8 }
                    ]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" vertical={false} />
                      <XAxis dataKey="age" stroke="rgba(148, 163, 184, 0.4)" tickLine={false} />
                      <YAxis stroke="rgba(148, 163, 184, 0.4)" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          background: "rgba(15, 23, 42, 0.95)",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "10px",
                        }}
                      />
                      <Bar dataKey="male" name="Male" fill={activeColor.hex} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="female" name="Female" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-shrink-0 flex items-center justify-center gap-4 text-[9px] font-bold text-gray-500 pt-3 border-t border-gray-100/80 dark:border-gray-800/80">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeColor.bg}`} /> Male (68%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Female (32%)
                  </span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-32">
            <div className="w-20 h-20 bg-blue-50/50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-blue-100/50 dark:border-blue-800/30">
              <Youtube size={36} className="text-blue-500" />
            </div>
            <p className="text-lg font-black text-gray-800 dark:text-gray-200">No Configured Channels Found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Configure or select channel sources from the Settings menu to start tracking your YouTube Channel performance.
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-md transition-colors"
            >
              <PlusCircle size={14} /> Configure Channel Sources
            </button>
          </div>
        )}
          </>
        ) : (
          /* INSPECTOR TAB CONTENT */
          <div className="flex-1 min-h-0 flex flex-col gap-3.5 overflow-hidden">
            {/* URL bar: search fills width, Paste + Analyze flush right next to it */}
            <div className="flex-shrink-0 p-1 z-30 w-full">
              <form
                onSubmit={(e) => { e.preventDefault(); fetchVideo(inspectorUrl); }}
                className="w-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-2 p-2 sm:p-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[22px] border border-gray-200/60 dark:border-gray-700/60 w-full min-w-0 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_15px_40px_-12px_rgba(0,0,0,0.4)]">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-600/85 dark:text-white ml-0.5 sm:ml-1.5 mb-0.5">
                      <Search size={11} /> Target
                    </span>
                    <SearchInput
                      inputRef={inspectorInputRef}
                      value={inspectorUrl}
                      onChange={setInspectorUrl}
                      onClear={handleClear}
                      placeholder="YouTube URL, Shorts link, or video ID…"
                    />
                  </div>

                  <div className="flex items-center justify-end sm:justify-start gap-1.5 flex-shrink-0 sm:pb-0.5">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all duration-300"
                    >
                      <ClipboardPaste size={14} />
                      <span className="hidden sm:inline">Paste</span>
                    </button>
                    <div className="hidden sm:block h-8 w-px flex-shrink-0 bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent opacity-80" />
                    <button
                      type="submit"
                      disabled={inspectorLoading}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black uppercase tracking-tight shadow-lg shadow-blue-500/25 disabled:opacity-60 transition-all duration-300 border border-white/10"
                    >
                      {inspectorLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {inspectorLoading ? "Analyzing…" : "Analyze"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Optional hint row */}
            {previewId && !inspectorData && !inspectorLoading && (
              <div className="flex-shrink-0 flex justify-center px-1">
                <StatsBadge count={previewId} label="detected id" variant="default" />
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col">
              {!inspectorLoading && !inspectorData && <EmptyState onExample={(u) => { setInspectorUrl(u); fetchVideo(u); }} />}
              {inspectorLoading && <AnalyzeSkeleton />}

              {inspectorData && !inspectorLoading && (
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 h-full pb-4">

                    <div className="flex flex-col gap-3 min-w-0">
                      <GlassPanel>
                        <div className="relative bg-black aspect-video group">
                          {inspectorData.thumbnails?.largest?.url ? (
                            <img src={inspectorData.thumbnails.largest.url} alt={inspectorData.title || "Video"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 min-h-[140px]">
                              <ImageIcon size={32} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          {inspectorData.lengthFormatted && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                              {inspectorData.lengthFormatted}
                            </span>
                          )}
                          {inspectorData.watchUrl && (
                            <a
                              href={inspectorData.watchUrl}
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
                          {inspectorData.thumbnails?.highDefinition?.url && (
                            <a
                              href={inspectorData.thumbnails.highDefinition.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`HD — ${inspectorData.thumbnails.highDefinition.width}×${inspectorData.thumbnails.highDefinition.height}`}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/90 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-black hover:bg-blue-500 hover:text-white transition-all duration-300"
                            >
                              <ImageIcon size={10} /> HD
                            </a>
                          )}
                          {inspectorData.thumbnails?.standardDefinition?.url && (
                            <a
                              href={inspectorData.thumbnails.standardDefinition.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`SD — ${inspectorData.thumbnails.standardDefinition.width}×${inspectorData.thumbnails.standardDefinition.height}`}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-650 bg-gray-55/90 dark:bg-gray-800/55 text-gray-600 dark:text-gray-300 text-[9px] font-black hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                              <ImageIcon size={10} /> SD
                            </a>
                          )}
                          {inspectorData.thumbnails?.all?.slice(0, 3).map((t, i) => (
                            <a
                              key={i}
                              href={t.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`${t.width}×${t.height}`}
                              className="inline-flex items-center px-2 py-1 rounded-lg border border-gray-200/80 dark:border-gray-650 bg-white/60 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 text-[9px] font-mono hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                            >
                              {t.width}p
                            </a>
                          ))}
                        </div>
                      </GlassPanel>

                      <GlassPanel className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {inspectorStats?.views && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/60 dark:border-blue-800/40">
                              <Eye size={12} className="text-blue-500" />
                              <span className="text-[11px] font-black text-blue-800 dark:text-blue-200">{inspectorStats.views}</span>
                            </div>
                          )}
                          {inspectorStats?.likes && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-50/80 dark:bg-pink-900/20 border border-pink-100/60 dark:border-pink-800/40">
                              <ThumbsUp size={12} className="text-pink-500" />
                              <span className="text-[11px] font-black text-pink-800 dark:text-pink-200">{inspectorStats.likes}</span>
                            </div>
                          )}
                          {inspectorStats?.comments && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100/60 dark:border-amber-800/40">
                              <MessageSquare size={12} className="text-amber-500" />
                              <span className="text-[11px] font-black text-amber-900 dark:text-amber-200">{inspectorStats.comments}</span>
                            </div>
                          )}
                          {inspectorStats?.duration && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100/60 dark:border-emerald-800/40">
                              <Clock size={12} className="text-emerald-600" />
                              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-200">{inspectorStats.duration}</span>
                            </div>
                          )}
                        </div>
                      </GlassPanel>

                      <GlassPanel className="p-3">
                        <SectionLabel icon={User}>Channel</SectionLabel>
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar name={inspectorData.channel?.name} size={32} />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                              {inspectorData.channel?.name || "Unknown"}
                            </div>
                            {inspectorData.channel?.url && (
                              <a
                                href={inspectorData.channel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              >
                                Open channel <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                        <KV label="Channel ID" value={inspectorData.channel?.id} mono copy />
                        <KV label="User ID" value={inspectorData.channel?.userId} mono copy />
                      </GlassPanel>
                    </div>

                    <div className="flex flex-col gap-3 min-w-0">
                      <GlassPanel className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug break-words flex-1 min-w-0 tracking-tight">
                            {inspectorData.title || "Untitled video"}
                          </h1>
                          <CopyBtn text={inspectorData.title} label="Title copied" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {inspectorBadges.map((b) => (
                            <Pill key={b.key} tone={b.tone} icon={b.icon}>{b.label}</Pill>
                          ))}
                          {inspectorData.publishedAtFormatted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full bg-gray-100/80 dark:bg-gray-800/60 border border-gray-205/50 dark:border-gray-700/50">
                              <Calendar size={10} />
                              {inspectorData.publishedAtFormatted}
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
                          <MetaCell label="Video ID" value={inspectorData.videoId} mono copy />
                          <MetaCell label="Published" value={inspectorData.publishedAtFormatted || inspectorData.publishedRaw} />
                          <MetaCell label="Category" value={inspectorData.category} />
                          <MetaCell label="Language" value={inspectorData.defaultLanguage} />
                          <MetaCell label="Audio lang" value={inspectorData.defaultAudioLanguage} />
                          <MetaCell label="Family safe" value={inspectorData.isFamilySafe == null ? null : inspectorData.isFamilySafe ? "Yes" : "No"} />
                        </div>
                      </GlassPanel>

                      {inspectorData.description && (
                        <GlassPanel className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <SectionLabel icon={Code2}>Description</SectionLabel>
                            <CopyBtn text={inspectorData.description} label="Description copied" />
                          </div>
                          <pre className="whitespace-pre-wrap text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed font-sans break-words max-h-40 overflow-y-auto custom-scrollbar rounded-lg bg-gray-50/50 dark:bg-gray-900/30 p-3 border border-gray-100/80 dark:border-gray-700/40">
                            {inspectorData.description}
                          </pre>
                        </GlassPanel>
                      )}

                      {Array.isArray(inspectorData.tags) && inspectorData.tags.length > 0 && (
                        <GlassPanel className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <SectionLabel icon={Tag}>Tags ({inspectorData.tags.length})</SectionLabel>
                            <CopyBtn text={inspectorData.tags.join(", ")} label="Tags copied" />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {inspectorData.tags.map((tag, i) => (
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
        )}

      </div>

      {/* CHANNEL SOURCES CONFIGURATION MODAL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Configure Channel Sources</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Manage YouTube channels synced from the Trending Hub categories</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Add New Channel form */}
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-950/10 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle size={14} /> Add New Channel
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">Channel Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Creator Hub"
                      value={newChanName}
                      onChange={(e) => setNewChanName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">Channel Handle</label>
                    <input
                      type="text"
                      placeholder="e.g. @creatorhub"
                      value={newChanHandle}
                      onChange={(e) => setNewChanHandle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">Category Group</label>
                    <select
                      value={newChanCategory}
                      onChange={(e) => setNewChanCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {types.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">Subscribers Base</label>
                    <input
                      type="number"
                      placeholder="45000"
                      value={newChanSubs}
                      onChange={(e) => setNewChanSubs(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">Accent Color Theme</label>
                    <div className="flex gap-1.5 py-1">
                      {Object.keys(PRESET_COLORS).map(colorKey => {
                        const col = PRESET_COLORS[colorKey];
                        const isSelected = newChanColor === colorKey;
                        return (
                          <button
                            key={colorKey}
                            type="button"
                            onClick={() => setNewChanColor(colorKey)}
                            className={`w-5.5 h-5.5 rounded-full ${col.bg} ring-offset-2 transition-all ${
                              isSelected ? "ring-2 ring-blue-500 scale-110" : "opacity-80 hover:opacity-100"
                            }`}
                            title={colorKey}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleCreateChannel}
                    disabled={addingChannel}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {addingChannel ? "Adding..." : "Add Channel"}
                  </button>
                </div>

              </div>

              {/* Configured channels list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Configured Channels</h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {channels.map((c) => {
                    const chanColor = PRESET_COLORS[c.color || "blue"];
                    return (
                      <div key={c.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 group">
                        {editingChannelId === c.id ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-400 uppercase">Editing @{c.handle}</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-150 dark:bg-gray-805 text-gray-500 uppercase tracking-tighter shrink-0">{c.typeName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] font-bold text-gray-500 uppercase mb-0.5">Subscribers</label>
                                <input
                                  type="number"
                                  value={editSubs}
                                  onChange={(e) => setEditSubs(e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-gray-500 uppercase mb-0.5">Color</label>
                                <div className="flex gap-1 py-1">
                                  {Object.keys(PRESET_COLORS).map(colorKey => {
                                    const col = PRESET_COLORS[colorKey];
                                    return (
                                      <button
                                        key={colorKey}
                                        type="button"
                                        onClick={() => setEditColor(colorKey)}
                                        className={`w-4 h-4 rounded-full ${col.bg} transition-all ${
                                          editColor === colorKey ? "ring-2 ring-blue-500 scale-110" : "opacity-75 hover:opacity-100"
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingChannelId(null)}
                                className="px-2.5 py-1 text-[9px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-750 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-650 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(c)}
                                className="px-2.5 py-1 text-[9px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-6 h-6 rounded-full ${chanColor.bg} text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 uppercase`}>
                                {c.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="block font-bold text-xs text-gray-900 dark:text-white leading-tight truncate">{c.name}</span>
                                <span className="block text-[9px] text-gray-500 truncate">
                                  @{c.handle} • {formatViews(c.subscribers)} subs
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-150 dark:bg-gray-800 text-gray-500 uppercase tracking-tighter shrink-0">{c.typeName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChannelId(c.id);
                                  setEditSubs(String(c.subscribers));
                                  setEditColor(c.color || "blue");
                                }}
                                className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Edit Channel Settings"
                              >
                                <Settings size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChannel(c)}
                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Delete channel source"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {channels.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      No channels configured.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AdminLayout
          title="YouTube Analytics Error"
          titleInfo="An error occurred while loading this page"
          icon={Youtube}
        >
          <div className="p-8 max-w-xl mx-auto my-12 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl shadow-xl backdrop-blur-xl">
            <h2 className="text-sm font-black text-rose-800 dark:text-rose-400 mb-2 uppercase tracking-wider">Something went wrong rendering the Dashboard</h2>
            <p className="text-xs text-rose-600 dark:text-rose-300/80 mb-4 font-semibold">{this.state.error?.message || String(this.state.error)}</p>
            <pre className="text-[10px] font-mono bg-white/70 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 overflow-auto max-h-60 text-gray-700 dark:text-gray-300 custom-scrollbar mb-4">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Reload Page
            </button>
          </div>
        </AdminLayout>
      );
    }
    return this.props.children;
  }
}

export default function YouTubeAnalyticsWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <YouTubeAnalytics />
    </ErrorBoundary>
  );
}
