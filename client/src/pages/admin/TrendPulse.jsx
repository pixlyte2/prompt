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
  Save,
  CalendarPlus,
  Filter,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";

// Shared UI Components
function FilterChip({ active, onClick, children, count, variant = "default" }) {
  const variants = {
    default: active
      ? "bg-blue-600 text-white shadow-sm"
      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400",
    red: active
      ? "bg-red-600 text-white shadow-sm"
      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${variants[variant]}`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function FilterSegment({ options, value, onChange, variant = "default" }) {
  const variants = {
    default: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
    red: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
  };

  const activeVariants = {
    default: "bg-blue-600 text-white",
    red: "bg-red-600 text-white",
  };

  return (
    <div className={`inline-flex rounded-lg border overflow-hidden shadow-sm ${variants[variant]}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option.value
              ? activeVariants[variant]
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {option.label}
          {option.count !== undefined && option.count > 0 && (
            <span className="ml-1.5 text-[10px] opacity-75">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, onClear }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function SortSelect({ value, onChange, options, icon: Icon }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-gray-500 dark:text-gray-400" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterBar({ children, className = "" }) {
  return (
    <div className={`bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-4 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

function FilterRow({ children, className = "" }) {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {children}
    </div>
  );
}

function FilterLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">
      {Icon && <Icon size={14} />}
      <span>{children}</span>
    </div>
  );
}

function StatsBadge({ count, label, variant = "default" }) {
  const variants = {
    default: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {variant === "success" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {count} {label}
    </span>
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

function ScheduleVideoModal({ video, channelType, onClose }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [contentFormat, setContentFormat] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86_400_000).toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
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

  const FORMAT_PILL = {
    short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  };

  const PLATFORM_META = {
    youtube: { icon: Youtube, label: "YouTube", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
    instagram: { icon: Users, label: "Instagram", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20" },
    facebook: { icon: Users, label: "Facebook", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
    website: { icon: Search, label: "Website", color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800" },
  };

  if (video && !initialized) {
    setTitle(video.title || "");
    setPlatform("youtube");
    setContentFormat([]); // Initialize as empty array for multiple selection
    setInitialized(true);
  }

  if (!video && initialized) {
    setInitialized(false);
  }

  if (!video) return null;

  const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const canSave = title.trim() && channelType && scheduledDate;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
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
              onClick={() => { toast.dismiss(t.id); navigate("/admin/video-board"); }}
            >
              View Board
            </button>
          </span>
        ),
        { duration: 4000 },
      );
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save task");
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Channel Type</label>
              <div className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300">
                {channelType}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave}
            className="ml-auto px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add to Board
          </button>
        </div>
      </div>
    </div>
  );
}

function CompetitorVideoCard({ video, onSchedule }) {
  return (
    <div className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all">
      <a
        href={`https://www.youtube.com/watch?v=${video.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-700">
          <img
            src={video.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {video.duration && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-medium text-white">
              {video.duration}
            </span>
          )}
          {video.isLive && (
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-red-600 text-[10px] font-bold text-white inline-flex items-center gap-1">
              <Radio size={9} /> LIVE
            </span>
          )}
        </div>
      </a>
      <div className="flex-1 p-2">
        <h4 className="text-[10px] font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {video.title}
        </h4>
        <div className="flex flex-col gap-1 text-[10px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span className="font-bold text-base text-gray-900 dark:text-white inline-flex items-center gap-1">
              <Eye size={14} /> {video.viewsText || formatViews(video.views)}
            </span>
            {onSchedule && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSchedule(video); }}
                className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                title="Schedule this video"
              >
                <CalendarPlus size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-600 dark:text-gray-300 truncate max-w-[8rem]">
              {video.channelName}
            </span>
            {video.publishedText && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="inline-flex items-center gap-0.5">
                  <Clock size={9} /> {video.publishedText}
                </span>
              </>
            )}
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
      });
      setTypes((prev) => prev.map((t) => (t._id === typeId ? data : t)));
      setNewChannels((prev) => ({ ...prev, [typeId]: { handle: "", name: "" } }));
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
    } catch {
      toast.error("Failed to remove channel");
    } finally {
      setBusy(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
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
                const chInput = newChannels[type._id] || { handle: "", name: "" };
                return (
                  <div key={type._id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : type._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{type.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{type.channels.length} channels</span>
                    </button>
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
                          <button
                            type="button"
                            onClick={() => handleAddChannel(type._id)}
                            disabled={busy === `add-ch-${type._id}` || !chInput.handle?.trim() || !chInput.name?.trim()}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                          >
                            {busy === `add-ch-${type._id}` ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                            Add
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
  const [loading, setLoading] = useState(true);
  const [typesLoading, setTypesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("all");
  const [compSort, setCompSort] = useState("views");
  const [activeChannel, setActiveChannel] = useState("all");
  const [compSearch, setCompSearch] = useState("");
  const [minViews, setMinViews] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleVideo, setScheduleVideo] = useState(null);

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
      setActiveType((prev) => {
        if (!prev && data.length) return data[0]._id;
        if (prev && !data.find((t) => t._id === prev)) return data.length ? data[0]._id : null;
        return prev;
      });
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-3">
      {/* Unified Filter Section */}
      <FilterBar className="flex-shrink-0">
        {/* Type selector and time period */}
        <FilterRow>
          <FilterLabel icon={Youtube}>Channel Types:</FilterLabel>
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            {types.map((t) => (
              <FilterChip
                key={t._id}
                active={activeType === t._id}
                onClick={() => setActiveType(t._id)}
                count={t.channels.length}
                variant="red"
              >
                {t.name}
              </FilterChip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex-shrink-0 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Manage channel types"
          >
            <Settings size={16} />
          </button>
        </FilterRow>

        {/* Time period and view filters */}
        <FilterRow>
          <FilterLabel icon={Clock}>Time Period:</FilterLabel>
          <FilterSegment
            options={COMP_PERIODS.filter((p) => p.value === "all" || (periodCounts[p.value] || 0) > 0).map((p) => ({
              value: p.value,
              label: p.label,
              count: p.value !== "all" && (periodCounts[p.value] || 0) > 0 ? periodCounts[p.value] : undefined
            }))}
            value={period}
            onChange={setPeriod}
            variant="red"
          />
          
          <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          
          <FilterLabel icon={Eye}>Views:</FilterLabel>
          <div className="flex items-center gap-1.5">
            {COMP_VIEW_FILTERS.filter((vf) => vf.value === 0 || (viewCounts[vf.value] || 0) > 0).map((vf) => (
              <FilterChip
                key={vf.value}
                active={minViews === vf.value}
                onClick={() => setMinViews(vf.value)}
                count={viewCounts[vf.value]}
              >
                {vf.label}
              </FilterChip>
            ))}
          </div>
        </FilterRow>

        {/* Channels, search and actions */}
        <FilterRow>
          <FilterLabel icon={Users}>Channels:</FilterLabel>
          <div className="flex items-center gap-1.5">
            <FilterChip
              active={activeChannel === "all"}
              onClick={() => setActiveChannel("all")}
            >
              All Channels
            </FilterChip>
            {channels.map((ch) => (
              <FilterChip
                key={ch.handle}
                active={activeChannel === ch.handle}
                onClick={() => setActiveChannel(ch.handle)}
              >
                {ch.name}
              </FilterChip>
            ))}
          </div>
          
          <SearchInput
            value={compSearch}
            onChange={setCompSearch}
            placeholder="Search videos…"
            onClear={() => setCompSearch("")}
          />
          
          <SortSelect
            value={compSort}
            onChange={setCompSort}
            options={COMP_SORTS}
            icon={ArrowDownWideNarrow}
          />
          
          <div className="flex items-center gap-3 ml-auto">
            <StatsBadge count={filtered.length} label={filtered.length === 1 ? "video" : "videos"} />
            <button
              type="button"
              onClick={() => fetchVideos(activeType, { silent: true, force: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </FilterRow>
      </FilterBar>

      {/* Video grid */}
      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {refreshing && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
              <Loader2 size={14} className="animate-spin" />
              Refreshing videos… this may take a moment
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-red-200 dark:border-red-800 border-t-red-600 dark:border-t-red-400 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Scraping videos from channels…</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">This may take up to a minute for large channel lists</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Play size={24} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No videos found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Try changing the time period or channel filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {filtered.map((video) => (
              <CompetitorVideoCard key={`${video.channelHandle}-${video.videoId}`} video={video} onSchedule={setScheduleVideo} />
            ))}
          </div>
        )}
      </div>

      <CompetitorSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onTypesChanged={handleTypesChanged} />
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

export default function TrendPulse() {
  return (
    <AdminLayout title="TrendPulse" titleInfo="Competitor video analysis & tracking" icon={Youtube} contentFit>
      <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-[1600px] mx-auto">
        <CompetitorWatch />
      </div>
    </AdminLayout>
  );
}
