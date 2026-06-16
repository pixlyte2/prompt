import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  RefreshCw,
  Clock,
  Search,
  X,
  ArrowDownWideNarrow,
  Youtube,
  Loader2,
  Eye,
  Play,
  Users,
  Radio,
  Settings,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Save,
  CalendarPlus,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  ScrollText,
  ExternalLink,
  Filter,
  Layers,
  AlertTriangle,
  ListChecks,
  Video,
  Sparkles,
  Tag,
  Database,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import PageTabBar from "../../components/PageTabBar";
import VideoAIModal from "../../components/VideoAIModal";
import api from "../../services/api";
import { countWords } from "../../utils/aiPromptUtils";
import {
  hydrateCompetitorKeywords,
  persistTypeKeywords,
  persistCachedKeywords,
  sortKeywordsByMatchCount,
  unionKeywords,
} from "../../utils/competitorKeywords";
import {
  toDateKey,
  getTomorrowDateKey,
  getTodayTabDateKey,
  getTomorrowTabDateKey,
  formatScheduleTabLabel,
} from "../../utils/videoTaskSchedule";

function normalizeCompetitorHandle(handle) {
  return String(handle || "").trim().replace(/^@/, "").toLowerCase();
}

function resolveCompetitorChannel(typeChannels, videoChannels, handle) {
  const key = normalizeCompetitorHandle(handle);
  const fromType = (typeChannels || []).find((c) => normalizeCompetitorHandle(c.handle) === key);
  const fromVideos = (videoChannels || []).find((c) => normalizeCompetitorHandle(c.handle) === key);
  if (!fromType && !fromVideos) return null;
  return {
    handle: fromVideos?.handle || fromType?.handle || handle,
    name: fromVideos?.name || fromType?.name || handle,
    avatarUrl: fromVideos?.avatarUrl || fromType?.avatarUrl || null,
  };
}

function CompetitorToolbarAvatar({ channel, active, className = "", size = "sm" }) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = channel?.avatarUrl;
  const showImage = avatarUrl && !imgError;
  const letter = channel?.name?.charAt(0)?.toUpperCase() || "?";

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const sizeStyles = {
    sm: { box: "w-[18px] h-[18px] rounded-md", text: "text-[9px]" },
    md: { box: "w-9 h-9 rounded-md", text: "text-xs" },
    lg: { box: "w-7 h-7 rounded-lg", text: "text-[11px]" },
  };
  const { box: sizeClass, text: textSize } = sizeStyles[size] || sizeStyles.sm;

  if (showImage) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setImgError(true)}
        className={`${sizeClass} object-cover flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center flex-shrink-0 font-bold ${textSize} ${
        active ? "bg-blue-600 text-white" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
      } ${className}`}
      aria-hidden
    >
      {letter}
    </div>
  );
}

// Shared UI Components
function FilterChip({ active, onClick, children, count, variant = "default" }) {
  const variants = {
    default: active
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02] border-transparent"
      : "bg-white/60 dark:bg-gray-800/50 backdrop-blur-md text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:shadow-md hover:-translate-y-0.5",
    red: active
      ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25 scale-[1.02] border-transparent"
      : "bg-white/60 dark:bg-gray-800/50 backdrop-blur-md text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-800 hover:border-rose-400/50 dark:hover:border-rose-500/50 hover:shadow-md hover:-translate-y-0.5",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${variants[variant]}`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
          active ? "bg-white/25 text-white" : "bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function FilterSegment({ options, value, onChange, variant = "default" }) {
  const activeVariants = {
    default: "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm",
    red: "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm",
  };

  return (
    <div className={`inline-flex rounded-xl p-1 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative flex items-center justify-center px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all duration-300 ${
            value === option.value
              ? activeVariants[variant]
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          }`}
        >
          {option.label}
          {option.count !== undefined && option.count > 0 && (
            <span className={`ml-1 text-[9px] px-1 py-0.2 small rounded-md ${
              value === option.value 
                ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" 
                : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
            }`}>
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

const VIDEO_FORMAT_OPTIONS = [
  { label: "Long", value: "long" },
  { label: "Shorts", value: "short" },
];

function VideoFormatSegment({ value, onChange, disabled = false, compact = false }) {
  return (
    <div
      className={`inline-flex flex-shrink-0 rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      role="group"
      aria-label="Video format"
    >
      {VIDEO_FORMAT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`rounded-md font-semibold transition-colors ${
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          } ${
            value === option.value
              ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, onClear }) {
  return (
    <div className="relative flex-1 min-w-[120px] max-w-md group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
      </div>
      <input
        type="text"
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

function SortSelect({ value, onChange, options, icon: Icon }) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
        {Icon && <Icon size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-8 pr-8 py-1.5 sm:pl-9 sm:pr-9 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-400/50 transition-all duration-300 shadow-sm cursor-pointer w-full"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
         <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      </div>
    </div>
  );
}

function FilterBar({ children, className = "" }) {
  return (
    <div className={`relative overflow-visible rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/30 dark:shadow-black/30 p-2 sm:p-2.5 lg:p-3 flex flex-col gap-1.5 sm:gap-2.5 lg:gap-3 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-gray-800/40 dark:to-gray-900/10 pointer-events-none rounded-xl sm:rounded-2xl lg:rounded-3xl" />
      <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3 w-full">
        {children}
      </div>
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

function FilterLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 px-0.5 sm:px-1 text-[10px] sm:text-xs font-bold tracking-tight text-gray-700 dark:text-gray-300 flex-shrink-0">
      {Icon && <Icon size={13} className="text-blue-500 dark:text-blue-400 drop-shadow-sm" />}
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-100 dark:to-gray-400 whitespace-nowrap">{children}</span>
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
      {variant === "success" && <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>}
      <span className="text-[11px]">{count}</span>
      <span className="opacity-80 font-medium uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function ThumbnailModal({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={onClose} 
      />
      <div className="relative max-w-5xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10">
          <span className="text-white text-xs font-bold uppercase tracking-widest drop-shadow-md">Thumbnail Preview</span>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all pointer-events-auto backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>
        <img src={url} alt="Thumbnail Preview" className="w-full h-auto max-h-[85vh] object-contain bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}



/* ─── Competitor Watch ────────────────────────────────────────── */

const COMP_PERIODS = [
  { value: "4h", label: "Last 4h", ms: 14_400_000 },
  { value: "8h", label: "Last 8h", ms: 28_800_000 },
  { value: "12h", label: "Last 12h", ms: 43_200_000 },
  { value: "24h", label: "Last 24h", ms: 86_400_000 },
  { value: "7d", label: "Last 7 days", ms: 604_800_000 },
  { value: "all", label: "All", ms: Infinity },
];

const COMP_VIEW_FILTERS = [
  { value: 0, label: "All views" },
  { value: 25_000, label: "25K+" },
  { value: 50_000, label: "50K+" },
  { value: 100_000, label: "1 Lakh+" },
  { value: 500_000, label: "5 Lakh+" },
  { value: 1_000_000, label: "10 Lakh+" },
];

const COMP_SORTS = [
  { value: "trending", label: "Trending" },
  { value: "views", label: "Most viewed" },
  { value: "latest", label: "Latest" },
];

const COMP_FORMATS = [
  { value: "long", label: "Long Videos" },
  { value: "short", label: "Short Videos" },
];

const COMP_VIDEO_CACHE_STORAGE = "competitor-video-cache";
const COMP_VIDEO_CACHE_TTL_MS = 60 * 60 * 1000;

function normalizeVideoId(video) {
  const id = video?.videoId ?? video?.id;
  if (id == null || id === "") return null;
  const normalized = String(id).trim();
  return normalized || null;
}

/** Deduplicate by YouTube video ID; keeps the entry with higher view count when tied. */
function dedupeVideosByVideoId(videos) {
  const byId = new Map();
  for (const video of videos || []) {
    const videoId = normalizeVideoId(video);
    if (!videoId) continue;

    const existing = byId.get(videoId);
    if (!existing) {
      byId.set(videoId, { ...video, videoId });
      continue;
    }

    if ((video.views || 0) > (existing.views || 0)) {
      byId.set(videoId, { ...video, videoId });
    }
  }
  return Array.from(byId.values());
}

function dedupeCacheEntry(entry) {
  if (!entry?.videos?.length) return entry;
  const videos = dedupeVideosByVideoId(entry.videos);
  if (videos.length === entry.videos.length) return entry;
  return { ...entry, videos };
}

function loadCompetitorVideoCacheMap() {
  try {
    const raw = sessionStorage.getItem(COMP_VIDEO_CACHE_STORAGE);
    if (!raw) return new Map();

    const parsed = JSON.parse(raw);
    if (!parsed?.updatedAt || !parsed?.entries || typeof parsed.entries !== "object") {
      sessionStorage.removeItem(COMP_VIDEO_CACHE_STORAGE);
      return new Map();
    }

    if (Date.now() - parsed.updatedAt > COMP_VIDEO_CACHE_TTL_MS) {
      sessionStorage.removeItem(COMP_VIDEO_CACHE_STORAGE);
      return new Map();
    }

    const map = new Map();
    let needsPersist = false;
    for (const [key, entry] of Object.entries(parsed.entries)) {
      const deduped = dedupeCacheEntry(entry);
      map.set(key, deduped);
      if (deduped !== entry) needsPersist = true;
    }

    if (needsPersist) {
      persistCompetitorVideoCacheMap(map);
    }

    return map;
  } catch {
    return new Map();
  }
}

function persistCompetitorVideoCacheMap(map) {
  try {
    if (!map?.size) {
      sessionStorage.removeItem(COMP_VIDEO_CACHE_STORAGE);
      return;
    }

    sessionStorage.setItem(
      COMP_VIDEO_CACHE_STORAGE,
      JSON.stringify({
        updatedAt: Date.now(),
        entries: Object.fromEntries(map.entries()),
      }),
    );
  } catch {
    // Quota or privacy mode — in-memory cache still works for this page load.
  }
}

function clearCompetitorVideoCacheStorage() {
  try {
    sessionStorage.removeItem(COMP_VIDEO_CACHE_STORAGE);
  } catch {
    // ignore
  }
}

function isCompetitorVideoCacheExpired() {
  try {
    const raw = sessionStorage.getItem(COMP_VIDEO_CACHE_STORAGE);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!parsed?.updatedAt) return true;

    return Date.now() - parsed.updatedAt > COMP_VIDEO_CACHE_TTL_MS;
  } catch {
    return true;
  }
}

function parseKeywordInput(input) {
  const seen = new Set();
  const result = [];
  for (const part of String(input || "").split("|")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function filterNewKeywords(candidates, existing) {
  const existingKeys = new Set(
    (existing || []).map((k) => String(k).trim().toLowerCase()),
  );
  return candidates.filter((kw) => !existingKeys.has(kw.toLowerCase()));
}

function mergeAllCachedVideos(cacheRef) {
  const byVideoId = new Map();
  if (!cacheRef?.current) return [];

  for (const [cacheKey, entry] of cacheRef.current.entries()) {
    const typeId = String(cacheKey).split("|")[0];
    if (!entry?.videos?.length) continue;

    for (const video of dedupeVideosByVideoId(entry.videos)) {
      const videoId = normalizeVideoId(video);
      if (!videoId) continue;

      const existing = byVideoId.get(videoId);
      if (!existing) {
        byVideoId.set(videoId, {
          ...video,
          videoId,
          _cachedFromTypes: [typeId],
        });
        continue;
      }

      if ((video.views || 0) > (existing.views || 0)) {
        existing.views = video.views;
        existing.viewsText = video.viewsText ?? existing.viewsText;
        existing.publishedText = video.publishedText ?? existing.publishedText;
        existing.publishedAt = video.publishedAt ?? existing.publishedAt;
        existing.thumbnail = video.thumbnail ?? existing.thumbnail;
      }
      if (!existing._cachedFromTypes.includes(typeId)) {
        existing._cachedFromTypes.push(typeId);
      }
    }
  }

  return Array.from(byVideoId.values());
}

function videoTitleMatchesKeyword(video, keyword) {
  const q = String(keyword || "").trim().toLowerCase();
  if (!q) return true;
  return String(video?.title || "").toLowerCase().includes(q);
}

function parsePublishedAgo(text) {
  if (!text) return Infinity;
  const cleaned = text.replace(/^Streamed\s+/i, "").replace(/^Premiered\s+/i, "");
  const m = cleaned.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!m) return Infinity;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const multipliers = {
    second: 1000,
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
  };
  return n * (multipliers[unit] || Infinity);
}

function formatViews(n) {
  if (n == null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function isShortVideo(video) {
  if (!video) return false;
  return (
    video.videoFormat === "short" ||
    video.duration === "Short" ||
    (video.duration && !video.duration.includes(":"))
  );
}

function getThumbnailUrl(videoId, type = 'hd') {
  if (!videoId) return "";
  // YouTube thumbnail patterns
  if (type === 'hd') return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function ScheduleVideoModal({ video, channelType, onClose }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [contentFormat, setContentFormat] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86_400_000).toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [script, setScript] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [showScriptAI, setShowScriptAI] = useState(false);

  const PLATFORM_OPTIONS = [
    { value: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/watch?v=..." },
    { value: "instagram", label: "Instagram", icon: Users, placeholder: "https://instagram.com/reel/..." },
    { value: "facebook", label: "Facebook", icon: Users, placeholder: "https://facebook.com/watch/..." },
    { value: "website", label: "Website", icon: Search, placeholder: "https://example.com/article" },
  ];

  const FORMAT_OPTIONS = [
    { value: "short", label: "Shorts" },
    { value: "long", label: "Long" },
  ];

  const ASSIGNED_OPTIONS = [
    { value: "pooja", label: "Pooja" },
    { value: "mahalakshmi", label: "Mahalakshmi" },
  ];

  const FORMAT_PILL = {
    short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  };

  const ASSIGNED_PILL = {
    pooja: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    mahalakshmi: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  const PLATFORM_META = {
    youtube: { icon: Youtube, label: "YouTube", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
    instagram: { icon: Users, label: "Instagram", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20" },
    facebook: { icon: Users, label: "Facebook", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
    website: { icon: Search, label: "Website", color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800" },
  };

  if (video && !initialized) {
    setError(null);
    setTitle(video.title || "");
    setPlatform("youtube");
    setContentFormat([]); // Initialize as empty array for multiple selection
    setAssignedTo([]); // Initialize as empty array for multiple selection
    setInitialized(true);
  }

  if (!video && initialized) {
    setInitialized(false);
  }

  if (!video) return null;

  const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const canSave = title.trim() && channelType && (scheduledDate || !scheduledDate); // Backlog allows no date
  const scriptWordCount = countWords(script);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/video-tasks", {
        videoId: video.videoId,
        title: title.trim(),
        thumbnail: video.thumbnail,
        channelName: video.channelName,
        channelHandle: video.channelHandle,
        channelType,
        platform,
        contentFormat: Array.isArray(contentFormat) ? contentFormat : (contentFormat ? [contentFormat] : []),
        assignedTo: Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []),
        url: videoUrl,
        views: video.views,
        viewsText: video.viewsText,
        duration: video.duration,
        scheduledDate,
        notes,
        script,
      });
      toast.success(
        (t) => (
          <span className="flex items-center gap-2">
            Added to board
            <button
              className="text-blue-600 font-medium underline text-xs"
              onClick={() => { toast.dismiss(t.id); navigate("/admin/production-hub"); }}
            >
              View Hub
            </button>
          </span>
        ),
        { duration: 4000 },
      );
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save task";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const activePlat = PLATFORM_OPTIONS.find((p) => p.value === platform) || PLATFORM_OPTIONS[0];
  const ActiveIcon = activePlat.icon;

  return (
    <>
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md buffer-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add to Board</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Schedule this video for content creation</p>
        </div>
        <div className="px-5 py-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          {/* Video preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <img
              src={video.thumbnail}
              alt=""
              className="w-16 h-10 rounded object-cover bg-gray-100 dark:bg-gray-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                {video.title}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {video.channelName} • {video.viewsText || formatViews(video.views)}
              </p>
            </div>
          </div>

          {/* Platform selector */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Platform</label>
            <div className="flex gap-1">
              {PLATFORM_OPTIONS.map((p) => {
                const Icon = p.icon;
                const isActive = platform === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-all border ${
                      isActive
                        ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                        : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon size={14} /> {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title for your content"
              className="w-full buffer-input text-sm"
            />
          </div>

          {/* Content format */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Content Format</label>
            <div className="flex gap-1.5">
              {FORMAT_OPTIONS.map((f) => {
                const isSelected = Array.isArray(contentFormat) ? contentFormat.includes(f.value) : contentFormat === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      if (Array.isArray(contentFormat)) {
                        if (isSelected) {
                          setContentFormat(contentFormat.filter(format => format !== f.value));
                        } else {
                          setContentFormat([...contentFormat, f.value]);
                        }
                      } else {
                        // Handle legacy single selection
                        setContentFormat(isSelected ? [] : [f.value]);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? `${FORMAT_PILL[f.value]} border-current shadow-sm`
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Select one, both, or none</p>
          </div>

          {/* Assigned to */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Assigned to</label>
            <div className="flex gap-1.5">
              {ASSIGNED_OPTIONS.map((a) => {
                const isSelected = Array.isArray(assignedTo) ? assignedTo.includes(a.value) : assignedTo === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => {
                      if (Array.isArray(assignedTo)) {
                        if (isSelected) {
                          setAssignedTo(assignedTo.filter(assigned => assigned !== a.value));
                        } else {
                          setAssignedTo([...assignedTo, a.value]);
                        }
                      } else {
                        // Handle legacy single selection
                        setAssignedTo(isSelected ? [] : [a.value]);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? `${ASSIGNED_PILL[a.value]} border-current shadow-sm`
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Select one, both, or none</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Channel Type</label>
              <div className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300">
                {channelType}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400">Scheduled Date</label>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${!scheduledDate ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>Backlog</span>
                  <button
                    type="button"
                    onClick={() => setScheduledDate(scheduledDate ? null : new Date(Date.now() + 86_400_000).toISOString().split("T")[0])}
                    className={`relative inline-flex h-[18px] w-[32px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!scheduledDate ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-gray-200 dark:bg-gray-700"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${!scheduledDate ? "translate-x-[14px]" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={scheduledDate || ""}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={`w-full buffer-input text-sm ${
                  !scheduledDate ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add any notes…"
              className="w-full buffer-input text-sm resize-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400">Script (optional)</label>
              <button
                type="button"
                onClick={() => setShowScriptAI(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                <Sparkles size={11} />
                Get Script
              </button>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={4}
              placeholder="Paste or write the video script, or use Get Script to generate one…"
              className="w-full buffer-input text-sm resize-y min-h-[5rem]"
            />
            {script.trim() && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right tabular-nums">
                {scriptWordCount} words
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0">
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-medium text-red-700 dark:text-red-400 leading-tight">{error}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="buffer-button-secondary text-xs">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="ml-auto buffer-button-primary text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : (scheduledDate ? <Plus size={12} /> : <ListChecks size={12} />)}
              {scheduledDate ? "Schedule Task" : "Add to Backlog"}
            </button>
          </div>
        </div>
      </div>
    </div>
    {showScriptAI && (
      <VideoAIModal
        open={showScriptAI}
        scriptOnly
        channelType={channelType}
        video={{
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          channelHandle: video.channelHandle,
          views: video.views,
          viewsText: video.viewsText,
          duration: video.duration,
          videoFormat: video.videoFormat,
          url: videoUrl,
        }}
        onClose={() => setShowScriptAI(false)}
        onScriptGenerated={(generated) => {
          setScript(generated);
          toast.success("Script added to task");
        }}
      />
    )}
    </>
  );
}

function CompetitorVideoCard({ video, onSchedule, onPreviewThumbnail }) {
  const channelInitial = video.channelName ? video.channelName.charAt(0).toUpperCase() : "?";

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-100 dark:border-gray-850 bg-white dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] hover:-translate-y-1.5 transition-all duration-500 ease-out">
      
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <a
          href={`https://www.youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <img
            src={video.thumbnail}
            alt=""
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          {/* Overlay Gradient on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Animated Play Button Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
             <div className="w-11 h-11 rounded-full bg-white/95 dark:bg-gray-950/95 text-red-600 dark:text-red-500 flex items-center justify-center shadow-lg shadow-black/30 border border-white/25 transform hover:scale-110 active:scale-95 transition-all duration-300">
                <Play size={18} fill="currentColor" className="ml-0.5" />
             </div>
          </div>
        </a>

        {/* Floating Badges */}
        {video.duration && (
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-bold tracking-wider text-white shadow-sm border border-white/10 uppercase">
            {video.duration}
          </span>
        )}
        
        {video.isLive && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-md text-[9px] font-black text-white inline-flex items-center gap-1 shadow-md border border-rose-400/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
          </span>
        )}
      </div>

      {/* Action bar — below thumbnail, never obscures preview */}
      {onSchedule && (
        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSchedule(video); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
            title="Schedule this video"
          >
            <CalendarPlus size={12} />
            Schedule
          </button>
        </div>
      )}

      {/* Details Container */}
      <div className="flex-1 p-3 flex flex-col justify-between bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-950/20">
        
        {/* Title */}
        <div>
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h4 className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" title={video.title}>
              {video.title}
            </h4>
          </a>
        </div>

        {/* Channel & Stats Footer */}
        <div className="mt-auto pt-2 border-t border-gray-100/70 dark:border-gray-800/50 space-y-2">
          
          {/* Channel Name & Preview Controls */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Channel Avatar + Name */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[9px] font-black shadow-sm flex-shrink-0">
                {channelInitial}
              </div>
              <span className="font-bold text-gray-600 dark:text-gray-300 truncate text-[10px]" title={video.channelName}>
                {video.channelName}
              </span>
            </div>

            {/* HD/SD Preview Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(video.videoId, 'hd')); }}
                className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-50/80 hover:bg-blue-600 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-100/50 dark:border-blue-900/30 transition-all cursor-pointer uppercase tracking-wider"
                title="Preview HD Thumbnail"
              >
                HD
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(video.videoId, 'sd')); }}
                className="text-[8px] font-black px-1.5 py-0.5 rounded bg-gray-50/80 hover:bg-gray-600 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 hover:text-white border border-gray-200/50 dark:border-gray-700/30 transition-all cursor-pointer uppercase tracking-wider"
                title="Preview SD Thumbnail"
              >
                SD
              </button>
            </div>

          </div>

          {/* Stats (Views & Time) */}
          <div className="flex items-center justify-between text-[9px] text-gray-505 dark:text-gray-400 font-medium">
            <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 font-bold bg-gray-50/60 dark:bg-gray-800/40 px-1.5 py-0.5 rounded">
              <Eye size={10} className="text-blue-500" />
              {video.viewsText || formatViews(video.views)}
            </span>
            <span className="inline-flex items-center gap-1 opacity-80">
              <Clock size={10} className="text-amber-500" />
              {video.publishedText}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

const CACHED_VIEWS_PILL =
  "bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/50";

function CachedVideoRow({ video, onSchedule, onPreviewThumbnail }) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const viewsText = video.viewsText || formatViews(video.views);

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-2 px-2.5 py-2 sm:py-1.5 bg-white dark:bg-gray-800/80 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-blue-400/60 dark:hover:border-blue-700/60 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-all duration-300 hover:shadow-sm">
      <div className="flex items-center gap-2 min-w-0 w-full sm:flex-1">
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-10 h-6 sm:w-12 sm:h-7 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 relative group/thumb shadow-sm"
        >
          <img
            src={video.thumbnail}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
            <ExternalLink size={12} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
          </div>
          {video.duration && (
            <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-black/75 text-[9px] font-semibold text-white rounded-tl">
              {video.duration}
            </span>
          )}
          {video.isLive && (
            <span className="absolute top-0 left-0 px-1 py-0.5 bg-rose-600/90 text-[8px] font-black text-white rounded-br">
              LIVE
            </span>
          )}
        </a>

        <div className="flex-1 min-w-0">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block min-w-0"
          >
            <p
              className="text-[11px] font-semibold leading-tight truncate text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              title={video.title}
            >
              {video.title}
            </p>
          </a>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap opacity-80 scale-90 sm:scale-95 origin-left">
            {video.channelName && (
              <span className="text-[7.5px] sm:text-[8px] text-gray-500 dark:text-gray-400 truncate max-w-[10rem]" title={video.channelName}>
                {video.channelName}
              </span>
            )}
            {viewsText && (
              <>
                <span className="hidden sm:inline-block w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold tracking-tight shadow-sm min-h-[22px] sm:min-h-[26px] ${CACHED_VIEWS_PILL}`}
                  title={`${(video.views ?? 0).toLocaleString()} views`}
                >
                  <Eye size={10} className="flex-shrink-0 opacity-90 sm:w-[11px] sm:h-[11px]" />
                  {viewsText}
                </span>
              </>
            )}
            {video.publishedText && (
              <>
                <span className="inline-block w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  <Clock size={10} className="text-amber-500 flex-shrink-0" />
                  {video.publishedText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto pl-12 sm:pl-0 sm:flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300/90 flex-shrink-0 shadow-sm border border-amber-100/50 dark:border-amber-800/30 min-h-[22px] sm:min-h-[26px]">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(video.videoId, "hd")); }}
            className="text-[9px] sm:text-[12px] font-bold uppercase tracking-wide hover:text-amber-800 dark:hover:text-amber-100 transition-colors"
            title="Preview HD thumbnail"
          >
            HD
          </button>
          <div className="w-px h-3.5 bg-amber-200/60 dark:bg-amber-700/50" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(video.videoId, "sd")); }}
            className="text-[9px] sm:text-[12px] font-bold uppercase tracking-wide hover:text-amber-800 dark:hover:text-amber-100 transition-colors"
            title="Preview SD thumbnail"
          >
            SD
          </button>
        </div>

        {onSchedule && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSchedule(video); }}
            className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-900/35 dark:text-emerald-100 dark:border-emerald-700/60 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/55 hover:border-emerald-300 dark:hover:border-emerald-500 transition-colors cursor-pointer min-h-[22px] sm:min-h-[26px]"
            title="Schedule this video"
          >
            <CalendarPlus size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
            <span>Schedule</span>
          </button>
        )}
      </div>
    </div>
  );
}

function CompetitorSettingsModal({ open, onClose, onTypesChanged }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeVpc, setNewTypeVpc] = useState(30);
  const [addingType, setAddingType] = useState(false);
  const [newChannels, setNewChannels] = useState({});
  const [showAddChannelForm, setShowAddChannelForm] = useState({});
  const [busy, setBusy] = useState(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/competitor-types");
      setTypes(data);
      if (data.length && !expanded) setExpanded(data[0]._id);
    } catch {
      toast.error("Failed to load types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchTypes();
    else {
      setShowAddChannelForm({});
      setNewChannels({});
    }
  }, [open, fetchTypes]);

  const openAddChannelForm = (typeId) => {
    setShowAddChannelForm((prev) => ({ ...prev, [typeId]: true }));
    setNewChannels((prev) => ({
      ...prev,
      [typeId]: prev[typeId] || { handle: "", name: "", videoFormat: "long" },
    }));
  };

  const closeAddChannelForm = (typeId) => {
    setShowAddChannelForm((prev) => ({ ...prev, [typeId]: false }));
    setNewChannels((prev) => ({ ...prev, [typeId]: { handle: "", name: "", videoFormat: "long" } }));
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    setBusy("create-type");
    try {
      await api.post("/competitor-types", { name: newTypeName.trim(), videosPerChannel: newTypeVpc });
      setNewTypeName("");
      setNewTypeVpc(30);
      setAddingType(false);
      await fetchTypes();
      onTypesChanged();
      toast.success("Type created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create type");
    } finally {
      setBusy(null);
    }
  };

  const handleUpdateTypeName = async (typeId, newName) => {
    if (!newName.trim()) return;
    try {
      const { data } = await api.put(`/competitor-types/${typeId}`, { name: newName });
      setTypes((prev) => prev.map((t) => (t._id === typeId ? { ...t, name: data.name } : t)));
      onTypesChanged();
    } catch (err) {
      toast.error("Failed to update type name");
    }
  };

  const handleUpdateVpc = async (typeId, vpc) => {
    setBusy(`vpc-${typeId}`);
    try {
      await api.put(`/competitor-types/${typeId}`, { videosPerChannel: vpc });
      setTypes((prev) => prev.map((t) => (t._id === typeId ? { ...t, videosPerChannel: vpc } : t)));
      onTypesChanged();
    } catch {
      toast.error("Failed to update");
    } finally {
      setBusy(null);
    }
  };


  const handleDeleteType = async (typeId) => {
    if (!confirm("Delete this type and all its channels?")) return;
    setBusy(`del-${typeId}`);
    try {
      await api.delete(`/competitor-types/${typeId}`);
      setTypes((prev) => prev.filter((t) => t._id !== typeId));
      onTypesChanged();
      toast.success("Type deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setBusy(null);
    }
  };

  const handleAddChannel = async (typeId) => {
    const ch = newChannels[typeId];
    if (!ch?.handle?.trim() || !ch?.name?.trim()) return;
    setBusy(`add-ch-${typeId}`);
    try {
      const { data } = await api.post(`/competitor-types/${typeId}/channels`, {
        handle: ch.handle.trim().replace(/^@/, ""),
        name: ch.name.trim(),
        videoFormat: ch.videoFormat || 'long',
      });
      setTypes((prev) => prev.map((t) => (t._id === typeId ? data : t)));
      closeAddChannelForm(typeId);
      onTypesChanged();
      toast.success("Channel added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add channel");
    } finally {
      setBusy(null);
    }
  };

  const handleRemoveChannel = async (typeId, handle) => {
    setBusy(`rm-${typeId}-${handle}`);
    try {
      const { data } = await api.delete(`/competitor-types/${typeId}/channels/${handle}`);
      setTypes((prev) => prev.map((t) => (t._id === typeId ? data : t)));
      onTypesChanged();
    } finally {
      setBusy(null);
    }
  };

  const handleUpdateChannelFormat = async (typeId, handle, videoFormat) => {
    const type = types.find((t) => t._id === typeId);
    const channel = type?.channels?.find((ch) => ch.handle === handle);
    const current = channel?.videoFormat === "short" ? "short" : "long";
    if (videoFormat === current) return;

    setBusy(`fmt-${typeId}-${handle}`);
    try {
      const { data } = await api.put(`/competitor-types/${typeId}/channels/${handle}`, { videoFormat });
      setTypes((prev) => prev.map((t) => (t._id === typeId ? data : t)));
      onTypesChanged();
    } catch {
      toast.error("Failed to update format");
    } finally {
      setBusy(null);
    }
  };

  const persistTypeOrder = async (newTypes, busyId) => {
    const reordered = newTypes.map((t, idx) => ({ id: t._id, sortOrder: idx }));
    setBusy(busyId);
    try {
      await api.post("/competitor-types/reorder", { order: reordered });
      setTypes(newTypes);
      onTypesChanged();
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    } finally {
      setBusy(null);
    }
  };

  const handleMoveType = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= types.length) return;
    const newTypes = [...types];
    [newTypes[index], newTypes[targetIndex]] = [newTypes[targetIndex], newTypes[index]];
    await persistTypeOrder(newTypes, `move-${newTypes[index]._id}`);
  };

  const handleMoveTypeToTop = async (index) => {
    if (index === 0) return;
    const newTypes = [...types];
    const [item] = newTypes.splice(index, 1);
    newTypes.unshift(item);
    await persistTypeOrder(newTypes, `move-${item._id}`);
  };

  const handleMoveTypeToBottom = async (index) => {
    if (index === types.length - 1) return;
    const newTypes = [...types];
    const [item] = newTypes.splice(index, 1);
    newTypes.push(item);
    await persistTypeOrder(newTypes, `move-${item._id}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[90%] md:max-w-[50%] max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Manage Channel Types</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Add types and YouTube channels to track</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {types.map((type, typeIndex) => {
                const isOpen = expanded === type._id;
                const chInput = newChannels[type._id] || { handle: "", name: "", videoFormat: "long" };
                return (
                  <div key={type._id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="w-full flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : type._id)}
                        className="flex items-center gap-1.5 flex-1 text-left"
                      >
                        {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        <input
                          type="text"
                          value={type.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setTypes((prev) => prev.map((t) => (t._id === type._id ? { ...t, name: e.target.value } : t)))}
                          onBlur={(e) => handleUpdateTypeName(type._id, e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                          className="text-xs font-semibold flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -mx-1 text-gray-900 dark:text-white placeholder-gray-400"
                          placeholder="Type name"
                        />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveTypeToTop(typeIndex)}
                          disabled={typeIndex === 0 || busy != null}
                          className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                          title="Move to top"
                        >
                          <ChevronsUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveType(typeIndex, "up")}
                          disabled={typeIndex === 0 || busy != null}
                          className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                          title="Move up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveType(typeIndex, "down")}
                          disabled={typeIndex === types.length - 1 || busy != null}
                          className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                          title="Move down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTypeToBottom(typeIndex)}
                          disabled={typeIndex === types.length - 1 || busy != null}
                          className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                          title="Move to bottom"
                        >
                          <ChevronsDown size={13} />
                        </button>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-1 font-medium">{type.channels.length} ch</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-4 py-3 space-y-3 border-t border-gray-200 dark:border-gray-700">
                        {/* Videos per channel */}
                        <div className="flex items-center gap-3">
                          <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Videos per channel:</label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={type.videosPerChannel}
                            onChange={(e) => {
                              const v = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 500);
                              setTypes((prev) => prev.map((t) => (t._id === type._id ? { ...t, videosPerChannel: v } : t)));
                            }}
                            onBlur={(e) => {
                              const v = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 500);
                              handleUpdateVpc(type._id, v);
                            }}
                            className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                          <span className="text-[10px] text-gray-400">(max 500)</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteType(type._id)}
                            disabled={busy === `del-${type._id}`}
                            className="ml-auto p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                            title="Delete type"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {/* Channel list */}
                        <div className="space-y-1">
                          {type.channels.map((ch) => (
                            <div key={ch.handle} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 group">
                              <Youtube size={12} className="text-red-500 flex-shrink-0" />
                              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">{ch.name}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:inline">@{ch.handle}</span>
                              <VideoFormatSegment
                                compact
                                value={ch.videoFormat === "short" ? "short" : "long"}
                                disabled={busy === `fmt-${type._id}-${ch.handle}`}
                                onChange={(fmt) => handleUpdateChannelFormat(type._id, ch.handle, fmt)}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveChannel(type._id, ch.handle)}
                                disabled={busy === `rm-${type._id}-${ch.handle}`}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all disabled:opacity-50"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Add channel */}
                        {showAddChannelForm[type._id] ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder="@handle"
                              value={chInput.handle}
                              onChange={(e) => setNewChannels((prev) => ({ ...prev, [type._id]: { ...chInput, handle: e.target.value } }))}
                              autoFocus
                              className="flex-1 min-w-[7rem] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                            <input
                              type="text"
                              placeholder="Display name"
                              value={chInput.name}
                              onChange={(e) => setNewChannels((prev) => ({ ...prev, [type._id]: { ...chInput, name: e.target.value } }))}
                              onKeyDown={(e) => e.key === "Enter" && handleAddChannel(type._id)}
                              className="flex-1 min-w-[7rem] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                            <VideoFormatSegment
                              compact
                              value={chInput.videoFormat === "short" ? "short" : "long"}
                              disabled={busy === `add-ch-${type._id}`}
                              onChange={(fmt) =>
                                setNewChannels((prev) => ({
                                  ...prev,
                                  [type._id]: { ...chInput, videoFormat: fmt },
                                }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() => handleAddChannel(type._id)}
                              disabled={busy === `add-ch-${type._id}` || !chInput.handle?.trim() || !chInput.name?.trim()}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              {busy === `add-ch-${type._id}` ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => closeAddChannelForm(type._id)}
                              disabled={busy === `add-ch-${type._id}`}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAddChannelForm(type._id)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                          >
                            <Plus size={12} />
                            Add channel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add new type */}
              {addingType ? (
                <div className="rounded-xl border border-dashed border-blue-300 dark:border-blue-700 p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Type name (e.g. Social, Govt Schemes)"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Videos per channel:</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={newTypeVpc}
                      onChange={(e) => setNewTypeVpc(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 500))}
                      className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateType}
                      disabled={busy === "create-type" || !newTypeName.trim()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      {busy === "create-type" ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Create Type
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingType(false); setNewTypeName(""); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingType(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <Plus size={14} />
                  Add New Type
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CompetitorWatch({ cacheRef, onCacheChange, keywordsState, onTypeKeywordsChange }) {
  const [types, setTypes] = useState([]);
  const [activeType, setActiveType] = useState(null);
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("all");
  const [compSort, setCompSort] = useState("views");
  const [activeChannel, setActiveChannel] = useState("all");
  const [compSearch, setCompSearch] = useState("");
  const [minViews, setMinViews] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewThumbUrl, setPreviewThumbUrl] = useState(null);
  const [scheduleVideo, setScheduleVideo] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [compFormat, setCompFormat] = useState("long");
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [compKeywords, setCompKeywords] = useState([]);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [showKeywordsDropdown, setShowKeywordsDropdown] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const typeDropdownRef = useRef(null);
  const periodDropdownRef = useRef(null);
  const viewDropdownRef = useRef(null);
  const channelDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const formatDropdownRef = useRef(null);
  const keywordsDropdownRef = useRef(null);
  const lastLoadedTypeRef = useRef(null);
  const lastLoadedChannelRef = useRef(null);
  /** Shared scrape cache: `${typeId}|all` → { videos, channels } (persisted in sessionStorage, 60 min TTL). */
  const competitorVideoCacheRef = cacheRef;

  const buildCompetitorCacheKey = (typeId, format = "all") => `${typeId}|${format || "all"}`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) setShowTypeDropdown(false);
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) setShowPeriodDropdown(false);
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target)) setShowViewDropdown(false);
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target)) setShowChannelDropdown(false);
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) setShowSortDropdown(false);
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target)) setShowFormatDropdown(false);
      if (keywordsDropdownRef.current && !keywordsDropdownRef.current.contains(event.target)) setShowKeywordsDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTypeName = useMemo(
    () => types.find((t) => t._id === activeType)?.name || "",
    [types, activeType],
  );

  const activeTypeData = useMemo(
    () => types.find((t) => t._id === activeType) ?? null,
    [types, activeType],
  );

  const categoryToolbarChannel = useMemo(() => {
    if (!activeTypeData) return null;

    const typeChannels = activeTypeData.channels || [];

    if (activeChannel !== "all") {
      return resolveCompetitorChannel(typeChannels, channels, activeChannel);
    }

    if (typeChannels.length === 1) {
      return resolveCompetitorChannel(typeChannels, channels, typeChannels[0].handle);
    }

    return null;
  }, [activeTypeData, activeChannel, channels]);

  const [videoRefreshKey, setVideoRefreshKey] = useState(0);

  const fetchTypes = useCallback(async () => {
    setTypesLoading(true);
    try {
      const { data } = await api.get("/competitor-types");
      setTypes(data);
      // Removed auto-selection of first type to allow "Select Category" default
    } catch {
      toast.error("Could not load channel types");
    } finally {
      setTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useEffect(() => {
    if (activeType) {
      setCompKeywords(keywordsState?.byType?.[activeType] || []);
    } else {
      setCompKeywords([]);
    }
    setActiveKeyword(null);
  }, [activeType, keywordsState?.byType]);

  const persistKeywords = useCallback((keywords) => {
    if (!activeType) return;
    setCompKeywords(keywords);
    onTypeKeywordsChange(activeType, keywords);
  }, [activeType, onTypeKeywordsChange]);

  const addCompKeyword = useCallback(() => {
    const parsed = parseKeywordInput(newKeywordInput);
    if (!parsed.length) return;
    const toAdd = filterNewKeywords(parsed, compKeywords);
    if (!toAdd.length) {
      toast.error("Keyword already exists");
      return;
    }
    persistKeywords([...compKeywords, ...toAdd]);
    setNewKeywordInput("");
  }, [newKeywordInput, compKeywords, persistKeywords]);

  const removeCompKeyword = useCallback((keyword) => {
    persistKeywords(compKeywords.filter((k) => k !== keyword));
    if (activeKeyword === keyword) setActiveKeyword(null);
  }, [compKeywords, activeKeyword, persistKeywords]);

  const fetchVideos = useCallback(async (typeId, { silent = false, force = false, format = "all" } = {}) => {
    if (!typeId) return;

    const cacheKey = buildCompetitorCacheKey(typeId, format);

    if (!force) {
      const cached = competitorVideoCacheRef.current.get(cacheKey);
      if (cached) {
        const entry = dedupeCacheEntry(cached);
        if (entry !== cached) {
          competitorVideoCacheRef.current.set(cacheKey, entry);
          onCacheChange?.();
        }
        setVideos(entry.videos);
        setChannels(entry.channels);
        return;
      }
    } else {
      competitorVideoCacheRef.current.delete(cacheKey);
      onCacheChange?.();
    }

    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ typeId });
      if (force) params.set("force", "true");
      params.set("videoFormat", format || "all");
      const { data } = await api.get(`/competitors/videos?${params}`);
      const entry = {
        videos: dedupeVideosByVideoId(data.videos || []),
        channels: data.channels || [],
      };
      competitorVideoCacheRef.current.set(cacheKey, entry);
      onCacheChange?.();
      setVideos(entry.videos);
      setChannels(entry.channels);
    } catch {
      toast.error("Could not load competitor videos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [competitorVideoCacheRef, onCacheChange]);

  const forceRefresh = useRef(false);

  useEffect(() => {
    if (activeType) {
      fetchVideos(activeType, {
        force: forceRefresh.current,
        format: "all",
      });
      forceRefresh.current = false;
    }
  }, [activeType, fetchVideos, videoRefreshKey]);

  const handleTypesChanged = useCallback(() => {
    lastLoadedTypeRef.current = null;
    lastLoadedChannelRef.current = null;
    competitorVideoCacheRef.current.clear();
    onCacheChange?.();
    fetchTypes();
    forceRefresh.current = true;
    setVideoRefreshKey((k) => k + 1);
  }, [fetchTypes, onCacheChange]);

  // Reset loaded status when Category or Channel is explicitly changed by the user
  useEffect(() => {
    lastLoadedTypeRef.current = null;
  }, [activeType]);

  useEffect(() => {
    lastLoadedChannelRef.current = null;
  }, [activeChannel]);

  // Auto-default format on first load of category channels or channel selection
  useEffect(() => {
    if (activeType && channels.length > 0) {
      lastLoadedTypeRef.current = activeType;
      lastLoadedChannelRef.current = activeChannel;
    }
  }, [activeType, channels, activeChannel]);

  // Base list with channel + search + format filters
  const baseFiltered = useMemo(() => {
    let list = [...videos];

    if (activeChannel !== "all") {
      list = list.filter((v) => v.channelHandle === activeChannel);
    }

    if (compSearch.trim()) {
      const q = compSearch.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }

    if (compFormat !== "all") {
      list = list.filter((v) => {
        return compFormat === "short" ? isShortVideo(v) : !isShortVideo(v);
      });
    }

    return list;
  }, [videos, activeChannel, compSearch, compFormat]);

  const applyKeywordFilter = useCallback((list) => {
    if (!activeKeyword) return list;
    return list.filter((v) => videoTitleMatchesKeyword(v, activeKeyword));
  }, [activeKeyword]);

  // Counts per configured keyword (respects channel/search/format/period/view, not active keyword)
  const keywordCounts = useMemo(() => {
    let list = [...baseFiltered];

    const periodMs = COMP_PERIODS.find((p) => p.value === period)?.ms || Infinity;
    if (periodMs !== Infinity) {
      list = list.filter((v) => parsePublishedAgo(v.publishedText) <= periodMs);
    }

    if (minViews > 0) {
      list = list.filter((v) => (v.views || 0) >= minViews);
    }

    const counts = {};
    compKeywords.forEach((kw) => {
      counts[kw] = list.filter((v) => videoTitleMatchesKeyword(v, kw)).length;
    });
    return counts;
  }, [baseFiltered, period, minViews, compKeywords]);

  const sortedCompKeywords = useMemo(
    () => sortKeywordsByMatchCount(compKeywords, keywordCounts),
    [compKeywords, keywordCounts],
  );

  // Counts for format buttons — respect active period and view filters
  const formatCounts = useMemo(() => {
    let list = applyKeywordFilter([...videos]);

    if (activeChannel !== "all") {
      list = list.filter((v) => v.channelHandle === activeChannel);
    }

    if (compSearch.trim()) {
      const q = compSearch.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }

    const periodMs = COMP_PERIODS.find((p) => p.value === period)?.ms || Infinity;
    if (periodMs !== Infinity) {
      list = list.filter((v) => parsePublishedAgo(v.publishedText) <= periodMs);
    }

    if (minViews > 0) {
      list = list.filter((v) => (v.views || 0) >= minViews);
    }

    return {
      all: list.length,
      long: list.filter((v) => !isShortVideo(v)).length,
      short: list.filter((v) => isShortVideo(v)).length,
    };
  }, [videos, activeChannel, compSearch, period, minViews, applyKeywordFilter]);

  // Period-filtered list (channel + search + period, no view filter) — used for viewCounts
  const periodFiltered = useMemo(() => {
    const periodMs = COMP_PERIODS.find((p) => p.value === period)?.ms || Infinity;
    const withKeyword = applyKeywordFilter(baseFiltered);
    if (periodMs === Infinity) return withKeyword;
    return withKeyword.filter((v) => parsePublishedAgo(v.publishedText) <= periodMs);
  }, [baseFiltered, period, applyKeywordFilter]);

  // View-filtered list (channel + search + minViews, no period filter) — used for periodCounts
  const viewFiltered = useMemo(() => {
    const withKeyword = applyKeywordFilter(baseFiltered);
    if (minViews === 0) return withKeyword;
    return withKeyword.filter((v) => (v.views || 0) >= minViews);
  }, [baseFiltered, minViews, applyKeywordFilter]);

  // Counts for view filter buttons — respect active period
  const viewCounts = useMemo(() => {
    const counts = {};
    COMP_VIEW_FILTERS.forEach((vf) => {
      counts[vf.value] = vf.value === 0
        ? periodFiltered.length
        : periodFiltered.filter((v) => (v.views || 0) >= vf.value).length;
    });
    return counts;
  }, [periodFiltered]);

  // Counts for period buttons — respect active view filter
  const periodCounts = useMemo(() => {
    const counts = {};
    COMP_PERIODS.forEach((p) => {
      counts[p.value] = p.value === "all"
        ? viewFiltered.length
        : viewFiltered.filter((v) => parsePublishedAgo(v.publishedText) <= p.ms).length;
    });
    return counts;
  }, [viewFiltered]);

  const filtered = useMemo(() => {
    const periodMs = COMP_PERIODS.find((p) => p.value === period)?.ms || Infinity;
    let list = applyKeywordFilter([...baseFiltered]);

    if (periodMs !== Infinity) {
      list = list.filter((v) => {
        const agoMs = parsePublishedAgo(v.publishedText);
        return agoMs <= periodMs;
      });
    }

    if (minViews > 0) {
      list = list.filter((v) => (v.views || 0) >= minViews);
    }

    if (compSort === "trending") {
      list.sort((a, b) => {
        const aMs = parsePublishedAgo(a.publishedText);
        const bMs = parsePublishedAgo(b.publishedText);
        // Handle infinity/fallback and avoid division by zero
        const aTime = aMs === Infinity ? 31_536_000_000 * 5 : Math.max(aMs, 1000);
        const bTime = bMs === Infinity ? 31_536_000_000 * 5 : Math.max(bMs, 1000);
        return (b.views / bTime) - (a.views / aTime);
      });
    } else if (compSort === "views") {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      list.sort((a, b) => parsePublishedAgo(a.publishedText) - parsePublishedAgo(b.publishedText));
    }

    return list;
  }, [baseFiltered, period, compSort, minViews, applyKeywordFilter]);

  if (typesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-red-200 dark:border-red-800 border-t-red-600 dark:border-t-red-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading channel types…</p>
        </div>
      </div>
    );
  }

  if (types.length === 0) {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Youtube size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No channel types configured</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add a type and channels to start tracking competitors</p>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            <Settings size={13} /> Configure Types
          </button>
        </div>
        <CompetitorSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onTypesChanged={handleTypesChanged} />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-3 px-4 pt-3 pb-4">
      {/* Premium Compact Single-Row Filter Dashboard */}
      <div className="flex-shrink-0 z-30">
        <div className={`relative flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/60 dark:border-gray-800/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] w-full overflow-visible ${showTypeDropdown || showChannelDropdown || showPeriodDropdown || showViewDropdown || showFormatDropdown || showKeywordsDropdown || showSortDropdown ? "z-[110]" : ""}`}>
          
          {/* Group A: Source Selection (Category & Sources) */}
          <div className="grid grid-cols-2 md:flex md:items-center gap-2 flex-shrink-0">
            {/* Category Dropdown */}
            <div className="relative flex-1 md:flex-initial flex items-center gap-1 min-w-0" ref={typeDropdownRef}>
              {categoryToolbarChannel ? (
                <CompetitorToolbarAvatar channel={categoryToolbarChannel} active={!!activeType} size="md" />
              ) : (
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                    activeType ? "bg-blue-600 text-white" : "bg-blue-50 dark:bg-blue-900/30 text-blue-500"
                  }`}
                  aria-hidden
                >
                  <Layers size={18} />
                </div>
              )}
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className={`flex items-center justify-between flex-1 md:flex-initial min-w-0 h-9 px-2 rounded-xl border text-[11px] font-bold transition-all duration-200 ${
                  activeType 
                    ? "bg-blue-600 text-white border-transparent shadow-md shadow-blue-500/10 hover:bg-blue-700"
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white hover:border-blue-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <span className="truncate max-w-[100px] md:max-w-[130px]">
                  {types.find(t => t._id === activeType)?.name || "Category"}
                </span>
                <ChevronDown size={12} className="ml-1 opacity-50 flex-shrink-0" />
              </button>

              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {types.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => {
                          setActiveType(t._id);
                          setActiveChannel("all");
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-all ${
                          activeType === t._id ? "bg-blue-50/50 dark:bg-blue-950/40 text-blue-600" : "text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg text-gray-500 border border-gray-200/50 dark:border-gray-700/50">{t.channels.length}</span>
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1.5" />
                  <button onClick={() => { setSettingsOpen(true); setShowTypeDropdown(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-[10px] font-black uppercase tracking-tight text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <Settings size={13} /> Configure Sources
                  </button>
                </div>
              )}
            </div>

            {/* Sources Dropdown */}
            <div className="relative flex-1 md:flex-initial" ref={channelDropdownRef}>
              <button
                onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                className={`flex items-center justify-between w-full md:w-auto h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 ${
                  activeChannel !== "all"
                    ? "bg-violet-600 text-white border-transparent shadow-md shadow-violet-500/10 hover:bg-violet-700"
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-white hover:border-violet-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Users size={13} className={`mr-1.5 flex-shrink-0 ${activeChannel !== "all" ? "text-white" : "text-violet-500"}`} />
                  <span className="truncate max-w-[95px] md:max-w-[120px]">
                    {activeChannel === "all" ? "Sources" : channels.find(c => c.handle === activeChannel)?.name}
                  </span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showChannelDropdown && (
                <div className="absolute top-full right-0 md:left-0 mt-2 w-52 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setActiveChannel("all");
                      setShowChannelDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800/40 dark:text-white"
                  >
                    All Channels
                  </button>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar border-t border-gray-100 dark:border-gray-800">
                    {channels.map((ch) => (
                      <button
                        key={ch.handle}
                        onClick={() => {
                          if (activeChannel === "all") {
                            setCompFormat("long");
                          }
                          setActiveChannel(ch.handle);
                          setShowChannelDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800/40 truncate dark:text-white"
                      >
                        {ch.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block w-[1px] h-6 bg-gray-200 dark:bg-gray-800 flex-shrink-0 mx-0.5" />

          {/* Group B: Filter Options (Time, Views, Format, Sort) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 md:flex md:items-center gap-2 flex-shrink-0">
            {/* Time Filter */}
            <div className="relative flex-1 md:flex-initial" ref={periodDropdownRef}>
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className={`flex items-center justify-between w-full md:w-auto h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 ${
                  period !== "all"
                    ? "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/15"
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-rose-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Clock size={13} className={`mr-1.5 flex-shrink-0 ${period !== "all" ? "text-rose-500" : "text-gray-400"}`} />
                  <span className="truncate max-w-[80px]">{period === "all" ? "Time" : COMP_PERIODS.find(p => p.value === period)?.label}</span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showPeriodDropdown && (
                <div className="absolute top-full left-0 mt-2 w-36 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-200">
                  {COMP_PERIODS.map((p) => (
                    <button key={p.value} onClick={() => { setPeriod(p.value); setShowPeriodDropdown(false); }} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors dark:text-white">
                      {p.label}
                      {periodCounts[p.value] > 0 && <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-gray-700/50 text-gray-500">{periodCounts[p.value]}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Views Filter */}
            <div className="relative flex-1 md:flex-initial" ref={viewDropdownRef}>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className={`flex items-center justify-between w-full md:w-auto h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 ${
                  minViews > 0 
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15" 
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Eye size={13} className={`mr-1.5 flex-shrink-0 ${minViews > 0 ? "text-emerald-500" : "text-gray-400"}`} />
                  <span className="truncate max-w-[80px]">{minViews === 0 ? "Views" : COMP_VIEW_FILTERS.find(vf => vf.value === minViews)?.label}</span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showViewDropdown && (
                <div className="absolute top-full right-0 md:left-0 mt-2 w-40 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-200">
                  {COMP_VIEW_FILTERS.map((vf) => (
                    <button key={vf.value} onClick={() => { setMinViews(vf.value); setShowViewDropdown(false); }} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors dark:text-white">
                      {vf.label}
                      {viewCounts[vf.value] > 0 && <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-gray-700/50 text-gray-500">{viewCounts[vf.value]}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Format Filter */}
            <div className="relative flex-1 md:flex-initial" ref={formatDropdownRef}>
              <button
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                className={`flex items-center justify-between w-full md:w-auto h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 ${
                  compFormat !== "all" 
                    ? "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15" 
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Video size={13} className={`mr-1.5 flex-shrink-0 ${compFormat !== "all" ? "text-amber-500" : "text-gray-400"}`} />
                  <span className="truncate max-w-[80px]">{compFormat === "all" ? "Format" : COMP_FORMATS.find(f => f.value === compFormat)?.label.replace(" Videos", "")}</span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showFormatDropdown && (
                <div className="absolute top-full left-0 mt-2 w-36 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-200">
                  {COMP_FORMATS.map((f) => (
                    <button key={f.value} onClick={() => { setCompFormat(f.value); setShowFormatDropdown(false); }} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors dark:text-white">
                      {f.label}
                      {formatCounts[f.value] > 0 && <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-gray-700/50 text-gray-500">{formatCounts[f.value]}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Keywords Filter / Configure */}
            <div className="relative flex-1 md:flex-initial" ref={keywordsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowKeywordsDropdown(!showKeywordsDropdown)}
                disabled={!activeType}
                className={`flex items-center justify-between w-full md:w-auto h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeKeyword
                    ? "bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/15"
                    : compKeywords.length > 0
                      ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-400/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                      : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Tag size={13} className={`mr-1.5 flex-shrink-0 ${activeKeyword || compKeywords.length > 0 ? "text-indigo-500" : "text-gray-400"}`} />
                  <span className="truncate max-w-[80px]">
                    {activeKeyword || "Keywords"}
                  </span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showKeywordsDropdown && activeType && (
                <div className="absolute top-full right-0 md:left-0 mt-2 w-56 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 pb-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Title keywords</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCompKeyword();
                          }
                        }}
                        placeholder="e.g. gold | silver | loans"
                        className="flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={addCompKeyword}
                        disabled={!newKeywordInput.trim()}
                        className="h-8 px-2.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2" />
                  <div className="max-h-48 overflow-y-auto custom-scrollbar py-1">
                    {compKeywords.length === 0 ? (
                      <p className="px-4 py-3 text-[10px] text-gray-400 text-center">No keywords yet — add terms to filter by title</p>
                    ) : (
                      sortedCompKeywords.map((kw) => (
                        <div
                          key={kw}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveKeyword(activeKeyword === kw ? null : kw);
                              setShowKeywordsDropdown(false);
                            }}
                            className={`flex-1 min-w-0 text-left text-[10px] font-bold truncate transition-colors ${
                              activeKeyword === kw
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-700 dark:text-white"
                            }`}
                          >
                            {kw}
                            {keywordCounts[kw] !== undefined && (
                              <span className="ml-1.5 text-[9px] font-black text-gray-400">{keywordCounts[kw]}</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCompKeyword(kw)}
                            className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove keyword"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rank Select */}
            <div className="relative flex-1 md:flex-initial" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center justify-between w-full md:w-auto h-9 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 text-[11px] font-semibold transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800/60"
              >
                <div className="flex items-center min-w-0">
                  <ArrowDownWideNarrow size={13} className="mr-1.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate max-w-[80px]">{COMP_SORTS.find(s => s.value === compSort)?.label}</span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-2 w-36 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {COMP_SORTS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { setCompSort(s.value); setShowSortDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold transition-colors ${
                        compSort === s.value 
                          ? "bg-gray-50 dark:bg-gray-900/40 text-blue-600 dark:text-blue-400" 
                          : "text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      {s.label}
                      {compSort === s.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block w-[1px] h-6 bg-gray-200 dark:bg-gray-800 flex-shrink-0 mx-0.5" />

          {/* Group C: Search & Actions */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto md:ml-auto flex-1 md:flex-initial">
            {/* Expandable Search Component */}
            <div className="relative flex-1 md:flex-initial">
              <div 
                className={`flex items-center h-9 border rounded-xl bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 transition-all duration-300 w-full px-3 md:px-0 ${
                  searchExpanded || compSearch ? "md:w-44 md:px-3" : "md:w-9 md:justify-center"
                }`}
              >
                {/* Desktop-only collapsed trigger */}
                <div className="hidden md:flex items-center w-full h-full">
                  {searchExpanded || compSearch ? (
                    <div className="flex items-center w-full">
                      <Search size={13} className="text-gray-400 mr-2 flex-shrink-0" />
                      <input
                        type="text"
                        value={compSearch}
                        onChange={(e) => setCompSearch(e.target.value)}
                        onBlur={() => setSearchExpanded(false)}
                        autoFocus
                        placeholder="Search..."
                        className="w-full bg-transparent text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                      />
                      {compSearch && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCompSearch("");
                            setSearchExpanded(false);
                          }}
                          className="text-gray-400 hover:text-gray-650 ml-1.5 flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchExpanded(true)}
                      className="w-full h-full flex items-center justify-center text-gray-500 hover:text-blue-500 transition-colors"
                      title="Search"
                    >
                      <Search size={13} />
                    </button>
                  )}
                </div>

                {/* Mobile-only always-expanded search bar */}
                <div className="flex md:hidden items-center w-full">
                  <Search size={13} className="text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={compSearch}
                    onChange={(e) => setCompSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                  />
                  {compSearch && (
                    <button
                      type="button"
                      onClick={() => setCompSearch("")}
                      className="text-gray-400 hover:text-gray-650 ml-1.5 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action & Stats (Refresh, Match count) */}
            <div className="flex items-center gap-2 h-9 p-1 bg-white/40 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700 rounded-xl shadow-sm flex-shrink-0">
              <button
                type="button"
                onClick={() => fetchVideos(activeType, { silent: true, force: true, format: "all" })}
                disabled={refreshing}
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  refreshing 
                    ? "bg-blue-600 text-white" 
                    : "bg-white dark:bg-gray-900 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95"
                }`}
                title="Refresh"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              </button>
              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 px-1 whitespace-nowrap">
                {filtered.length} {filtered.length === 1 ? "match" : "matches"}
              </span>
            </div>
          </div>

        </div>

        {/* Keyword pills — z-0 so filter-bar dropdowns stack above */}
        {activeType && compKeywords.length > 0 && (
          <div className="relative z-0 flex flex-wrap items-center gap-1.5 mt-2 px-1">
            {sortedCompKeywords.map((kw) => (
              <FilterChip
                key={kw}
                active={activeKeyword === kw}
                onClick={() => setActiveKeyword(activeKeyword === kw ? null : kw)}
                count={keywordCounts[kw]}
              >
                {kw}
              </FilterChip>
            ))}
            {activeKeyword && (
              <button
                type="button"
                onClick={() => setActiveKeyword(null)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Video grid */}
      <div className="flex-1 min-h-0 overflow-y-auto relative px-2 pb-6">
        {refreshing && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center py-4 bg-gradient-to-b from-white/90 to-white/0 dark:from-gray-900/90 dark:to-gray-900/0 backdrop-blur-sm pointer-events-none">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-blue-600 dark:text-blue-400 text-sm font-bold tracking-wide">
              <Loader2 size={16} className="animate-spin" />
              Refreshing videos…
            </div>
          </div>
        )}
        {!activeType ? (
          <div className="flex flex-col items-center justify-center py-32 text-center fade-in">
             <div className="w-24 h-24 bg-blue-50/50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 border border-blue-100/50 dark:border-blue-800/30 ring-8 ring-blue-50/20 dark:ring-blue-900/10">
               <Layers size={40} className="text-blue-500 dark:text-blue-400" />
             </div>
            <p className="text-2xl font-black tracking-tight text-gray-800 dark:text-gray-200 mb-2">Welcome to Trending Hub</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              To start tracking competitor performance, please select a <span className="text-blue-600 dark:text-blue-400 font-bold">Category</span> from the dropdown above.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-5">
              <div className="relative flex items-center justify-center w-16 h-16">
                 <div className="absolute inset-0 rounded-full border-[4px] border-gray-200/50 dark:border-gray-800/50"></div>
                 <div className="absolute inset-0 rounded-full border-[4px] border-blue-500 border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Scraping latest videos…</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">This might take a moment, grabbing the freshest data</p>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center fade-in">
             <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mb-6 shadow-md border border-gray-200 dark:border-gray-700 ring-4 ring-gray-50 dark:ring-gray-900/50">
               <Youtube size={32} className="text-gray-400 dark:text-gray-500" />
             </div>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No videos found</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm">
              We couldn't find any videos matching your current filters. Try adjusting the time period, keywords, or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 pt-6 text-xs">
            {filtered.map((video) => (
              <CompetitorVideoCard 
                key={`${video.channelHandle}-${video.videoId}`} 
                video={video} 
                onSchedule={setScheduleVideo} 
                onPreviewThumbnail={(url) => setPreviewThumbUrl(url)}
              />
            ))}
          </div>
        )}
      </div>

      <CompetitorSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onTypesChanged={handleTypesChanged} />
      {previewThumbUrl && <ThumbnailModal url={previewThumbUrl} onClose={() => setPreviewThumbUrl(null)} />}
      {scheduleVideo && (
        <ScheduleVideoModal
          video={scheduleVideo}
          channelType={activeTypeName}
          onClose={() => setScheduleVideo(null)}
        />
      )}
    </div>
  );
}

const TRENDING_PAGE_TABS = [
  { id: "watch", label: "Competitor Watch", shortLabel: "Watch", icon: Eye },
  { id: "cached", label: "Cached", shortLabel: "Cached", icon: Database },
  { id: "today", label: "Today's", shortLabel: "Today", icon: CalendarDays },
  { id: "tomorrow", label: "Tomorrow's", shortLabel: "Tomorrow", icon: CalendarDays },
];

const SCHEDULE_ASSIGNED_PILL = {
  pooja: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  mahalakshmi: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const SCHEDULE_FORMAT_PILL = {
  short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

const SCHEDULE_STATUS_META = {
  todo: { label: "To Do", pill: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  in_progress: { label: "In Progress", pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  completed: { label: "Done", pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

function getScheduleAssigneeDisplayName(key) {
  if (!key) return "";
  const k = String(key).toLowerCase();
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function taskMatchesScheduleAssigneeFilter(task, filterKey) {
  if (!filterKey) return true;
  const assignees = Array.isArray(task.assignedTo)
    ? task.assignedTo.filter(Boolean)
    : task.assignedTo
      ? [task.assignedTo]
      : [];
  if (filterKey === "Unassigned") return assignees.length === 0;
  return assignees.some((a) => String(a).toLowerCase() === filterKey.toLowerCase());
}

function buildScheduleAssignmentSummary(tasks) {
  const summary = {};
  const unassigned = { short: 0, long: 0, count: 0 };
  let hasUnassigned = false;

  tasks.forEach((t) => {
    const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo].filter(Boolean);
    const formats = Array.isArray(t.contentFormat) ? t.contentFormat : [t.contentFormat].filter(Boolean);

    if (assignees.length === 0) {
      hasUnassigned = true;
      unassigned.count += 1;
      formats.forEach((f) => {
        const fl = f.toLowerCase();
        if (fl.includes("short")) unassigned.short += 1;
        else if (fl.includes("long")) unassigned.long += 1;
      });
    } else {
      assignees.forEach((name) => {
        if (!summary[name]) summary[name] = { short: 0, long: 0, count: 0 };
        summary[name].count += 1;
        formats.forEach((f) => {
          const fl = f.toLowerCase();
          if (fl.includes("short")) summary[name].short += 1;
          else if (fl.includes("long")) summary[name].long += 1;
        });
      });
    }
  });

  if (hasUnassigned && unassigned.count > 0) {
    summary.Unassigned = unassigned;
  }
  return summary;
}

function buildScheduleDailySummary(tasks) {
  let long = 0;
  let short = 0;
  tasks.forEach((t) => {
    const formats = Array.isArray(t.contentFormat) ? t.contentFormat : [t.contentFormat].filter(Boolean);
    formats.forEach((f) => {
      const fl = f.toLowerCase();
      if (fl.includes("short")) short += 1;
      else if (fl.includes("long")) long += 1;
    });
  });
  return { long, short, total: long + short };
}

function formatScheduleDateLabel(key, todayTabKey, tomorrowTabKey) {
  if (!key) return "";
  const d = new Date(`${key}T00:00:00`);
  const calendarToday = toDateKey(new Date());
  const calendarTomorrow = getTomorrowDateKey();
  const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  if (key === todayTabKey && key === calendarToday) return `Today — ${label}`;
  if (key === tomorrowTabKey && key === calendarTomorrow) return `Tomorrow — ${label}`;
  return label;
}

function getScheduleTaskUrl(task) {
  if (task.url) return task.url;
  if (task.videoId && (task.platform === "youtube" || !task.platform)) {
    return `https://www.youtube.com/watch?v=${task.videoId}`;
  }
  return null;
}

function sortScheduleTasksForDisplay(a, b) {
  const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
  const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
  if (idA !== idB) return idA - idB;
  return String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" });
}

function ScheduleAssigneeBadges({ summary, assigneeFilter, onFilterChange, onClearFilter }) {
  if (Object.keys(summary).length === 0) return null;

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto max-w-full min-w-0 pb-0.5 scrollbar-hide">
      {assigneeFilter && (
        <button
          type="button"
          onClick={onClearFilter}
          className="inline-flex items-center shrink-0 px-2 py-0.5 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all shadow-sm"
        >
          All
        </button>
      )}
      {Object.entries(summary).map(([name, counts]) => {
        const isUn = name === "Unassigned";
        const isActive = assigneeFilter === name;
        const dotColor = isUn
          ? "bg-amber-400"
          : name.toLowerCase() === "pooja"
            ? "bg-pink-400"
            : name.toLowerCase() === "mahalakshmi"
              ? "bg-purple-400"
              : "bg-blue-400";
        const textColor = isUn
          ? "text-amber-600 dark:text-amber-400"
          : SCHEDULE_ASSIGNED_PILL[name.toLowerCase()]?.split(" ").pop() || "text-gray-700 dark:text-gray-300";
        const totalSum = (counts.long || 0) + (counts.short || 0);

        return (
          <button
            key={name}
            type="button"
            onClick={() => onFilterChange(isActive ? null : name)}
            title={`Filter by ${isUn ? name : getScheduleAssigneeDisplayName(name)}`}
            className={`flex items-center gap-1 shrink-0 pl-2 pr-1.5 py-0.5 rounded-xl border shadow-sm backdrop-blur-md transition-all cursor-pointer ${
              isActive
                ? "ring-2 ring-blue-500/50 border-blue-300 dark:border-blue-600 bg-blue-50/90 dark:bg-blue-900/30 shadow-md scale-[1.02]"
                : "bg-white/60 dark:bg-gray-800/60 border-white/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-px"
            }`}
          >
            <div className="flex items-center gap-1.5 mr-0.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
              <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${textColor}`}>
                {isUn ? name : getScheduleAssigneeDisplayName(name)}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {totalSum > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 shadow-sm border border-transparent mr-0.5">
                  {totalSum}
                </span>
              )}
              {counts.long > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-lg text-[9px] font-bold shrink-0 ${SCHEDULE_FORMAT_PILL.long} shadow-sm border border-transparent`}>
                  {counts.long}L
                </span>
              )}
              {counts.short > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-lg text-[9px] font-bold shrink-0 ${SCHEDULE_FORMAT_PILL.short} shadow-sm border border-transparent`}>
                  {counts.short}S
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ScheduledPipelineView({ dateKey, todayTabKey, tomorrowTabKey, tasks, loading, onRefresh }) {
  const navigate = useNavigate();
  const [assigneeFilter, setAssigneeFilter] = useState(null);

  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.scheduledDate && toDateKey(t.scheduledDate) === dateKey)
        .sort(sortScheduleTasksForDisplay),
    [tasks, dateKey],
  );

  const displayedTasks = useMemo(
    () => (assigneeFilter ? dayTasks.filter((t) => taskMatchesScheduleAssigneeFilter(t, assigneeFilter)) : dayTasks),
    [dayTasks, assigneeFilter],
  );

  const assignmentSummary = useMemo(() => buildScheduleAssignmentSummary(dayTasks), [dayTasks]);
  const dailySummary = useMemo(() => buildScheduleDailySummary(dayTasks), [dayTasks]);
  const completed = dayTasks.filter((t) => t.status === "completed").length;
  const inProgress = dayTasks.filter((t) => t.status === "in_progress").length;
  const isTodayTab = dateKey === todayTabKey;
  const emptyDateLabel = useMemo(() => {
    const calendarToday = toDateKey(new Date());
    const calendarTomorrow = getTomorrowDateKey();
    if (dateKey === todayTabKey && dateKey === calendarToday) return "today";
    if (dateKey === tomorrowTabKey && dateKey === calendarTomorrow) return "tomorrow";
    return formatScheduleTabLabel(dateKey);
  }, [dateKey, todayTabKey, tomorrowTabKey]);

  useEffect(() => {
    setAssigneeFilter(null);
  }, [dateKey]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-4 bg-white/70 dark:bg-gray-900/60 backdrop-blur border border-gray-200/80 dark:border-gray-800/80 rounded-xl sm:rounded-2xl flex-shrink-0">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-black whitespace-nowrap ${isTodayTab ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"}`}>
              {formatScheduleDateLabel(dateKey, todayTabKey, tomorrowTabKey)}
            </span>
            {dailySummary.total > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700/50 shadow-sm shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {dailySummary.total} Tasks
                </span>
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-1.5">
                  {dailySummary.long > 0 && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{dailySummary.long}L</span>
                  )}
                  {dailySummary.short > 0 && (
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{dailySummary.short}S</span>
                  )}
                </div>
              </div>
            )}
            {dayTasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50">
                <CheckCircle2 size={10} /> {completed}/{dayTasks.length}
              </span>
            )}
            {inProgress > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                <PlayCircle size={10} /> {inProgress}
              </span>
            )}
          </div>
          <ScheduleAssigneeBadges
            summary={assignmentSummary}
            assigneeFilter={assigneeFilter}
            onFilterChange={setAssigneeFilter}
            onClearFilter={() => setAssigneeFilter(null)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/admin/production-hub")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
          >
            Production Hub
            <ChevronRight size={12} />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Refresh schedule"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading schedule…</p>
          </div>
        ) : dayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-800/20">
            <CalendarDays className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" aria-hidden />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              No tasks scheduled for {emptyDateLabel}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Schedule competitor videos from Competitor Watch or Cached tabs, or add tasks in Production Hub.
            </p>
          </div>
        ) : displayedTasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">No tasks match this assignee filter.</p>
        ) : (
          <div className="space-y-2 pb-2">
            {displayedTasks.map((task) => {
              const taskUrl = getScheduleTaskUrl(task);
              const statusMeta = SCHEDULE_STATUS_META[task.status] || SCHEDULE_STATUS_META.todo;
              const formats = Array.isArray(task.contentFormat) ? task.contentFormat : [task.contentFormat].filter(Boolean);
              const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
              const hasTaskScript = Boolean(String(task.script ?? "").trim());

              return (
                <div
                  key={task._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {task.thumbnail ? (
                      <img src={task.thumbnail} alt="" className="w-16 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Video size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        {hasTaskScript && (
                          <ScrollText size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" aria-label="Has script" />
                        )}
                        {taskUrl ? (
                          <a
                            href={taskUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {task.title}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{task.title}</p>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {[task.channelType, task.channelName].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end pl-[4.25rem] sm:pl-0">
                    {assignees.map((name) => (
                      <span
                        key={name}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${SCHEDULE_ASSIGNED_PILL[name.toLowerCase()] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                      >
                        {getScheduleAssigneeDisplayName(name)}
                      </span>
                    ))}
                    {formats.map((fmt) => (
                      <span
                        key={fmt}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${SCHEDULE_FORMAT_PILL[fmt] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                      >
                        {fmt === "short" ? "Shorts" : fmt === "long" ? "Long" : fmt}
                      </span>
                    ))}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${statusMeta.pill}`}>
                      {statusMeta.label}
                    </span>
                    {taskUrl && (
                      <a
                        href={taskUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Open video"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CachedVideosView({ cacheRef, cacheVersion, keywordsState, onCachedKeywordsChange, onTypeKeywordsChange }) {
  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [compFormat, setCompFormat] = useState("long");
  const [compSort, setCompSort] = useState("views");
  const [activeKeyword, setActiveKeyword] = useState(null);
  const cachedTabKeywords = keywordsState?.cached || [];
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [showKeywordsDropdown, setShowKeywordsDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [previewThumbUrl, setPreviewThumbUrl] = useState(null);
  const [scheduleVideo, setScheduleVideo] = useState(null);
  const keywordsDropdownRef = useRef(null);
  const formatDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (keywordsDropdownRef.current && !keywordsDropdownRef.current.contains(event.target)) {
        setShowKeywordsDropdown(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target)) {
        setShowFormatDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTypesLoading(true);
      try {
        const { data } = await api.get("/competitor-types");
        if (!cancelled) setTypes(data);
      } catch {
        if (!cancelled) toast.error("Could not load channel types");
      } finally {
        if (!cancelled) setTypesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allKeywords = useMemo(
    () => unionKeywords(types, keywordsState),
    [types, keywordsState],
  );

  const cachedTypeCount = useMemo(() => {
    if (!cacheRef?.current) return 0;
    let count = 0;
    for (const key of cacheRef.current.keys()) {
      const entry = cacheRef.current.get(key);
      if (entry?.videos?.length) count += 1;
    }
    return count;
  }, [cacheRef, cacheVersion]);

  const mergedVideos = useMemo(
    () => mergeAllCachedVideos(cacheRef),
    [cacheRef, cacheVersion],
  );

  const baseFiltered = useMemo(() => {
    let list = [...mergedVideos];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }

    if (compFormat !== "all") {
      list = list.filter((v) => (compFormat === "short" ? isShortVideo(v) : !isShortVideo(v)));
    }

    return list;
  }, [mergedVideos, search, compFormat]);

  const applyKeywordFilter = useCallback((list) => {
    if (activeKeyword) {
      return list.filter((v) => videoTitleMatchesKeyword(v, activeKeyword));
    }
    if (allKeywords.length === 0) return list;
    return list.filter((v) => allKeywords.some((kw) => videoTitleMatchesKeyword(v, kw)));
  }, [activeKeyword, allKeywords]);

  const keywordCounts = useMemo(() => {
    const counts = {};
    allKeywords.forEach((kw) => {
      counts[kw] = baseFiltered.filter((v) => videoTitleMatchesKeyword(v, kw)).length;
    });
    return counts;
  }, [baseFiltered, allKeywords]);

  const visibleKeywords = useMemo(
    () => allKeywords.filter((kw) => (keywordCounts[kw] || 0) > 0),
    [allKeywords, keywordCounts],
  );

  const sortedAllKeywords = useMemo(
    () => sortKeywordsByMatchCount(allKeywords, keywordCounts),
    [allKeywords, keywordCounts],
  );

  const sortedVisibleKeywords = useMemo(
    () => sortKeywordsByMatchCount(visibleKeywords, keywordCounts),
    [visibleKeywords, keywordCounts],
  );

  useEffect(() => {
    if (activeKeyword && !(keywordCounts[activeKeyword] > 0)) {
      setActiveKeyword(null);
    }
  }, [activeKeyword, keywordCounts]);

  const filtered = useMemo(() => {
    let list = applyKeywordFilter([...baseFiltered]);

    if (compSort === "trending") {
      list.sort((a, b) => {
        const aMs = parsePublishedAgo(a.publishedText);
        const bMs = parsePublishedAgo(b.publishedText);
        const aTime = aMs === Infinity ? 31_536_000_000 * 5 : Math.max(aMs, 1000);
        const bTime = bMs === Infinity ? 31_536_000_000 * 5 : Math.max(bMs, 1000);
        return (b.views / bTime) - (a.views / aTime);
      });
    } else if (compSort === "views") {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      list.sort((a, b) => parsePublishedAgo(a.publishedText) - parsePublishedAgo(b.publishedText));
    }

    return list;
  }, [baseFiltered, compSort, applyKeywordFilter]);

  const persistCachedKeywordsLocal = useCallback((keywords) => {
    onCachedKeywordsChange(keywords);
  }, [onCachedKeywordsChange]);

  const addKeyword = useCallback(() => {
    const parsed = parseKeywordInput(newKeywordInput);
    if (!parsed.length) return;
    const toAdd = filterNewKeywords(parsed, allKeywords);
    if (!toAdd.length) {
      toast.error("Keyword already exists");
      return;
    }
    persistCachedKeywordsLocal([...cachedTabKeywords, ...toAdd]);
    setNewKeywordInput("");
  }, [newKeywordInput, allKeywords, cachedTabKeywords, persistCachedKeywordsLocal]);

  const removeKeyword = useCallback((keyword) => {
    const key = String(keyword || "").trim().toLowerCase();
    if (!key) return;

    const nextCached = cachedTabKeywords.filter((k) => k.toLowerCase() !== key);
    if (nextCached.length !== cachedTabKeywords.length) {
      persistCachedKeywordsLocal(nextCached);
    }

    for (const type of types) {
      const typeId = type?._id;
      if (!typeId) continue;
      const typeKeywords = keywordsState?.byType?.[typeId] || [];
      if (!typeKeywords.some((k) => k.toLowerCase() === key)) continue;
      onTypeKeywordsChange(
        typeId,
        typeKeywords.filter((k) => k.toLowerCase() !== key),
      );
    }

    if (activeKeyword && activeKeyword.toLowerCase() === key) {
      setActiveKeyword(null);
    }
  }, [
    cachedTabKeywords,
    activeKeyword,
    persistCachedKeywordsLocal,
    types,
    keywordsState?.byType,
    onTypeKeywordsChange,
  ]);

  const scheduleTypeName = useMemo(() => {
    if (!scheduleVideo?._cachedFromTypes?.length) return "";
    const typeId = scheduleVideo._cachedFromTypes[0];
    return types.find((t) => t._id === typeId)?.name || "";
  }, [scheduleVideo, types]);

  if (typesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading cached videos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-3 px-4 pt-3 pb-4">
      <div className="flex-shrink-0 z-30 space-y-2 overflow-visible">
        {/* Row 1: Summary stats + match count */}
        <div className="flex items-center justify-between gap-3 px-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 bg-blue-600 text-white">
              <Database size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">All cached videos</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {mergedVideos.length} {mergedVideos.length === 1 ? "video" : "videos"} · {cachedTypeCount} {cachedTypeCount === 1 ? "category" : "categories"} cached
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 h-9 px-2.5 bg-white/40 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700 rounded-xl shadow-sm flex-shrink-0">
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "match" : "matches"}
            </span>
          </div>
        </div>

        {/* Row 2: Keywords, format, sort, search */}
        <div className={`p-2 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/60 dark:border-gray-800/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-visible ${showKeywordsDropdown || showFormatDropdown || showSortDropdown ? "relative z-[110]" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 pb-0.5 -mb-0.5">
            {/* Manage keywords */}
            <div className="relative flex-shrink-0" ref={keywordsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowKeywordsDropdown(!showKeywordsDropdown)}
                className={`flex items-center justify-between h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 ${
                  showKeywordsDropdown || allKeywords.length > 0
                    ? "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15"
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Tag size={13} className="mr-1.5 flex-shrink-0" />
                  <span className="truncate max-w-[100px]">Manage keywords</span>
                </div>
                <ChevronDown size={12} className={`ml-1.5 opacity-50 flex-shrink-0 transition-transform ${showKeywordsDropdown ? "rotate-180" : ""}`} />
              </button>

              {showKeywordsDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-[18px] bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="px-3 pb-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Title keywords</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addKeyword();
                          }
                        }}
                        placeholder="e.g. gold | silver | loans"
                        className="flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={addKeyword}
                        disabled={!newKeywordInput.trim()}
                        className="h-8 px-2.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 leading-snug">
                      Includes keywords from all categories plus any you add here. Hover a row and use × to remove.
                    </p>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2" />
                  <div className="max-h-48 overflow-y-auto custom-scrollbar py-1">
                    {allKeywords.length === 0 ? (
                      <p className="px-4 py-3 text-[10px] text-gray-400 text-center">No keywords yet — add terms to filter by title</p>
                    ) : (
                      sortedAllKeywords.map((kw) => {
                        const kwCount = keywordCounts[kw];
                        const isCachedOnly = cachedTabKeywords.some((k) => k.toLowerCase() === kw.toLowerCase());
                        const isFromCategory = types.some((type) => {
                          const typeKeywords = keywordsState?.byType?.[type?._id] || [];
                          return typeKeywords.some((k) => k.toLowerCase() === kw.toLowerCase());
                        });
                        const removeTitle = isCachedOnly && !isFromCategory
                          ? "Remove from cached tab keywords"
                          : isFromCategory && !isCachedOnly
                            ? "Remove from category keywords"
                            : "Remove keyword";
                        return (
                          <div key={kw} className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 group">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveKeyword(activeKeyword === kw ? null : kw);
                                setShowKeywordsDropdown(false);
                              }}
                              className={`flex-1 min-w-0 flex items-center gap-1.5 text-left text-[10px] font-bold truncate transition-colors ${
                                activeKeyword === kw
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-700 dark:text-white"
                              }`}
                            >
                              <span className="truncate">{kw}</span>
                              {kwCount !== undefined && kwCount > 0 && (
                                <span className="flex-shrink-0 text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                                  {kwCount}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeKeyword(kw);
                              }}
                              className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              title={removeTitle}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Format */}
            <div className="relative flex-shrink-0" ref={formatDropdownRef}>
              <button
                type="button"
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                className={`flex items-center justify-between h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 ${
                  compFormat !== "all"
                    ? "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15"
                    : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400 hover:bg-white dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Video size={13} className={`mr-1.5 flex-shrink-0 ${compFormat !== "all" ? "text-amber-500" : "text-gray-400"}`} />
                  <span className="truncate max-w-[80px]">
                    {compFormat === "all" ? "Format" : COMP_FORMATS.find((f) => f.value === compFormat)?.label.replace(" Videos", "")}
                  </span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showFormatDropdown && (
                <div className="absolute top-full left-0 mt-2 w-36 rounded-[18px] bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-200">
                  {COMP_FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => { setCompFormat(f.value); setShowFormatDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold transition-colors ${
                        compFormat === f.value
                          ? "bg-gray-50 dark:bg-gray-900/40 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      {f.label}
                      {compFormat === f.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center justify-between h-9 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 text-[11px] font-semibold transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800/60"
              >
                <div className="flex items-center min-w-0">
                  <ArrowDownWideNarrow size={13} className="mr-1.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate max-w-[80px]">{COMP_SORTS.find((s) => s.value === compSort)?.label}</span>
                </div>
                <ChevronDown size={12} className="ml-1.5 opacity-50 flex-shrink-0" />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-2 w-36 rounded-[18px] bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {COMP_SORTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setCompSort(s.value); setShowSortDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold transition-colors ${
                        compSort === s.value
                          ? "bg-gray-50 dark:bg-gray-900/40 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      {s.label}
                      {compSort === s.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block w-[1px] h-6 bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

            {/* Search */}
            <div className="relative flex-1 min-w-[140px] flex-shrink-0">
              <div
                className={`flex items-center h-9 border rounded-xl bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 transition-all duration-300 w-full px-3 md:px-0 ${
                  searchExpanded || search ? "md:w-44 md:px-3" : "md:w-9 md:justify-center"
                }`}
              >
                <div className="hidden md:flex items-center w-full h-full">
                  {searchExpanded || search ? (
                    <div className="flex items-center w-full">
                      <Search size={13} className="text-gray-400 mr-2 flex-shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onBlur={() => setSearchExpanded(false)}
                        autoFocus={searchExpanded}
                        placeholder="Search cached…"
                        className="w-full bg-transparent text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                      />
                      {search && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearch("");
                            setSearchExpanded(false);
                          }}
                          className="text-gray-400 hover:text-gray-650 ml-1.5 flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchExpanded(true)}
                      className="w-full h-full flex items-center justify-center text-gray-500 hover:text-blue-500 transition-colors"
                      title="Search cached videos"
                    >
                      <Search size={13} />
                    </button>
                  )}
                </div>
                <div className="flex md:hidden items-center w-full">
                  <Search size={13} className="text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search cached…"
                    className="w-full bg-transparent text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-gray-400 hover:text-gray-650 ml-1.5 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Keyword pills — z-0 so filter-bar dropdowns stack above */}
        <div className="relative z-0 flex flex-wrap items-center gap-1.5 px-0.5">
          {sortedVisibleKeywords.map((kw) => (
            <FilterChip
              key={kw}
              active={activeKeyword === kw}
              onClick={() => setActiveKeyword(activeKeyword === kw ? null : kw)}
              count={keywordCounts[kw]}
            >
              {kw}
            </FilterChip>
          ))}
          {activeKeyword && (
            <button
              type="button"
              onClick={() => setActiveKeyword(null)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto relative px-2 pb-6">
        {mergedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center fade-in">
            <div className="w-24 h-24 bg-blue-50/50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 border border-blue-100/50 dark:border-blue-800/30 ring-8 ring-blue-50/20 dark:ring-blue-900/10">
              <Database size={40} className="text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-black tracking-tight text-gray-800 dark:text-gray-200 mb-2">No cached videos yet</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-5">
              Cached videos appear here after you browse categories in Competitor Watch. Data is shared across both tabs and kept for 60 minutes.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Layers size={14} />
              Switch to the Competitor Watch tab and select a category to start caching
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center fade-in">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mb-6 shadow-md border border-gray-200 dark:border-gray-700 ring-4 ring-gray-50 dark:ring-gray-900/50">
              <Youtube size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No videos found</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm">
              {allKeywords.length > 0
                ? activeKeyword
                  ? `No cached videos have "${activeKeyword}" in the title. Try another keyword or clear the filter.`
                  : "No cached videos match any of your configured keywords. Try adding keywords, adjusting format, or search."
                : "No cached videos match your current filters. Try adjusting format or search."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-4 pb-2">
            {filtered.map((video) => (
              <CachedVideoRow
                key={video.videoId}
                video={video}
                onSchedule={setScheduleVideo}
                onPreviewThumbnail={(url) => setPreviewThumbUrl(url)}
              />
            ))}
          </div>
        )}
      </div>

      {previewThumbUrl && <ThumbnailModal url={previewThumbUrl} onClose={() => setPreviewThumbUrl(null)} />}
      {scheduleVideo && (
        <ScheduleVideoModal
          video={scheduleVideo}
          channelType={scheduleTypeName}
          onClose={() => setScheduleVideo(null)}
        />
      )}
    </div>
  );
}

const EMPTY_KEYWORDS_STATE = { cached: [], byType: {} };

export default function TrendingHub() {
  const [pageTab, setPageTab] = useState("watch");
  const competitorVideoCacheRef = useRef(loadCompetitorVideoCacheMap());
  const [cacheVersion, setCacheVersion] = useState(0);
  const [keywordsState, setKeywordsState] = useState(EMPTY_KEYWORDS_STATE);
  const [keywordsReady, setKeywordsReady] = useState(false);
  const [scheduleTasks, setScheduleTasks] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const todayTabKey = useMemo(() => getTodayTabDateKey(), []);
  const tomorrowTabKey = useMemo(() => getTomorrowTabDateKey(), []);

  const loadScheduleTasks = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const { data } = await api.get("/video-tasks?bucket=schedule");
      setScheduleTasks(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load schedule");
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScheduleTasks();
  }, [loadScheduleTasks]);

  useEffect(() => {
    if (pageTab === "today" || pageTab === "tomorrow") {
      void loadScheduleTasks();
    }
  }, [pageTab, loadScheduleTasks]);

  const tabCounts = useMemo(() => {
    const countForDate = (dateKey) =>
      scheduleTasks.filter((t) => t.scheduledDate && toDateKey(t.scheduledDate) === dateKey).length;
    return {
      today: countForDate(todayTabKey),
      tomorrow: countForDate(tomorrowTabKey),
    };
  }, [scheduleTasks, todayTabKey, tomorrowTabKey]);

  const tabLabels = useMemo(
    () => ({
      today: formatScheduleTabLabel(todayTabKey),
      tomorrow: formatScheduleTabLabel(tomorrowTabKey),
    }),
    [todayTabKey, tomorrowTabKey],
  );

  const handleCacheChange = useCallback(() => {
    persistCompetitorVideoCacheMap(competitorVideoCacheRef.current);
    setCacheVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await hydrateCompetitorKeywords();
      if (!cancelled) {
        setKeywordsState(state);
        setKeywordsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleTypeKeywordsChange = useCallback(async (typeId, keywords) => {
    const normalized = await persistTypeKeywords(typeId, keywords);
    setKeywordsState((prev) => ({
      ...prev,
      byType: { ...prev.byType, [typeId]: normalized },
    }));
  }, []);

  const handleCachedKeywordsChange = useCallback(async (keywords) => {
    const normalized = await persistCachedKeywords(keywords);
    setKeywordsState((prev) => ({ ...prev, cached: normalized }));
  }, []);

  useEffect(() => {
    const expireCacheIfNeeded = () => {
      if (!isCompetitorVideoCacheExpired()) return;

      competitorVideoCacheRef.current.clear();
      clearCompetitorVideoCacheStorage();
      setCacheVersion((v) => v + 1);
    };

    expireCacheIfNeeded();
    const intervalId = setInterval(expireCacheIfNeeded, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AdminLayout title="Trending Hub" titleInfo="Competitor video analysis & tracking" icon={Youtube} contentFit noPadding>
      <div className="flex flex-col h-full min-h-0 overflow-y-auto sm:overflow-hidden w-full max-w-[1600px] mx-auto custom-scrollbar px-3 sm:px-4 pt-2 pb-4 gap-1.5">
        <PageTabBar
          tabs={TRENDING_PAGE_TABS}
          activeTab={pageTab}
          onChange={setPageTab}
          ariaLabel="Trending Hub views"
          tabCounts={tabCounts}
          labelOverrides={tabLabels}
          alwaysShowBadgeFor={["today", "tomorrow"]}
        />
        {pageTab === "today" ? (
          <ScheduledPipelineView
            dateKey={todayTabKey}
            todayTabKey={todayTabKey}
            tomorrowTabKey={tomorrowTabKey}
            tasks={scheduleTasks}
            loading={scheduleLoading}
            onRefresh={loadScheduleTasks}
          />
        ) : pageTab === "tomorrow" ? (
          <ScheduledPipelineView
            dateKey={tomorrowTabKey}
            todayTabKey={todayTabKey}
            tomorrowTabKey={tomorrowTabKey}
            tasks={scheduleTasks}
            loading={scheduleLoading}
            onRefresh={loadScheduleTasks}
          />
        ) : !keywordsReady ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading keywords…</p>
            </div>
          </div>
        ) : pageTab === "watch" ? (
          <CompetitorWatch
            cacheRef={competitorVideoCacheRef}
            onCacheChange={handleCacheChange}
            keywordsState={keywordsState}
            onTypeKeywordsChange={handleTypeKeywordsChange}
          />
        ) : (
          <CachedVideosView
            cacheRef={competitorVideoCacheRef}
            cacheVersion={cacheVersion}
            keywordsState={keywordsState}
            onCachedKeywordsChange={handleCachedKeywordsChange}
            onTypeKeywordsChange={handleTypeKeywordsChange}
          />
        )}
      </div>
    </AdminLayout>
  );
}
