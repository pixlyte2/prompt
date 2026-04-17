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
  Save,
  CalendarPlus,
  Filter,
  Layers,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";

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
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
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

function SearchInput({ value, onChange, placeholder, onClear }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-md group">
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
    default: "bg-blue-50/80 text-blue-700 border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40",
    success: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40",
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
  { value: "views", label: "Most viewed" },
  { value: "latest", label: "Latest" },
];

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

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
    { value: "soundarya", label: "Soundarya" },
  ];

  const FORMAT_PILL = {
    short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  };

  const ASSIGNED_PILL = {
    pooja: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    soundarya: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
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
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add to Board</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Schedule this video for content creation</p>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
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
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                className={`w-full px-3 py-2 rounded-lg border transition-all text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  !scheduledDate 
                    ? "bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 border-gray-100 dark:border-gray-800 opacity-60" 
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-medium text-red-700 dark:text-red-400 leading-tight">{error}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="ml-auto px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : (scheduledDate ? <Plus size={12} /> : <ListChecks size={12} />)}
              {scheduledDate ? "Schedule Task" : "Add to Backlog"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitorVideoCard({ video, onSchedule, onPreviewThumbnail }) {
  return (
    <div className="group flex flex-col rounded-2xl border border-white/40 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
      <a
        href={`https://www.youtube.com/watch?v=${video.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative overflow-hidden"
      >
        <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-800">
          <img
            src={video.thumbnail}
            alt=""
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {video.duration && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold tracking-wide text-white shadow-sm border border-white/10">
              {video.duration}
            </span>
          )}
          {video.isLive && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600/90 backdrop-blur-md text-[10px] font-bold text-white inline-flex items-center gap-1.5 shadow-sm border border-red-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/90 transform scale-75 group-hover:scale-100 transition-all duration-300 border border-white/20">
                <Play size={18} className="ml-0.5" />
             </div>
          </div>
        </div>
      </a>
      <div className="flex-1 p-2 flex flex-col">
        <h4 className="text-[10px] sm:text-[11px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors drop-shadow-sm">
          {video.title}
        </h4>
        <div className="mt-auto flex flex-col gap-1.5 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[10px] sm:text-[11px] text-gray-900 dark:text-gray-100 inline-flex items-center gap-1">
              <Eye size={10} className="text-blue-500 dark:text-blue-400" /> {video.viewsText || formatViews(video.views)}
            </span>
            <div className="flex items-center gap-1">
              {onSchedule && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSchedule(video); }}
                  className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gradient-to-br hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  title="Schedule this video"
                >
                  <CalendarPlus size={12} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[5rem] sm:max-w-[7rem] bg-gray-100/80 dark:bg-gray-700/80 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-gray-600/50">
              {video.channelName}
            </span>
            
            <div className="flex items-center gap-1 ml-auto">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(video.videoId, 'hd')); }}
                className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-500 hover:text-white transition-all"
              >
                HD
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(video.videoId, 'sd')); }}
                className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700/50 hover:bg-gray-500 hover:text-white transition-all"
              >
                SD
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[9px] opacity-60">
             <div className="flex items-center gap-1">
               <Clock size={9} /> {video.publishedText}
             </div>
          </div>
        </div>
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
  }, [open, fetchTypes]);

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

  const handleUpdateChannelFormat = async (typeId, channelHandle, format) => {
    setBusy(`format-${typeId}-${channelHandle}`);
    try {
      const { data } = await api.put(`/competitor-types/${typeId}/channels/${channelHandle}`, { videoFormat: format });
      setTypes((prev) => prev.map((t) => (t._id === typeId ? data : t)));
      onTypesChanged();
    } catch {
      toast.error("Failed to update format");
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
      setNewChannels((prev) => ({ ...prev, [typeId]: { handle: "", name: "", videoFormat: "long" } }));
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

  const handleMoveType = async (index, direction) => {
    const newTypes = [...types];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTypes.length) return;

    // Swap elements
    [newTypes[index], newTypes[targetIndex]] = [newTypes[targetIndex], newTypes[index]];

    // Prepare for backend
    const reordered = newTypes.map((t, idx) => ({ id: t._id, sortOrder: idx }));
    
    setBusy(`move-${newTypes[index]._id}`);
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
              {types.map((type) => {
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
                          onClick={() => handleMoveType(types.findIndex(t => t._id === type._id), "up")}
                          disabled={types.findIndex(t => t._id === type._id) === 0 || busy != null}
                          className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveType(types.findIndex(t => t._id === type._id), "down")}
                          disabled={types.findIndex(t => t._id === type._id) === types.length - 1 || busy != null}
                          className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all"
                        >
                          <ArrowDown size={13} />
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
                            max={200}
                            value={type.videosPerChannel}
                            onChange={(e) => {
                              const v = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 200);
                              setTypes((prev) => prev.map((t) => (t._id === type._id ? { ...t, videosPerChannel: v } : t)));
                            }}
                            onBlur={(e) => {
                              const v = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 200);
                              handleUpdateVpc(type._id, v);
                            }}
                            className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                          <span className="text-[10px] text-gray-400">(max 200)</span>
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
                              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{ch.name}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">@{ch.handle}</span>
                              <select
                                value={ch.videoFormat || "long"}
                                onChange={(e) => handleUpdateChannelFormat(type._id, ch.handle, e.target.value)}
                                disabled={busy === `format-${type._id}-${ch.handle}`}
                                className="ml-auto px-1.5 py-0.5 text-[10px] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none disabled:opacity-50"
                              >
                                <option value="long">Long</option>
                                <option value="short">Short</option>
                              </select>
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
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="@handle"
                            value={chInput.handle}
                            onChange={(e) => setNewChannels((prev) => ({ ...prev, [type._id]: { ...chInput, handle: e.target.value } }))}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                          <input
                            type="text"
                            placeholder="Display name"
                            value={chInput.name}
                            onChange={(e) => setNewChannels((prev) => ({ ...prev, [type._id]: { ...chInput, name: e.target.value } }))}
                            onKeyDown={(e) => e.key === "Enter" && handleAddChannel(type._id)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                          <select
                            value={chInput.videoFormat}
                            onChange={(e) => setNewChannels((prev) => ({ ...prev, [type._id]: { ...chInput, videoFormat: e.target.value } }))}
                            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          >
                            <option value="long">Long</option>
                            <option value="short">Short</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAddChannel(type._id)}
                            disabled={busy === `add-ch-${type._id}` || !chInput.handle?.trim() || !chInput.name?.trim()}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {busy === `add-ch-${type._id}` ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Save
                          </button>
                        </div>
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
                      max={200}
                      value={newTypeVpc}
                      onChange={(e) => setNewTypeVpc(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 200))}
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

function CompetitorWatch() {
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
  const typeDropdownRef = useRef(null);
  const periodDropdownRef = useRef(null);
  const viewDropdownRef = useRef(null);
  const channelDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) setShowTypeDropdown(false);
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) setShowPeriodDropdown(false);
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target)) setShowViewDropdown(false);
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target)) setShowChannelDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTypeName = useMemo(
    () => types.find((t) => t._id === activeType)?.name || "",
    [types, activeType],
  );

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

  const fetchVideos = useCallback(async (typeId, { silent = false, force = false } = {}) => {
    if (!typeId) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const params = `typeId=${typeId}${force ? "&force=true" : ""}`;
      const { data } = await api.get(`/competitors/videos?${params}`);
      setVideos(data.videos || []);
      setChannels(data.channels || []);
    } catch {
      toast.error("Could not load competitor videos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const forceRefresh = useRef(false);

  useEffect(() => {
    if (activeType) {
      setActiveChannel("all");
      fetchVideos(activeType, { force: forceRefresh.current });
      forceRefresh.current = false;
    }
  }, [activeType, fetchVideos, videoRefreshKey]);

  const handleTypesChanged = useCallback(() => {
    fetchTypes();
    forceRefresh.current = true;
    setVideoRefreshKey((k) => k + 1);
  }, [fetchTypes]);

  // Base list with channel + search filters only
  const baseFiltered = useMemo(() => {
    let list = [...videos];

    if (activeChannel !== "all") {
      list = list.filter((v) => v.channelHandle === activeChannel);
    }

    if (compSearch.trim()) {
      const q = compSearch.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }

    return list;
  }, [videos, activeChannel, compSearch]);

  // Period-filtered list (channel + search + period, no view filter) — used for viewCounts
  const periodFiltered = useMemo(() => {
    const periodMs = COMP_PERIODS.find((p) => p.value === period)?.ms || Infinity;
    if (periodMs === Infinity) return baseFiltered;
    return baseFiltered.filter((v) => parsePublishedAgo(v.publishedText) <= periodMs);
  }, [baseFiltered, period]);

  // View-filtered list (channel + search + minViews, no period filter) — used for periodCounts
  const viewFiltered = useMemo(() => {
    if (minViews === 0) return baseFiltered;
    return baseFiltered.filter((v) => (v.views || 0) >= minViews);
  }, [baseFiltered, minViews]);

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
    let list = [...baseFiltered];

    if (periodMs !== Infinity) {
      list = list.filter((v) => {
        const agoMs = parsePublishedAgo(v.publishedText);
        return agoMs <= periodMs;
      });
    }

    if (minViews > 0) {
      list = list.filter((v) => (v.views || 0) >= minViews);
    }

    if (compSort === "views") {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      list.sort((a, b) => parsePublishedAgo(a.publishedText) - parsePublishedAgo(b.publishedText));
    }

    return list;
  }, [baseFiltered, period, compSort, minViews]);

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
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-1.5 px-3 pt-2 pb-4">
      {/* Unified Filter Section */}
      <FilterBar className="flex-shrink-0 !p-1.5 z-30">
        <div className="flex flex-col lg:flex-row lg:items-end gap-2 w-full">
          {/* Group 1: Discovery & Categories */}
          <div className="flex items-center gap-3 p-2 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-white/40 dark:border-gray-700/40 shadow-sm flex-shrink-0">
             <div className="flex flex-col gap-1 relative" ref={typeDropdownRef}>
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                <Layers size={10} /> Category
              </span>
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                  activeType 
                    ? "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-500/25"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500"
                }`}
              >
                <span className="truncate max-w-[120px] sm:max-w-[150px] text-[11px] font-black uppercase tracking-tight">
                  {types.find(t => t._id === activeType)?.name || "Select Market"}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showTypeDropdown ? "rotate-180" : ""}`} />
              </button>

              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-[100] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700/50 mb-1">Available Categories</div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {types.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => { setActiveType(t._id); setShowTypeDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-all ${
                          activeType === t._id 
                            ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-500">{t.channels.length} CH</span>
                          {activeType === t._id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1.5" />
                  <button
                    onClick={() => { setSettingsOpen(true); setShowTypeDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[10px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <Settings size={14} /> <span>Configure Sources</span>
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1 self-end mb-1" />

            <div className="flex flex-col gap-1 relative min-w-[140px]" ref={channelDropdownRef}>
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                <Users size={10} /> Sources
              </span>
              <button
                onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                  activeChannel !== "all"
                    ? "bg-blue-50/50 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate text-[11px] font-bold">
                    {activeChannel === "all" ? "All Channels" : channels.find(c => c.handle === activeChannel)?.name}
                  </span>
                </div>
                <ChevronDown size={14} className={`opacity-50 transition-transform duration-300 ${showChannelDropdown ? "rotate-180" : ""}`} />
              </button>

              {showChannelDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl z-[100] py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    onClick={() => { setActiveChannel("all"); setShowChannelDropdown(false); }}
                    className={`w-full flex items-center px-4 py-2.5 text-xs font-bold transition-all ${
                      activeChannel === "all" 
                        ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    All Channels
                  </button>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar border-t border-gray-100 dark:border-gray-700">
                    {channels.map((ch) => (
                      <button
                        key={ch.handle}
                        onClick={() => { setActiveChannel(ch.handle); setShowChannelDropdown(false); }}
                        className={`w-full flex items-center px-4 py-2.5 text-xs font-bold transition-all ${
                          activeChannel === ch.handle 
                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <span className="truncate">{ch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group 2: Analysis & Filtering */}
          <div className="flex items-center gap-3 p-2 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700 flex-grow min-w-0">
            <div className="flex flex-col gap-1 relative ml-1" ref={periodDropdownRef}>
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                <Clock size={10} /> Time
              </span>
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 text-[11px] font-bold transition-all"
              >
                <span className="truncate">
                  {COMP_PERIODS.find(p => p.value === period)?.label}
                </span>
                <ChevronDown size={14} className={`opacity-40 transition-transform ${showPeriodDropdown ? "rotate-180" : ""}`} />
              </button>

              {showPeriodDropdown && (
                <div className="absolute top-full left-0 mt-2 w-44 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl z-[100] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  {COMP_PERIODS.map((p) => {
                    const count = p.value !== "all" ? periodCounts[p.value] : null;
                    return (
                      <button
                        key={p.value}
                        onClick={() => { setPeriod(p.value); setShowPeriodDropdown(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold transition-colors ${
                          period === p.value 
                            ? "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        {p.label}
                        {count > 0 && <span className="text-[9px] font-black opacity-60 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 relative" ref={viewDropdownRef}>
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                <Eye size={10} /> Views
              </span>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-300 ${
                  minViews > 0
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-white/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
                }`}
              >
                <span className="truncate text-[11px] font-bold">
                  {COMP_VIEW_FILTERS.find(vf => vf.value === minViews)?.label}
                </span>
                <ChevronDown size={14} className={`opacity-40 transition-transform ${showViewDropdown ? "rotate-180" : ""}`} />
              </button>

              {showViewDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl z-[100] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  {COMP_VIEW_FILTERS.map((vf) => (
                    <button
                      key={vf.value}
                      onClick={() => { setMinViews(vf.value); setShowViewDropdown(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold transition-colors ${
                        minViews === vf.value 
                          ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {vf.label}
                      {vf.value !== 0 && viewCounts[vf.value] > 0 && (
                        <span className="text-[9px] font-black opacity-60 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{viewCounts[vf.value]}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 mx-1 self-end mb-1" />

            <div className="flex flex-col gap-1 flex-grow min-w-0 relative">
               <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                <Search size={10} /> Search
              </span>
               <div className="w-full">
                 <SearchInput
                   value={compSearch}
                   onChange={setCompSearch}
                   onClear={() => setCompSearch("")}
                   placeholder="Search keywords..."
                 />
               </div>
            </div>

            <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 mx-1 self-end mb-1" />

            <div className="flex flex-col gap-1 flex-shrink-0">
               <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                <ArrowDownWideNarrow size={10} /> Rank
              </span>
              <SortSelect
                value={compSort}
                onChange={setCompSort}
                options={COMP_SORTS}
                icon={null}
              />
            </div>
          </div>

          {/* Group 3: Utility & Stats */}
          <div className="flex items-center gap-2 p-2 bg-gray-50/30 dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex-shrink-0 self-end mb-1 lg:mb-0">
            <button
              type="button"
              onClick={() => fetchVideos(activeType, { silent: true, force: true })}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110 shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 opacity-50" />
            <StatsBadge count={filtered.length} label={filtered.length === 1 ? "match" : "matches"} variant={filtered.length > 0 ? "success" : "default"} />
          </div>
        </div>
      </FilterBar>

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
              We couldn't find any videos matching your current filters. Try adjusting the time period or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 sm:gap-4 pt-6 text-xs">
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

export default function TrendingHub() {
  return (
    <AdminLayout title="Trending Hub" titleInfo="Competitor video analysis & tracking" icon={Youtube} contentFit>
      <div className="flex flex-col h-full min-h-0 overflow-y-auto sm:overflow-hidden w-full max-w-[1600px] mx-auto custom-scrollbar">
        <CompetitorWatch />
      </div>
    </AdminLayout>
  );
}
