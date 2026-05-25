import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { toast } from "react-hot-toast";
import {
  LayoutDashboard,
  Search,
  X,
  RefreshCw,
  Eye,
  Trash2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  Loader2,
  CheckCircle2,
  Circle,
  PlayCircle,
  Youtube,
  Plus,
  Link,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ListChecks,
  Pencil,
  Instagram,
  Facebook,
  Globe,
  Square,
  CheckSquare,
  Download,
  Filter,
  Image,
  ScrollText,
  Mic,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api, { httpClient } from "../../services/api";
import { downloadVoiceOverFile, uploadVoiceOverFile } from "../../utils/voiceOverDownload";
import { VOICE_OVER_ACCEPT, isVoiceOverFileAllowed, voiceOverFileTypeHint } from "../../constants/voiceOverFileTypes";

// Shared UI Components
function FilterChip({ active, onClick, children, count, variant = "default" }) {
  const variants = {
    default: active
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02] border-transparent"
      : "bg-white/60 dark:bg-gray-800/50 backdrop-blur-md text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:shadow-md hover:-translate-y-0.5",
    success: active
      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02] border-transparent"
      : "bg-white/60 dark:bg-gray-800/50 backdrop-blur-md text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-800 hover:border-emerald-400/50 dark:hover:border-emerald-500/50 hover:shadow-md hover:-translate-y-0.5",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${variants[variant]}`}
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
    success: "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm",
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
                ? (variant === 'success' ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300")
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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={14} className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-7 py-1 rounded-lg sm:rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-[10px] sm:text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50 dark:focus:border-blue-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function FilterBar({ children, className = "" }) {
  return (
    <div className={`relative overflow-visible rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/30 dark:shadow-black/30 p-1.5 sm:p-2 flex flex-col gap-1.5 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-gray-800/40 dark:to-gray-900/10 pointer-events-none rounded-xl sm:rounded-2xl lg:rounded-3xl" />
      <div className="relative z-10 flex flex-col gap-2 w-full">
        {children}
      </div>
    </div>
  );
}

function FilterRow({ children, className = "" }) {
  return (
    <div className={`flex items-center gap-1 sm:gap-2 flex-wrap w-full ${className}`}>
      {children}
    </div>
  );
}

function FilterLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 px-1 sm:px-1.5 text-[11px] sm:text-xs font-bold tracking-tight text-gray-700 dark:text-gray-300 flex-shrink-0">
      {Icon && <Icon size={12} className="text-blue-500 dark:text-blue-400 drop-shadow-sm sm:w-3.5 sm:h-3.5 w-3 h-3" />}
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
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${variants[variant]}`}>
      {variant === "success" && <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>}
      <span className="text-sm">{count}</span>
      <span className="opacity-80 font-medium">{label}</span>
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

function getThumbnailUrl(videoId, type = 'hd') {
  if (!videoId) return "";
  if (type === 'hd') return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

const STATUS_META = {
  todo: { label: "To Do", color: "text-gray-400 dark:text-gray-500", pill: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  in_progress: { label: "In Progress", color: "text-blue-500", pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  completed: { label: "Done", color: "text-emerald-500", pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};
const STATUS_ORDER = ["todo", "in_progress", "completed"];
const NEXT_STATUS = { todo: "in_progress", in_progress: "completed" };
const PREV_STATUS = { in_progress: "todo", completed: "in_progress" };

const PLATFORM_META = {
  youtube: { icon: Youtube, label: "YouTube", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
  instagram: { icon: Instagram, label: "Instagram", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20" },
  facebook: { icon: Facebook, label: "Facebook", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
  website: { icon: Globe, label: "Website", color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800" },
};

const FORMAT_OPTIONS = [
  { value: "short", label: "Shorts" },
  { value: "long", label: "Long" },
];

const ASSIGNED_OPTIONS = [
  { value: "pooja", label: "Pooja" },
  { value: "mahalakshmi", label: "Mahalakshmi" },
];

const getAssigneeDisplayName = (key) => {
  if (!key) return "";
  const k = String(key).toLowerCase();
  return k.charAt(0).toUpperCase() + k.slice(1);
};

const FORMAT_PILL = {
  short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

const ASSIGNED_PILL = {
  pooja: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  mahalakshmi: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const VIEWS_PILL =
  "bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/50";

/** Prefer numeric `views`; otherwise parse `viewsText` (commas, optional K/M/L suffix). */
function parseViewsCount(task) {
  if (task?.views != null && Number.isFinite(Number(task.views))) {
    return Math.round(Number(task.views));
  }
  const s = String(task?.viewsText || "")
    .replace(/,/g, "")
    .trim();
  if (!s) return null;
  const suffixed = s.match(/(\d+(?:\.\d+)?)\s*([kKmMlL])\b/i);
  if (suffixed) {
    let n = parseFloat(suffixed[1]);
    const u = suffixed[2].toLowerCase();
    if (u === "k") n *= 1000;
    else if (u === "m") n *= 1_000_000;
    else if (u === "l") n *= 100_000;
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

/** Thousands as K, lakhs (1e5) as L — for compact row pills. */
function formatViewsKL(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x) || x <= 0) return null;
  const oneDec = (v) => {
    const r = Math.round(v * 10) / 10;
    const str = r.toFixed(1);
    return str.endsWith(".0") ? String(Math.round(r)) : str;
  };
  if (x < 1000) return String(x);
  if (x < 100_000) return `${oneDec(x / 1000)}K`;
  return `${oneDec(x / 100_000)}L`;
}

const ZERO_BOARD_STATS = {
  overdue: 0,
  today: 0,
  thisWeek: 0,
  backlog: 0,
  scheduled: 0,
  completed: 0,
  active: 0,
};

function exportToCsv(tasks) {
  const headers = ["Title", "Platform", "Format", "Channel Type", "Channel", "Status", "Scheduled Date", "Views", "Notes", "Script", "Voice Over", "URL"];
  const rows = tasks.map((t) => {
    const viewsNum = parseViewsCount(t);
    return [
    `"${(t.title || "").replace(/"/g, '""')}"`,
    t.platform || "youtube",
    t.contentFormat || "",
    t.channelType || "",
    `"${(t.channelName || "").replace(/"/g, '""')}"`,
    (STATUS_META[t.status]?.label) || t.status,
    t.scheduledDate ? toDateKey(t.scheduledDate) : "",
    viewsNum != null ? String(viewsNum) : (t.viewsText || t.views || ""),
    `"${(t.notes || "").replace(/"/g, '""')}"`,
    `"${(t.script || "").replace(/"/g, '""')}"`,
    `"${(t.voiceOverOriginalName || "").replace(/"/g, '""')}"`,
    getTaskUrl(t) || "",
  ];
  });
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  // Prepend UTF-8 BOM (\uFEFF) so Excel and mobile sheet viewers parse the CSV as UTF-8
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-hub-${toDateKey(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function toDateKey(d) {
  if (!d || d === "null" || d === "undefined") return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(key) {
  if (!key || key === "no-date") return "Backlog";
  const d = new Date(key + "T00:00:00");
  const today = new Date();
  const todayKey = toDateKey(today);
  const tmrw = new Date(today);
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwKey = toDateKey(tmrw);
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const yestKey = toDateKey(yest);
  const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  if (key === todayKey) return `Today — ${label}`;
  if (key === tmrwKey) return `Tomorrow — ${label}`;
  if (key === yestKey) return `Yesterday — ${label}`;
  return label;
}

function getDateCategory(key) {
  if (!key || key === "no-date") return "backlog";
  const today = toDateKey(new Date());
  if (key < today) return "overdue";
  if (key === today) return "today";
  return "upcoming";
}

function detectPlatform(url) {
  if (!url) return "website";
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.com") || u.includes("fb.watch")) return "facebook";
  return "website";
}

function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getTaskUrl(task) {
  if (task.url) return task.url;
  if (task.videoId && (task.platform === "youtube" || !task.platform)) {
    return `https://www.youtube.com/watch?v=${task.videoId}`;
  }
  return null;
}

function getTaskThumbnail(task) {
  if (task.thumbnail) return task.thumbnail;
  const ytId = task.videoId || extractYoutubeId(task.url);
  if (ytId) return `https://i.ytimg.com/vi/${ytId}/default.jpg`;
  return null;
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, count, color, bgColor }) {
  return (
    <div className={`flex items-center gap-1.5 rounded bg-transparent border-none min-w-0 transition-opacity hover:opacity-80`}>
      <div className={`flex-shrink-0 w-4.5 h-4.5 rounded flex items-center justify-center ${color} ring-1 ring-inset ring-white/10`}>
        <Icon size={11} />
      </div>
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="text-[13px] sm:text-[15px] font-black text-gray-900 dark:text-white tabular-nums leading-none">{count}</span>
        <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter truncate">{label}</span>
      </div>
    </div>
  );
}

/* ─── Status Checkbox ─── */
function StatusCheckbox({ status, onClick }) {
  if (status === "completed") {
    return (
      <button onClick={onClick} className="flex-shrink-0 text-emerald-500 hover:text-emerald-600 transition-colors" title="Mark incomplete">
        <CheckSquare size={24} />
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button onClick={onClick} className="flex-shrink-0 relative" title="Mark done">
        <Square size={24} className="text-blue-400" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
        </div>
      </button>
    );
  }
  return (
    <button onClick={onClick} className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors" title="Start task">
      <Square size={24} />
    </button>
  );
}

/* ─── Platform Icon ─── */
function PlatformIcon({ platform, size = 8 }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.website;
  const Icon = meta.icon;
  return <Icon size={size} className={`${meta.color} flex-shrink-0`} />;
}

function hasTaskNotes(task) {
  return Boolean(String(task?.notes ?? "").trim());
}

function hasTaskScript(task) {
  return Boolean(String(task?.script ?? "").trim());
}

function hasTaskVoiceOver(task) {
  return Boolean(String(task?.voiceOverStoredName ?? "").trim());
}

/* ─── Notes / script / voice-over detail modal ─── */
function TaskDetailModal({ task, onClose, onDownloadVoiceOver, voiceOverDownloadingIds, playingTaskId, audioPlaying, audioLoading, onPlayToggle }) {
  if (!task) return null;
  const notesBody = String(task.notes ?? "").trim();
  const scriptBody = String(task.script ?? "").trim();
  const hasVoice = hasTaskVoiceOver(task);
  const voiceDownloading = voiceOverDownloadingIds?.has(String(task._id)) ?? false;
  const isPlayingThisTask = playingTaskId === String(task._id);
  const titleBits = [];
  if (notesBody) titleBits.push("Notes");
  if (scriptBody) titleBits.push("Script");
  if (hasVoice) titleBits.push("Voice-over");
  const modalTitle = titleBits.length ? titleBits.join(" · ") : "Details";

  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-labelledby="task-detail-modal-title"
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="min-w-0">
            <h3 id="task-detail-modal-title" className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
              {modalTitle}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-3 overflow-y-auto custom-scrollbar flex-1 min-h-0 space-y-4">
          {notesBody && (
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Notes</h4>
              <pre className="whitespace-pre-wrap text-[13px] text-gray-800 dark:text-gray-100 leading-relaxed font-sans break-words">
                {notesBody}
              </pre>
            </section>
          )}
          {scriptBody && (
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Script</h4>
              <pre className="whitespace-pre-wrap text-[13px] text-gray-800 dark:text-gray-100 leading-relaxed font-sans break-words">
                {scriptBody}
              </pre>
            </section>
          )}
          {hasVoice && (
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Voice-over</h4>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-gray-700 dark:text-gray-200 truncate max-w-[200px]" title={task.voiceOverOriginalName || ""}>
                  {task.voiceOverOriginalName || "Uploaded file"}
                </span>
                
                <button
                  type="button"
                  disabled={audioLoading && isPlayingThisTask}
                  onClick={() => onPlayToggle?.(task)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isPlayingThisTask && audioPlaying
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {audioLoading && isPlayingThisTask ? (
                    <Loader2 size={12} className="animate-spin shrink-0" aria-hidden />
                  ) : isPlayingThisTask && audioPlaying ? (
                    <Pause size={12} className="shrink-0" />
                  ) : (
                    <PlayCircle size={12} className="shrink-0" />
                  )}
                  <span>{isPlayingThisTask && audioPlaying ? "Playing" : "Listen"}</span>
                </button>

                <button
                  type="button"
                  disabled={voiceDownloading}
                  aria-busy={voiceDownloading}
                  onClick={() => onDownloadVoiceOver?.(task)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-wait disabled:pointer-events-none shadow-sm"
                >
                  {voiceDownloading ? (
                    <Loader2 size={12} className="animate-spin shrink-0" aria-hidden />
                  ) : (
                    <Download size={12} className="shrink-0" aria-hidden />
                  )}
                  Download file
                </button>
              </div>
            </section>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Row for a single task ─── */
const TaskRow = memo(function TaskRow({ 
  task, onMove, onDelete, onEdit, onPreviewThumbnail, onOpenDetail, onDownloadVoiceOver, voiceOverDownloadingIds,
  playingTaskId, audioPlaying, audioLoading, onPlayToggle
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const meta = STATUS_META[task.status] || STATUS_META.todo;
  const platform = task.platform || "youtube";
  const taskUrl = getTaskUrl(task);
  const thumb = getTaskThumbnail(task);
  const ytId = task.videoId || extractYoutubeId(task.url);
  const platMeta = PLATFORM_META[platform] || PLATFORM_META.website;
  const isPlayingThisTask = playingTaskId === String(task._id);

  const handleStatusClick = () => {
    const next = NEXT_STATUS[task.status];
    if (next) onMove(task._id, next);
    else onMove(task._id, PREV_STATUS[task.status]);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group flex flex-col sm:flex-row sm:items-center gap-2 px-2.5 py-2 sm:py-1 bg-white dark:bg-gray-800/80 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-blue-400/60 dark:hover:border-blue-700/60 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-all duration-300 hover:shadow-sm cursor-grab active:cursor-grabbing"
    >
      {/* Group 1: Main Info (Checkbox, Edit/Delete Actions, Thumbnail, Title/Channel/Views) */}
      <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:flex-1 sm:contents">
        {/* Checkbox */}
        <div className="scale-100 flex-shrink-0">
          <StatusCheckbox status={task.status} onClick={handleStatusClick} />
        </div>

        {/* Actions (Edit Icon, Delete Icon) - Left on desktop, Right-aligned on mobile */}
        <div className="flex-shrink-0 flex items-center gap-0.5 opacity-60 sm:opacity-40 group-hover:opacity-100 transition-opacity ml-auto sm:ml-0 order-last sm:order-none">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
            title="Edit"
          >
            <Pencil className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm("Delete this task?")) onDelete(task._id); }}
            className="p-1 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Video ID Big Pill on desktop */}
        {task.customVideoId && (
          <span className="hidden sm:inline-flex flex-shrink-0 items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 shadow-sm min-h-[28px]">
            ID: {task.customVideoId}
          </span>
        )}

        {/* Thumbnail / Platform icon (video Image) */}
        {thumb ? (
          <a
            href={taskUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-10 h-6 sm:w-12 sm:h-7.5 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 relative group/thumb shadow-sm"
          >
            <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
              <ExternalLink size={12} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
            </div>
            {task.duration && (
              <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-black/75 text-[9px] font-semibold text-white rounded-tl">
                {task.duration}
              </span>
            )}
          </a>
        ) : (
          <a
            href={taskUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-shrink-0 w-9 h-5.5 sm:w-10 sm:h-6.5 rounded flex items-center justify-center ${platMeta.bg}`}
          >
            <PlatformIcon platform={platform} size={14} />
          </a>
        )}

        {/* Title + channel */}
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] sm:text-[11px] font-semibold leading-tight truncate ${task.status === "completed" ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5 opacity-80 scale-90 sm:scale-95 origin-left">
            <PlatformIcon platform={platform} size={7} />
            {task.channelName && (
              <span className="text-[7.5px] text-gray-500 dark:text-gray-400 truncate max-w-[8rem]">
                {task.channelName}
              </span>
            )}
            {/* Views count pill inline on desktop */}
            {(() => {
              const viewsN = parseViewsCount(task);
              const viewsShort = viewsN != null ? formatViewsKL(viewsN) : null;
              if (!viewsShort) return null;
              return (
                <>
                  <span className="hidden sm:inline-block w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-sm min-h-[26px] ${VIEWS_PILL}`}
                    title={`${viewsN.toLocaleString("en-IN")} views`}
                  >
                    <Eye size={11} className="flex-shrink-0 opacity-90" />
                    {viewsShort}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Group 2: Pills (Script, VO, Notes, Format, HD/SD, Assignees, Status, Undo) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto pl-8 sm:pl-0 sm:contents">
        {/* Custom Video ID Pill on mobile */}
        {task.customVideoId && (
          <span className="inline-flex sm:hidden flex-shrink-0 items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 shadow-sm min-h-[22px]">
            ID: {task.customVideoId}
          </span>
        )}

        {/* Views count pill on mobile */}
        {(() => {
          const viewsN = parseViewsCount(task);
          const viewsShort = viewsN != null ? formatViewsKL(viewsN) : null;
          if (!viewsShort) return null;
          return (
            <span
              className={`inline-flex sm:hidden items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight shadow-sm min-h-[22px] ${VIEWS_PILL}`}
              title={`${viewsN.toLocaleString("en-IN")} views`}
            >
              <Eye size={10} className="flex-shrink-0 opacity-90" />
              {viewsShort}
            </span>
          );
        })()}

        {/* Script — opens same detail modal */}
        {hasTaskScript(task) && (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail?.(task);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wide bg-violet-50 text-violet-800 border border-violet-200/90 dark:bg-violet-900/35 dark:text-violet-100 dark:border-violet-700/60 shadow-sm hover:bg-violet-100 dark:hover:bg-violet-900/55 hover:border-violet-300 dark:hover:border-violet-500 transition-colors cursor-pointer min-h-[22px] sm:min-h-[26px]"
            title="Script — tap to read"
            aria-label="Open script"
          >
            <ScrollText size={12} className="flex-shrink-0 opacity-90 sm:w-3.5 sm:h-3.5" aria-hidden />
            <span>Script</span>
          </button>
        )}

        {/* Voice-over (VO) */}
        {hasTaskVoiceOver(task) && (
          <button
            type="button"
            disabled={audioLoading && isPlayingThisTask}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onPlayToggle?.(task);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wide transition-all min-h-[22px] sm:min-h-[26px] ${
              isPlayingThisTask && audioPlaying
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-900/35 dark:text-emerald-100 dark:border-emerald-700/60 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/55 hover:border-emerald-300 dark:hover:border-emerald-500 active:scale-95 cursor-pointer"
            }`}
            title={isPlayingThisTask && audioPlaying ? "Voice-over — playing (click to pause)" : "Voice-over — listen inline"}
            aria-label={isPlayingThisTask && audioPlaying ? "Pause voice-over" : "Listen to voice-over"}
          >
            {audioLoading && isPlayingThisTask ? (
              <Loader2 size={12} className="flex-shrink-0 opacity-90 animate-spin sm:w-3.5 sm:h-3.5" aria-hidden />
            ) : isPlayingThisTask && audioPlaying ? (
              <Pause size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
            ) : (
              <Play size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
            )}
            <span>VO</span>
          </button>
        )}

        {/* Notes — opens detail modal */}
        {hasTaskNotes(task) && (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail?.(task);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wide bg-sky-50 text-sky-800 border border-sky-200/90 dark:bg-sky-900/35 dark:text-sky-100 dark:border-sky-700/60 shadow-sm hover:bg-sky-100 dark:hover:bg-sky-900/55 hover:border-sky-300 dark:hover:border-sky-500 transition-colors cursor-pointer min-h-[22px] sm:min-h-[26px]"
            title="Notes — tap to read"
            aria-label="Open notes"
          >
            <FileText size={12} className="flex-shrink-0 opacity-90 sm:w-3.5 sm:h-3.5" aria-hidden />
            <span>Notes</span>
          </button>
        )}

        {/* Content format pills */}
        {task.contentFormat && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {(Array.isArray(task.contentFormat) ? task.contentFormat : [task.contentFormat]).map(fmt => (
              <span
                key={fmt}
                className={`inline-flex items-center text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm border border-transparent min-h-[22px] sm:min-h-[26px] ${FORMAT_PILL[fmt] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
              >
                {FORMAT_OPTIONS.find((f) => f.value === fmt)?.label || fmt}
              </span>
            ))}
          </div>
        )}

        {/* Thumbnail pill (HD/SD buttons) */}
        {ytId && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300/90 flex-shrink-0 shadow-sm border border-amber-100/50 dark:border-amber-800/30 min-h-[22px] sm:min-h-[26px]">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(ytId, 'hd')); }}
              className="text-[9px] sm:text-[12px] font-bold uppercase tracking-wide hover:text-amber-800 dark:hover:text-amber-100 transition-colors"
              title="High Definition"
            >
              HD
            </button>
            <div className="w-px h-3.5 bg-amber-200/60 dark:bg-amber-700/50" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreviewThumbnail(getThumbnailUrl(ytId, 'sd')); }}
              className="text-[9px] sm:text-[12px] font-bold uppercase tracking-wide hover:text-amber-800 dark:hover:text-amber-100 transition-colors"
              title="Standard Definition"
            >
              SD
            </button>
          </div>
        )}

        {/* Assigned Users */}
        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {task.assignedTo.map((name) => (
              <span
                key={name}
                className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wide border border-transparent shadow-sm min-h-[22px] sm:min-h-[26px] ${ASSIGNED_PILL[name.toLowerCase()] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
              >
                {getAssigneeDisplayName(name)}
              </span>
            ))}
          </div>
        )}

        {/* Status text */}
        <span className={`hidden md:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 shadow-sm border border-transparent min-h-[26px] ${meta.pill}`}>
          {meta.label}
        </span>

        {/* Move Actions (Undo) */}
        <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {PREV_STATUS[task.status] && (
            <button
              onClick={() => onMove(task._id, PREV_STATUS[task.status])}
              className="px-2 py-1 rounded-lg text-[12px] font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Back to ${STATUS_META[PREV_STATUS[task.status]].label}`}
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/* ─── Preview Modal ─── */
function PreviewModal({ open, onClose, tasks, dateKey, onPreviewThumbnail, onDownloadVoiceOver, voiceOverDownloadingIds }) {
  const [copied, setCopied] = useState(false);

  const assignmentSummary = useMemo(() => {
    const summary = {};
    const unassigned = { short: 0, long: 0, count: 0 };
    let hasUnassigned = false;

    tasks.forEach(t => {
      const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo].filter(Boolean);
      const formats = Array.isArray(t.contentFormat) ? t.contentFormat : [t.contentFormat].filter(Boolean);
      
      if (assignees.length === 0) {
        hasUnassigned = true;
        unassigned.count = (unassigned.count || 0) + 1;
        formats.forEach(f => {
          const fl = f.toLowerCase();
          if (fl.includes('short')) unassigned.short++;
          else if (fl.includes('long')) unassigned.long++;
        });
      } else {
        assignees.forEach(name => {
          if (!summary[name]) summary[name] = { short: 0, long: 0, count: 0 };
          summary[name].count++;
          formats.forEach(f => {
            const fl = f.toLowerCase();
            if (fl.includes('short')) summary[name].short++;
            else if (fl.includes('long')) summary[name].long++;
          });
        });
      }
    });

    if (hasUnassigned && unassigned.count > 0) {
      summary["Unassigned"] = unassigned;
    }
    return summary;
  }, [tasks]);

  const dailySummary = useMemo(() => {
    let long = 0;
    let short = 0;
    tasks.forEach(t => {
      const formats = Array.isArray(t.contentFormat) ? t.contentFormat : [t.contentFormat].filter(Boolean);
      formats.forEach(f => {
        const fl = f.toLowerCase();
        if (fl.includes('short')) short++;
        else if (fl.includes('long')) long++;
      });
    });
    return { long, short, total: long + short };
  }, [tasks]);

  if (!open) return null;

  // Sort tasks by Assigned to field
  const sortedTasks = [...tasks].sort((a, b) => {
    const getAssignedToString = (task) => {
      if (!task.assignedTo || task.assignedTo.length === 0) return "";
      if (Array.isArray(task.assignedTo)) {
        return task.assignedTo.map(getAssigneeDisplayName).sort().join(", ");
      }
      return getAssigneeDisplayName(task.assignedTo);
    };
    
    const aAssigned = getAssignedToString(a);
    const bAssigned = getAssignedToString(b);
    
    // Empty assignments go to the end
    if (!aAssigned && !bAssigned) {
      const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
      const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
      if (idA !== idB) return idA - idB;
      return 0;
    }
    if (!aAssigned) return 1;
    if (!bAssigned) return -1;
    
    const cmp = aAssigned.localeCompare(bAssigned);
    if (cmp !== 0) return cmp;

    const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
    const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
    return idA - idB;
  });

  const formatAssignedTo = (assignedTo) => {
    if (!assignedTo || assignedTo.length === 0) return "";
    return Array.isArray(assignedTo)
      ? assignedTo.map(getAssigneeDisplayName).join(", ")
      : getAssigneeDisplayName(assignedTo);
  };

  const formatContentFormat = (contentFormat) => {
    if (!contentFormat || contentFormat.length === 0) return "";
    const formatMap = { short: "Shorts", long: "Long" };
    return Array.isArray(contentFormat)
      ? contentFormat.map(f => formatMap[f] || f).join(", ")
      : formatMap[contentFormat] || contentFormat;
  };

  const generatePlainTextTable = () => {
    const tsvCell = (v) =>
      String(v ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\t/g, " ")
        .replace(/\n/g, " ");
    const headers = ["Channel Type", "Assigned to", "Content Format", "Title", "Notes", "Script", "Voice-over (file)", "URL"];
    const rows = sortedTasks.map(task => [
      task.channelType || '',
      formatAssignedTo(task.assignedTo),
      formatContentFormat(task.contentFormat),
      task.title || '',
      tsvCell(task.notes),
      tsvCell(task.script),
      tsvCell(hasTaskVoiceOver(task) ? (task.voiceOverOriginalName || "yes") : ""),
      getTaskUrl(task) || ''
    ]);
    
    // Create tab-separated values for easy pasting into Google Sheets
    const tsvContent = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
    return tsvContent;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainTextTable());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatePlainTextTable();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Preview - {formatDateLabel(dateKey)}
              </h3>
              
              {dailySummary.total > 0 && (
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700/50 shadow-sm">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{dailySummary.total} Daily Target</span>
                  <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700" />
                  <div className="flex items-center gap-2.5">
                    {dailySummary.long > 0 && <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{dailySummary.long} Long</span>}
                    {dailySummary.short > 0 && <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">{dailySummary.short} Shorts</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Summary Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(assignmentSummary).map(([name, counts]) => {
                const isUn = name === "Unassigned";
                const dotColor = isUn ? "bg-amber-400" : (name.toLowerCase() === "pooja" ? "bg-pink-400" : (name.toLowerCase() === "mahalakshmi" ? "bg-purple-400" : "bg-blue-400"));
                const textColor = isUn ? "text-amber-600 dark:text-amber-400" : (ASSIGNED_PILL[name.toLowerCase()]?.split(' ').pop() || "text-gray-700 dark:text-gray-300");
                const totalSum = (counts.long || 0) + (counts.short || 0);

                return (
                  <div key={name} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/40 pl-2 pr-1 py-0.5 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm group/assignment transition-all">
                    <div className="flex items-center gap-1.5 mr-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-sm`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${textColor}`}>
                        {isUn ? name : getAssigneeDisplayName(name)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      {totalSum > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 shadow-sm mr-1">
                          {totalSum}
                        </span>
                      )}
                      {counts.long > 0 && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.long} shadow-sm border border-transparent`}>
                          {counts.long}L
                        </span>
                      )}
                      {counts.short > 0 && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.short} shadow-sm border border-transparent`}>
                          {counts.short}S
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Download size={16} />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Video ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Channel Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Assigned to
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Content Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Script
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Voice-over
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Thumbnail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.map((task, index) => {
                const voiceDownloading = voiceOverDownloadingIds?.has(String(task._id)) ?? false;
                return (
                <tr key={task._id} className={`${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"} hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors`}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {task.customVideoId ? (
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 shadow-sm min-h-[26px]">
                        ID: {task.customVideoId}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {task.channelType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {formatAssignedTo(task.assignedTo) && (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]).map(assignee => (
                          <span key={assignee} className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            assignee === 'pooja' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' :
                            assignee === 'mahalakshmi' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {getAssigneeDisplayName(assignee)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {formatContentFormat(task.contentFormat) && (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(task.contentFormat) ? task.contentFormat : [task.contentFormat]).map(format => (
                          <span key={format} className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            format === 'short' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                            format === 'long' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {format === 'short' ? 'Shorts' : format === 'long' ? 'Long' : format}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                    <div className="truncate" title={task.title}>
                      {task.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 max-w-[160px]">
                    <div className="text-xs line-clamp-3 whitespace-pre-wrap break-words" title={String(task.notes || "").trim() || undefined}>
                      {String(task.notes || "").trim() ? task.notes : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 max-w-[160px]">
                    <div className="text-xs line-clamp-3 whitespace-pre-wrap break-words" title={String(task.script || "").trim() || undefined}>
                      {String(task.script || "").trim() ? task.script : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 max-w-[140px]">
                    {hasTaskVoiceOver(task) ? (
                      <button
                        type="button"
                        disabled={voiceDownloading}
                        aria-busy={voiceDownloading}
                        onClick={() => onDownloadVoiceOver?.(task)}
                        title="Download uploaded voice-over file"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-70 disabled:cursor-wait disabled:pointer-events-none"
                      >
                        {voiceDownloading ? (
                          <Loader2 size={12} className="animate-spin shrink-0" aria-hidden />
                        ) : (
                          <Mic size={12} className="shrink-0" aria-hidden />
                        )}
                        File
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                    {task.videoId || extractYoutubeId(task.url) ? (
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400/80 shadow-sm border border-amber-100/50 dark:border-amber-800/30">
                        <button
                          type="button"
                          onClick={() => onPreviewThumbnail(getThumbnailUrl(task.videoId || extractYoutubeId(task.url), 'hd'))}
                          className="text-[10px] sm:text-xs font-black uppercase hover:text-amber-700 dark:hover:text-amber-200 transition-colors"
                          title="High Definition"
                        >
                          HD
                        </button>
                        <div className="w-px h-3 bg-amber-200/60 dark:bg-amber-700/60" />
                        <button
                          type="button"
                          onClick={() => onPreviewThumbnail(getThumbnailUrl(task.videoId || extractYoutubeId(task.url), 'sd'))}
                          className="text-[10px] sm:text-xs font-black uppercase hover:text-amber-700 dark:hover:text-amber-200 transition-colors"
                          title="Standard Definition"
                        >
                          SD
                        </button>
                      </div>
                    ) : (
                      task.thumbnail && (
                        <button
                          type="button"
                          onClick={() => onPreviewThumbnail(task.thumbnail)}
                          className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400/80 border border-amber-100/50 dark:border-amber-800/30 text-[10px] sm:text-xs font-black uppercase transition-colors hover:text-amber-700"
                        >
                          View
                        </button>
                      )
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
/* ─── Date Group ─── */
const DateGroup = memo(function DateGroup({ 
  dateKey, tasks, onMove, onDelete, onEdit, onPreview, onDropTask, onPreviewThumbnail, onOpenDetail, onDownloadVoiceOver, voiceOverDownloadingIds, defaultOpen, variant,
  isSelected, onSelect,
  playingTaskId, audioPlaying, audioLoading, onPlayToggle
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onDropTask(taskId, dateKey);
  };

  const cat = getDateCategory(dateKey);
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const assignmentSummary = useMemo(() => {
    const summary = {};
    const unassigned = { short: 0, long: 0, count: 0 };
    let hasUnassigned = false;

    tasks.forEach(t => {
      const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo].filter(Boolean);
      const formats = Array.isArray(t.contentFormat) ? t.contentFormat : [t.contentFormat].filter(Boolean);
      
      if (assignees.length === 0) {
        hasUnassigned = true;
        unassigned.count = (unassigned.count || 0) + 1;
        formats.forEach(f => {
          const fl = f.toLowerCase();
          if (fl.includes('short')) unassigned.short++;
          else if (fl.includes('long')) unassigned.long++;
        });
      } else {
        assignees.forEach(name => {
          if (!summary[name]) summary[name] = { short: 0, long: 0, count: 0 };
          summary[name].count++;
          formats.forEach(f => {
            const fl = f.toLowerCase();
            if (fl.includes('short')) summary[name].short++;
            else if (fl.includes('long')) summary[name].long++;
          });
        });
      }
    });

    if (hasUnassigned && unassigned.count > 0) {
      summary["Unassigned"] = unassigned;
    }
    return summary;
  }, [tasks]);

  const dailySummary = useMemo(() => {
    let long = 0;
    let short = 0;
    tasks.forEach(t => {
      const formats = Array.isArray(t.contentFormat) ? t.contentFormat : [t.contentFormat].filter(Boolean);
      formats.forEach(f => {
        const fl = f.toLowerCase();
        if (fl.includes('short')) short++;
        else if (fl.includes('long')) long++;
      });
    });
    return { long, short, total: long + short };
  }, [tasks]);

  const isHistory = variant === "completed";

  const borderColor =
    !isHistory && cat === "overdue" ? "border-l-red-500" :
    cat === "today" ? "border-l-blue-500" :
    cat === "backlog" ? "border-l-gray-400 border-l-[3px] border-dashed" :
    isHistory ? "border-l-emerald-500/50" :
    "border-l-gray-300 dark:border-l-gray-600";

  const headerBg =
    !isHistory && cat === "overdue" ? "bg-red-50/60 dark:bg-red-950/10" :
    cat === "today" ? "bg-blue-50/60 dark:bg-blue-950/10" :
    cat === "backlog" ? "bg-gray-100/40 dark:bg-gray-800/10" :
    isHistory ? "bg-emerald-50/30 dark:bg-emerald-950/5" :
    "bg-gray-50/60 dark:bg-gray-800/30";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border border-gray-100 dark:border-gray-700 border-l-[4px] ${borderColor} overflow-hidden shadow-md shadow-gray-200/20 dark:shadow-black/20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm transition-all duration-300 ${isOver ? "ring-2 ring-blue-500 ring-inset scale-[1.01] brightness-105" : ""}`}
    >
      <div className="flex items-center">
        {variant === "completed" && (
          <div className="pl-3 flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(dateKey, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        )}
        <div
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-2 px-3 py-1 sm:py-1.5 ${headerBg} backdrop-blur-md transition-colors hover:brightness-95 cursor-pointer select-none`}
        >
          <span className="flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-300" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
            <ChevronRight size={14} />
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 overflow-hidden">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-black whitespace-nowrap ${(!isHistory && cat === "overdue") ? "text-red-600 dark:text-red-400" : cat === "today" ? "text-blue-600 dark:text-blue-400" : isHistory ? "text-emerald-700 dark:text-emerald-400" : cat === "backlog" ? "text-gray-500 dark:text-gray-400 italic" : "text-gray-800 dark:text-gray-200"}`}>
                {formatDateLabel(dateKey)}
              </span>
              
              {dailySummary.total > 0 && (
                <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700/50 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{dailySummary.total} Tasks</span>
                  <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <div className="flex items-center gap-1.5">
                    {dailySummary.long > 0 && <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{dailySummary.long}L</span>}
                    {dailySummary.short > 0 && <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{dailySummary.short}S</span>}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {Object.entries(assignmentSummary).map(([name, counts]) => {
                const isUn = name === "Unassigned";
                const dotColor = isUn ? "bg-amber-400" : (name.toLowerCase() === "pooja" ? "bg-pink-400" : (name.toLowerCase() === "mahalakshmi" ? "bg-purple-400" : "bg-blue-400"));
                const textColor = isUn ? "text-amber-600 dark:text-amber-400" : (ASSIGNED_PILL[name.toLowerCase()]?.split(' ').pop() || "text-gray-700 dark:text-gray-300");
                const totalSum = (counts.long || 0) + (counts.short || 0);
                
                return (
                  <div key={name} className="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 pl-2 pr-1 py-0.5 rounded-xl border border-white/50 dark:border-gray-700/50 shadow-sm backdrop-blur-md group/assignment transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-px">
                    <div className="flex items-center gap-1.5 mr-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.1)] group-hover/assignment:scale-110 transition-transform`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${textColor}`}>
                        {isUn ? name : getAssigneeDisplayName(name)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      {totalSum > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 shadow-sm border border-transparent mr-1" title="Total (L+S)">
                          {totalSum}
                        </span>
                      )}
                      {counts.long > 0 && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.long} shadow-sm border border-transparent`} title="Long Format">
                          {counts.long}L
                        </span>
                      )}
                      {counts.short > 0 && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.short} shadow-sm border border-transparent`} title="Shorts">
                          {counts.short}S
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {cat === "overdue" && <AlertTriangle size={14} className="text-red-500 flex-shrink-0 animate-pulse" />}

          <div className="flex items-center gap-2 ml-auto">
            {inProgress > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                <PlayCircle size={10} /> {inProgress}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50">
              {completed}/{total}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(dateKey, tasks); }}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors shadow-sm"
              title="Preview tasks"
            >
              <Eye size={10} /> Preview
            </button>
            <div className="hidden sm:flex w-20 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="p-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/20">
          {tasks.map((t) => (
            <TaskRow 
              key={t._id} 
              task={t} 
              onMove={onMove} 
              onDelete={onDelete} 
              onEdit={onEdit} 
              onPreviewThumbnail={onPreviewThumbnail} 
              onOpenDetail={onOpenDetail} 
              onDownloadVoiceOver={onDownloadVoiceOver} 
              voiceOverDownloadingIds={voiceOverDownloadingIds}
              playingTaskId={playingTaskId}
              audioPlaying={audioPlaying}
              audioLoading={audioLoading}
              onPlayToggle={onPlayToggle}
            />
          ))}
          {tasks.length === 0 && (
            <div className="py-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-[10px] text-gray-400">
              No tasks for this date
            </div>
          )}
        </div>
      )}
    </div>

  );
});

/* ─── Add / Edit Content Modal ─── */
const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/watch?v=..." },
  { value: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/reel/..." },
  { value: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/watch/..." },
  { value: "website", label: "Website", icon: Globe, placeholder: "https://example.com/article" },
];

function ContentModal({ open, onClose, onSaved, channelTypes, editTask }) {
  const isEdit = !!editTask;
  const [urlInput, setUrlInput] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [contentFormat, setContentFormat] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);
  const [channelType, setChannelType] = useState(channelTypes[0] || "");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [notes, setNotes] = useState("");
  const [script, setScript] = useState("");
  const [pendingVoiceFile, setPendingVoiceFile] = useState(null);
  const [markVoiceOverRemoved, setMarkVoiceOverRemoved] = useState(false);
  const voiceOverInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  if (open && !initialized) {
    setError(null);
    if (editTask) {
      setUrlInput(editTask.url || (editTask.videoId ? `https://www.youtube.com/watch?v=${editTask.videoId}` : ""));
      setTitle(editTask.title || "");
      setPlatform(editTask.platform || "youtube");
      setContentFormat(Array.isArray(editTask.contentFormat) ? editTask.contentFormat : (editTask.contentFormat ? [editTask.contentFormat] : []));
      setAssignedTo(Array.isArray(editTask.assignedTo) ? editTask.assignedTo : (editTask.assignedTo ? [editTask.assignedTo] : []));
      setChannelType(editTask.channelType || channelTypes[0] || "");
      setScheduledDate(editTask.scheduledDate ? toDateKey(editTask.scheduledDate) : null);
      setNotes(editTask.notes || "");
      setScript(editTask.script || "");
      setPendingVoiceFile(null);
      setMarkVoiceOverRemoved(false);
    } else {
      setUrlInput("");
      setTitle("");
      setPlatform("youtube");
      setContentFormat([]);
      setAssignedTo([]);
      setChannelType(channelTypes[0] || "");
      setScheduledDate(null);
      setNotes("");
      setScript("");
      setPendingVoiceFile(null);
      setMarkVoiceOverRemoved(false);
    }
    setInitialized(true);
  }

  if (!open && initialized) {
    setInitialized(false);
  }

  if (!open) return null;

  const autoPlatform = urlInput.trim() ? detectPlatform(urlInput) : null;
  const activePlatform = autoPlatform || platform;
  const ytId = activePlatform === "youtube" ? extractYoutubeId(urlInput) : null;
  const isValidUrl = urlInput.trim().length > 0;
  const canSave = isValidUrl && title.trim() && channelType;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        platform: activePlatform,
        contentFormat: Array.isArray(contentFormat) ? contentFormat : (contentFormat ? [contentFormat] : []),
        assignedTo: Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []),
        url: urlInput.trim(),
        videoId: ytId || "",
        thumbnail: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "",
        channelType,
        scheduledDate: scheduledDate || null,
        notes,
        script,
      };
      let taskId;
      if (isEdit) {
        await api.put(`/video-tasks/${editTask._id}`, payload);
        taskId = editTask._id;
        toast.success("Updated");
      } else {
        payload.channelName = "";
        payload.channelHandle = "";
        payload.views = 0;
        payload.viewsText = "";
        payload.duration = "";
        const { data } = await api.post("/video-tasks", payload);
        taskId = data._id;
        toast.success("Added to board");
      }
      if (pendingVoiceFile && taskId) {
        await uploadVoiceOverFile(taskId, pendingVoiceFile);
      } else if (markVoiceOverRemoved && taskId) {
        await api.delete(`/video-tasks/${taskId}/voice-over`);
      }
      onClose();
      void onSaved?.();
    } catch (err) {
      const msg = err.response?.data?.message || (isEdit ? "Failed to update" : "Failed to add");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const activePlat = PLATFORM_OPTIONS.find((p) => p.value === activePlatform) || PLATFORM_OPTIONS[3];
  const ActiveIcon = activePlat.icon;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{isEdit ? "Edit Content" : "Add Content"}</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">YouTube, Instagram, Facebook, or any website URL</p>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {/* Platform selector */}
          <div className="flex gap-1">
            {PLATFORM_OPTIONS.map((p) => {
              const Icon = p.icon;
              const isActive = activePlatform === p.value;
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

          {/* URL input */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">URL</label>
            <div className="relative">
              <ActiveIcon size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${PLATFORM_META[activePlatform]?.color || "text-gray-400"}`} />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={activePlat.placeholder}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            {ytId && (
              <div className="mt-2 flex items-center gap-2">
                <img src={`https://i.ytimg.com/vi/${ytId}/default.jpg`} alt="" className="w-16 h-10 rounded object-cover bg-gray-100 dark:bg-gray-700" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Video ID: {ytId}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
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
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {channelTypes.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
                <option value="Other">Other</option>
              </select>
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
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Script (optional)</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={4}
              placeholder="Paste or write the video script…"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y min-h-[5rem]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Voice-over (optional)</label>
            {isEdit && editTask?.voiceOverStoredName && !markVoiceOverRemoved && !pendingVoiceFile && (
              <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px]">
                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]" title={editTask.voiceOverOriginalName || ""}>
                  Current: {editTask.voiceOverOriginalName || "Uploaded file"}
                </span>
                <button
                  type="button"
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  onClick={async () => {
                    try {
                      await downloadVoiceOverFile(editTask);
                      toast.success("Download started");
                    } catch (e) {
                      toast.error(e.message || "Download failed");
                    }
                  }}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  onClick={() => {
                    setMarkVoiceOverRemoved(true);
                    setPendingVoiceFile(null);
                    if (voiceOverInputRef.current) voiceOverInputRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            <input
              ref={voiceOverInputRef}
              type="file"
              accept={VOICE_OVER_ACCEPT}
              className="w-full text-[11px] text-gray-700 dark:text-gray-200 file:mr-2 file:py-1.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-gray-200 file:text-gray-800 dark:file:bg-gray-700 dark:file:text-gray-100 hover:file:bg-gray-300 dark:hover:file:bg-gray-600"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (!isVoiceOverFileAllowed(f)) {
                    toast.error(`Unsupported file type. Use: ${voiceOverFileTypeHint()}`);
                    e.target.value = "";
                    return;
                  }
                  setPendingVoiceFile(f);
                  setMarkVoiceOverRemoved(false);
                }
              }}
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              Max 40 MB. Formats: {voiceOverFileTypeHint()}. Saving replaces any existing voice-over file.
            </p>
            {pendingVoiceFile && (
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 font-medium truncate" title={pendingVoiceFile.name}>
                Selected: {pendingVoiceFile.name}
              </p>
            )}
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
              className="ml-auto px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : (isEdit ? <Pencil size={12} /> : (scheduledDate ? <Plus size={12} /> : <ListChecks size={12} />))}
              {isEdit ? "Update Content" : (scheduledDate ? "Schedule Task" : "Add to Backlog")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Board ─── */
export default function ProductionHub() {
  const [datedTasks, setDatedTasks] = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [boardStats, setBoardStats] = useState(null);
  const [backlogLoaded, setBacklogLoaded] = useState(false);
  const [completedLoaded, setCompletedLoaded] = useState(false);
  const [tabBusy, setTabBusy] = useState(false);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewThumbUrl, setPreviewThumbUrl] = useState(null);
  const [detailModalTask, setDetailModalTask] = useState(null);
  const scrollRef = useCallback((node) => {
    if (node !== null) {
      node.addEventListener("dragover", (e) => {
        const threshold = 60;
        const rect = node.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        if (y < threshold) {
          node.scrollTop -= 15;
        } else if (y > rect.height - threshold) {
          node.scrollTop += 15;
        }
      });
    }
  }, []);
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [viewMode, setViewMode] = useState("schedule");
  const [previewModal, setPreviewModal] = useState({ open: false, tasks: [], dateKey: null });
  const [selectedDateKeys, setSelectedDateKeys] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [voiceOverDownloadingIds, setVoiceOverDownloadingIds] = useState(() => new Set());
  const typeDropdownRef = useRef(null);

  // Custom Audio Player State
  const audioRef = useRef(null);
  const [playingTaskId, setPlayingTaskId] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [audioMuted, setAudioMuted] = useState(false);

  const handleStopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTaskId(null);
    setAudioPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  const handleTogglePlay = useCallback(async (task) => {
    const taskKey = String(task._id);
    
    if (playingTaskId === taskKey) {
      if (audioRef.current) {
        if (audioPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    setPlayingTaskId(taskKey);
    setAudioLoading(true);
    setAudioProgress(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    try {
      const res = await httpClient.get(`/video-tasks/${task._id}/voice-over`, {
        responseType: "blob",
        timeout: 120_000,
      });
      const blob = res.data;
      const u = URL.createObjectURL(blob);
      setAudioUrl(u);
    } catch (e) {
      toast.error("Failed to load audio stream");
      setPlayingTaskId(null);
      setAudioLoading(false);
    }
  }, [playingTaskId, audioUrl, audioPlaying]);

  const handleSeek = useCallback((percentage) => {
    if (audioRef.current && audioDuration) {
      const newTime = (percentage / 100) * audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioProgress(percentage);
      setAudioCurrentTime(newTime);
    }
  }, [audioDuration]);

  const handleVolumeChange = useCallback((v) => {
    setAudioVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setAudioMuted((m) => {
      const nextMuted = !m;
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
      }
      return nextMuted;
    });
  }, []);

  // Cleanup audioUrl on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Sync state changes with native HTML5 audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setAudioPlaying(true);
    const handlePause = () => setAudioPlaying(false);
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setAudioCurrentTime(audio.currentTime);
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
      setAudioLoading(false);
      audio.play().catch(() => {});
    };
    const handleEnded = () => {
      setAudioPlaying(false);
      setAudioProgress(100);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const activePlayingTask = useMemo(() => {
    if (!playingTaskId) return null;
    const allTasks = [...datedTasks, ...backlogTasks, ...completedTasks];
    return allTasks.find((t) => String(t._id) === playingTaskId);
  }, [datedTasks, backlogTasks, completedTasks, playingTaskId]);

  const formatTime = (sec) => {
    if (Number.isNaN(sec) || sec === Infinity) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const stats = boardStats ?? ZERO_BOARD_STATS;

  const loadInitialBoard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, datedRes, typesRes] = await Promise.all([
        api.get("/video-tasks/stats"),
        api.get("/video-tasks?bucket=schedule"),
        api.get("/competitor-types"),
      ]);
      setBoardStats(statsRes.data);
      setDatedTasks(datedRes.data);
      setTypes(typesRes.data);
      setBacklogLoaded(false);
      setCompletedLoaded(false);
      setBacklogTasks([]);
      setCompletedTasks([]);
    } catch {
      toast.error("Failed to load board");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshFullBoard = useCallback(async () => {
    setLoading(true);
    setBacklogLoaded(false);
    setCompletedLoaded(false);
    setBacklogTasks([]);
    setCompletedTasks([]);
    try {
      const [statsRes, datedRes, typesRes] = await Promise.all([
        api.get("/video-tasks/stats"),
        api.get("/video-tasks?bucket=schedule"),
        api.get("/competitor-types"),
      ]);
      setBoardStats(statsRes.data);
      setDatedTasks(datedRes.data);
      setTypes(typesRes.data);

      if (viewMode === "backlog") {
        const { data } = await api.get("/video-tasks?bucket=backlog");
        setBacklogTasks(data);
        setBacklogLoaded(true);
      } else if (viewMode === "completed") {
        const { data } = await api.get("/video-tasks?bucket=completed");
        setCompletedTasks(data);
        setCompletedLoaded(true);
      }
    } catch {
      toast.error("Failed to refresh board");
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    void loadInitialBoard();
  }, [loadInitialBoard]);

  useEffect(() => {
    let cancelled = false;
    async function loadTabData() {
      if (viewMode === "backlog" && !backlogLoaded) {
        setTabBusy(true);
        try {
          const { data } = await api.get("/video-tasks?bucket=backlog");
          if (!cancelled) {
            setBacklogTasks(data);
            setBacklogLoaded(true);
          }
        } catch {
          if (!cancelled) toast.error("Failed to load backlog");
        } finally {
          if (!cancelled) setTabBusy(false);
        }
        return;
      }
      if (viewMode === "completed" && !completedLoaded) {
        setTabBusy(true);
        try {
          const { data } = await api.get("/video-tasks?bucket=completed");
          if (!cancelled) {
            setCompletedTasks(data);
            setCompletedLoaded(true);
          }
        } catch {
          if (!cancelled) toast.error("Failed to load completed tasks");
        } finally {
          if (!cancelled) setTabBusy(false);
        }
      }
    }
    void loadTabData();
    return () => {
      cancelled = true;
    };
  }, [viewMode, backlogLoaded, completedLoaded]);

  const syncBoardAfterMutation = useCallback(async () => {
    try {
      const promises = [
        api.get("/video-tasks/stats"),
        api.get("/video-tasks?bucket=schedule"),
      ];
      let backlogIndex = -1;
      let completedIndex = -1;

      if (backlogLoaded) {
        promises.push(api.get("/video-tasks?bucket=backlog"));
        backlogIndex = promises.length - 1;
      }
      if (completedLoaded) {
        promises.push(api.get("/video-tasks?bucket=completed"));
        completedIndex = promises.length - 1;
      }

      const results = await Promise.all(promises);

      setBoardStats(results[0].data);
      setDatedTasks(results[1].data);

      if (backlogIndex !== -1) {
        setBacklogTasks(results[backlogIndex].data);
      }
      if (completedIndex !== -1) {
        setCompletedTasks(results[completedIndex].data);
      }
    } catch {
      toast.error("Failed to refresh board");
    }
  }, [backlogLoaded, completedLoaded]);

  const handleMove = useCallback(async (id, newStatus) => {
    try {
      await api.put(`/video-tasks/${id}`, { status: newStatus });
      await syncBoardAfterMutation();
    } catch {
      toast.error("Failed to update");
      await syncBoardAfterMutation();
    }
  }, [syncBoardAfterMutation]);

  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(`/video-tasks/${id}`);
      toast.success("Task deleted");
      await syncBoardAfterMutation();
    } catch {
      toast.error("Failed to delete");
      await syncBoardAfterMutation();
    }
  }, [syncBoardAfterMutation]);

  const handleEdit = useCallback((task) => {
    setEditTask(task);
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setEditTask(null);
  }, []);

  const handleSelectDate = useCallback((key, checked) => {
    const k = key === null ? "no-date" : key;
    setSelectedDateKeys(prev => 
      checked ? [...prev, k] : prev.filter(item => item !== k)
    );
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedDateKeys.length === 0) return;
    
    const tasksToDelete = completedTasks.filter(t => {
      const k = t.scheduledDate ? toDateKey(t.scheduledDate) : "no-date";
      return selectedDateKeys.includes(k) && t.status === "completed";
    });

    if (tasksToDelete.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete all ${tasksToDelete.length} tasks in the selected date groups?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const ids = tasksToDelete.map(t => t._id);
      await api.delete("/video-tasks/bulk", { data: { ids } });
      toast.success(`Deleted ${tasksToDelete.length} tasks`);
      setSelectedDateKeys([]);
      await syncBoardAfterMutation();
    } catch {
      toast.error("Failed to delete tasks");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedDateKeys, completedTasks, syncBoardAfterMutation]);

  useEffect(() => {
    // Clear selection when changing view
    setSelectedDateKeys([]);
  }, [viewMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleDropTask = useCallback(async (taskId, newDate) => {
    const dateVal = newDate === "no-date" ? null : newDate;

    try {
      await api.put(`/video-tasks/${taskId}`, { scheduledDate: dateVal });
      toast.success(`Moved to ${newDate === "no-date" ? "Backlog" : formatDateLabel(newDate).split('—')[0].trim()}`);
      await syncBoardAfterMutation();
    } catch {
      toast.error("Failed to move task");
      await syncBoardAfterMutation();
    }
  }, [syncBoardAfterMutation]);

  const handlePreview = useCallback((dateKey, tasks) => {
    setPreviewModal({ open: true, tasks, dateKey });
  }, []);

  const handlePreviewClose = useCallback(() => {
    setPreviewModal({ open: false, tasks: [], dateKey: null });
  }, []);

  const handlePreviewThumbnail = useCallback((url) => {
    setPreviewThumbUrl(url);
  }, []);

  const handleDownloadVoiceOver = useCallback(async (task) => {
    const rawId = task?._id;
    if (rawId == null || rawId === "") return;
    const idKey = String(rawId);
    setVoiceOverDownloadingIds((prev) => new Set(prev).add(idKey));
    try {
      await downloadVoiceOverFile(task);
      toast.success("Download started");
    } catch (e) {
      toast.error(e.message || "Download failed");
    } finally {
      setVoiceOverDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(idKey);
        return next;
      });
    }
  }, []);

  const filterList = useCallback((list) => {
    let l = [...list];
    if (activeType !== "all") l = l.filter((t) => t.channelType === activeType);
    if (search.trim()) {
      const q = search.toLowerCase();
      l = l.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.channelName?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.script?.toLowerCase().includes(q) ||
          t.voiceOverOriginalName?.toLowerCase().includes(q),
      );
    }
    return l;
  }, [activeType, search]);

  const filteredDated = useMemo(() => filterList(datedTasks), [filterList, datedTasks]);
  const filteredBacklog = useMemo(() => filterList(backlogTasks), [filterList, backlogTasks]);
  const filteredCompleted = useMemo(() => filterList(completedTasks), [filterList, completedTasks]);

  const filtered = useMemo(() => {
    if (viewMode === "completed") return filteredCompleted;
    if (viewMode === "backlog") return filteredBacklog;
    return filteredDated;
  }, [viewMode, filteredCompleted, filteredBacklog, filteredDated]);

  const scheduleDateGroups = useMemo(() => {
    const active = filteredDated.filter(
      (t) => t.status !== "completed" && t.scheduledDate && toDateKey(t.scheduledDate),
    );
    const map = {};
    active.forEach((t) => {
      const key = toDateKey(t.scheduledDate);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => {
        const aAss = (a.assignedTo && a.assignedTo.length > 0) ? a.assignedTo[0].toLowerCase() : "zzzz";
        const bAss = (b.assignedTo && b.assignedTo.length > 0) ? b.assignedTo[0].toLowerCase() : "zzzz";
        if (aAss !== bAss) return aAss.localeCompare(bAss);
        
        const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
        const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
        if (idA !== idB) return idA - idB;

        return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      })
    );
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({ key, tasks: map[key] }));
  }, [filteredDated]);

  const backlogGroups = useMemo(() => {
    const list = filteredBacklog.filter(
      (t) => t.status !== "completed" && (!t.scheduledDate || toDateKey(t.scheduledDate) === ""),
    );
    list.sort((a, b) => {
      const aAss = (a.assignedTo && a.assignedTo.length > 0) ? a.assignedTo[0].toLowerCase() : "zzzz";
      const bAss = (b.assignedTo && b.assignedTo.length > 0) ? b.assignedTo[0].toLowerCase() : "zzzz";
      if (aAss !== bAss) return aAss.localeCompare(bAss);

      const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
      const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
      if (idA !== idB) return idA - idB;

      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    });
    return [{ key: null, tasks: list }];
  }, [filteredBacklog]);

  const completedDateGroups = useMemo(() => {
    const list = filteredCompleted.filter((t) => t.status === "completed");
    const map = {};
    list.forEach((t) => {
      const key = t.scheduledDate ? toDateKey(t.scheduledDate) : "no-date";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => {
        const aAss = (a.assignedTo && a.assignedTo.length > 0) ? a.assignedTo[0].toLowerCase() : "zzzz";
        const bAss = (b.assignedTo && b.assignedTo.length > 0) ? b.assignedTo[0].toLowerCase() : "zzzz";
        if (aAss !== bAss) return aAss.localeCompare(bAss);

        const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
        const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
        if (idA !== idB) return idA - idB;

        return new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt);
      })
    );
    return Object.keys(map)
      .sort((a, b) => {
        if (a === "no-date") return 1;
        if (b === "no-date") return -1;
        return b.localeCompare(a); // DESC sorting for history
      })
      .map((key) => ({ key, tasks: map[key] }));
  }, [filteredCompleted]);

  const allTasks = useMemo(
    () => [...datedTasks, ...backlogTasks, ...completedTasks],
    [datedTasks, backlogTasks, completedTasks],
  );

  const uniqueTypes = useMemo(() => {
    const set = new Set(allTasks.map((t) => t.channelType).filter(Boolean));
    return [...set].sort();
  }, [allTasks]);

  const typeNames = useMemo(() => types.map((t) => t.name), [types]);

  const hasAnyTasks = stats.active > 0 || stats.completed > 0;
  const showStatsRibbon = !loading && boardStats != null && hasAnyTasks;

  return (
    <AdminLayout title="Production Hub" titleInfo="Track & manage scheduled content" icon={LayoutDashboard} contentFit noPadding>
      <div className="flex flex-col h-full min-h-0 overflow-y-auto sm:overflow-hidden w-full gap-1.5 sm:gap-2 px-3 sm:px-4 pt-2 pb-4 custom-scrollbar">

        {/* Stats & Search Ribbon */}
        {showStatsRibbon && (
          <div className="flex-shrink-0 flex items-center justify-between gap-4 px-3 py-1.5 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-gray-100/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 ml-1">
              <StatCard icon={AlertTriangle} label="Overdue" count={stats.overdue} color="text-red-500" />
              <StatCard icon={Calendar} label="Today" count={stats.today} color="text-blue-500" />
              <StatCard icon={TrendingUp} label="Week" count={stats.thisWeek} color="text-amber-500" />
              <StatCard icon={ListChecks} label="Backlog" count={stats.backlog} color="text-gray-500" />
              <StatCard icon={CheckCircle2} label="Done" count={stats.completed} color="text-emerald-500" />
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-grow max-w-sm ml-auto">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search board..."
                onClear={() => setSearch("")}
              />
              <button
                onClick={refreshFullBoard}
                disabled={loading}
                className="p-1.5 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                title="Refresh board"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        )}

        {/* Search for mobile only — visible in filter bar */}
        <div className="sm:hidden -mb-1 px-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks..."
            onClear={() => setSearch("")}
          />
        </div>

        {/* Unified Filter Section */}
        <div className="flex-shrink-0 p-1 sm:p-1.5 z-30">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 sm:gap-2 w-full">
            <div className="flex items-center gap-2">
              <FilterLabel icon={Filter}>View:</FilterLabel>
              <FilterSegment
                options={[
                  { value: "schedule", label: "Schedule", count: stats.scheduled },
                  { value: "completed", label: "Completed", count: stats.completed },
                  { value: "backlog", label: "Backlog", count: stats.backlog }
                ]}
                value={viewMode}
                onChange={setViewMode}
                variant="success"
              />
            </div>
            
            <span className="hidden lg:block w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <div className="flex items-center gap-2 relative" ref={typeDropdownRef}>
              <FilterLabel icon={LayoutDashboard}>Type:</FilterLabel>
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
                  activeType !== "all"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
                }`}
              >
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {activeType === "all" ? "All Categories" : activeType}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showTypeDropdown ? "rotate-180" : ""}`} />
              </button>

              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-[100] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setActiveType("all"); setShowTypeDropdown(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold transition-colors ${
                      activeType === "all" 
                        ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    All Categories
                    <span className="text-[10px] opacity-60 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full font-black uppercase">{allTasks.length}</span>
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1.5" />
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {uniqueTypes.map((ct) => {
                      const count = allTasks.filter(t => t.channelType === ct).length;
                      return (
                        <button
                          key={ct}
                          onClick={() => { setActiveType(ct); setShowTypeDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold transition-colors ${
                            activeType === ct 
                              ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" 
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <span className="truncate">{ct}</span>
                          <span className="text-[10px] opacity-60 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full font-black uppercase">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:ml-auto">
              <button
                onClick={() => { setEditTask(null); setShowModal(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95 border border-white/10"
              >
                <Plus size={16} className="drop-shadow-sm" />
                <span>Add Content</span>
              </button>
              
              <button
                onClick={() => exportToCsv(filtered)}
                className="p-2 rounded-xl text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 transition-all hover:border-blue-300 dark:hover:border-blue-700 shadow-sm active:scale-95"
                title="Export to CSV"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading board…</p>
            </div>
          </div>
        ) : !hasAnyTasks ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <LayoutDashboard size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No tasks yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              Schedule content from Trending Hub or add manually
            </p>
            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> Add Your First Content
            </button>
          </div>
        ) : viewMode === "schedule" ? (
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pb-20 sm:pb-2 custom-scrollbar">
            {scheduleDateGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No scheduled tasks!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Check the Backlog for unscheduled work.</p>
              </div>
            ) : (
              scheduleDateGroups.map((g) => (
                <DateGroup
                  key={g.key}
                  dateKey={g.key}
                  tasks={g.tasks}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPreview={handlePreview}
                  onDropTask={handleDropTask}
                  onPreviewThumbnail={handlePreviewThumbnail}
                  onOpenDetail={setDetailModalTask}
                  onDownloadVoiceOver={handleDownloadVoiceOver}
                  voiceOverDownloadingIds={voiceOverDownloadingIds}
                  defaultOpen={getDateCategory(g.key) === "overdue" || getDateCategory(g.key) === "today"}
                  playingTaskId={playingTaskId}
                  audioPlaying={audioPlaying}
                  audioLoading={audioLoading}
                  onPlayToggle={handleTogglePlay}
                />
              ))
            )}
          </div>
        ) : viewMode === "backlog" ? (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pb-20 sm:pb-2 custom-scrollbar">
            {tabBusy && !backlogLoaded ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 size={28} className="animate-spin text-blue-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading backlog…</p>
              </div>
            ) : backlogGroups[0].tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ListChecks size={32} className="text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Backlog is empty</p>
              </div>
            ) : (
              backlogGroups.map((g) => (
                <DateGroup
                  key={g.key}
                  dateKey={null}
                  tasks={g.tasks}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPreview={handlePreview}
                  onDropTask={handleDropTask}
                  onPreviewThumbnail={handlePreviewThumbnail}
                  onOpenDetail={setDetailModalTask}
                  onDownloadVoiceOver={handleDownloadVoiceOver}
                  voiceOverDownloadingIds={voiceOverDownloadingIds}
                  defaultOpen={true}
                  playingTaskId={playingTaskId}
                  audioPlaying={audioPlaying}
                  audioLoading={audioLoading}
                  onPlayToggle={handleTogglePlay}
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 pb-20 sm:pb-1.5 custom-scrollbar">
            {tabBusy && !completedLoaded ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 size={28} className="animate-spin text-emerald-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading completed…</p>
              </div>
            ) : (
            <>
            {selectedDateKeys.length > 0 && (
              <div className="sticky top-0 z-20 mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                    <Trash2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-300">{selectedDateKeys.length} Date Groups Selected</p>
                    <p className="text-[10px] text-red-600/70 dark:text-red-400/70">All tasks within these dates will be deleted permanently</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDateKeys([])}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete Permanently
                  </button>
                </div>
              </div>
            )}
            {completedDateGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Circle size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No completed tasks yet</p>
              </div>
            ) : (
              completedDateGroups.map((g) => (
                <DateGroup
                  key={g.key}
                  dateKey={g.key === "no-date" ? null : g.key}
                  tasks={g.tasks}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPreview={handlePreview}
                  onDropTask={handleDropTask}
                  onPreviewThumbnail={handlePreviewThumbnail}
                  onOpenDetail={setDetailModalTask}
                  onDownloadVoiceOver={handleDownloadVoiceOver}
                  voiceOverDownloadingIds={voiceOverDownloadingIds}
                  defaultOpen={false}
                  variant="completed"
                  isSelected={selectedDateKeys.includes(g.key === null ? "no-date" : g.key)}
                  onSelect={handleSelectDate}
                  playingTaskId={playingTaskId}
                  audioPlaying={audioPlaying}
                  audioLoading={audioLoading}
                  onPlayToggle={handleTogglePlay}
                />
              ))
            )}
            </>
            )}
          </div>
        )
      }
      </div>

      <ContentModal
        open={showModal}
        onClose={handleModalClose}
        onSaved={syncBoardAfterMutation}
        channelTypes={typeNames}
        editTask={editTask}
      />
      
      <PreviewModal
        open={previewModal.open}
        onClose={handlePreviewClose}
        tasks={previewModal.tasks}
        dateKey={previewModal.dateKey}
        onPreviewThumbnail={handlePreviewThumbnail}
        onDownloadVoiceOver={handleDownloadVoiceOver}
        voiceOverDownloadingIds={voiceOverDownloadingIds}
      />
      {previewThumbUrl && <ThumbnailModal url={previewThumbUrl} onClose={() => setPreviewThumbUrl(null)} />}
      {detailModalTask && (
        <TaskDetailModal
          task={detailModalTask}
          onClose={() => setDetailModalTask(null)}
          onDownloadVoiceOver={handleDownloadVoiceOver}
          voiceOverDownloadingIds={voiceOverDownloadingIds}
          playingTaskId={playingTaskId}
          audioPlaying={audioPlaying}
          audioLoading={audioLoading}
          onPlayToggle={handleTogglePlay}
        />
      )}

      <audio ref={audioRef} src={audioUrl || ""} className="hidden" />

      {/* Premium floating custom audio player widget */}
      {activePlayingTask && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[80] bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom duration-300">
          
          {/* Header Info */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                <Music size={18} className={audioPlaying ? "animate-pulse" : ""} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Now Playing</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={activePlayingTask.title}>
                  {activePlayingTask.title}
                </p>
              </div>
            </div>
            <button
              onClick={handleStopAudio}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Close player"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar and Scrubber */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
              <span>{formatTime(audioCurrentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
            <div className="relative group/progress flex items-center h-2">
              <input
                type="range"
                min="0"
                max="100"
                value={audioProgress}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Player controls bar */}
          <div className="flex items-center justify-between">
            {/* Play/Pause controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTogglePlay(activePlayingTask)}
                disabled={audioLoading}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {audioLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : audioPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </button>
              
              <button
                onClick={() => handleDownloadVoiceOver(activePlayingTask)}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-805 transition-colors active:scale-95"
                title="Download Audio"
              >
                <Download size={16} />
              </button>
            </div>

            {/* Volume controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {audioMuted || audioVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioMuted ? 0 : audioVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
