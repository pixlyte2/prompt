import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  LayoutDashboard,
  Search,
  X,
  RefreshCw,
  Eye,
  Trash2,
  ChevronRight,
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
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";

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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${variants[variant]}`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
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
          className={`relative flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-300 ${
            value === option.value
              ? activeVariants[variant]
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          }`}
        >
          {option.label}
          {option.count !== undefined && option.count > 0 && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md ${
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
        className="w-full pl-8 pr-8 py-1.5 sm:pl-9 sm:pr-9 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-[11px] sm:text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50 dark:focus:border-blue-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm"
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
    <div className={`relative overflow-visible rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/30 dark:shadow-black/30 p-2 sm:p-2.5 flex flex-col gap-2 ${className}`}>
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

function exportToCsv(tasks) {
  const headers = ["Title", "Platform", "Format", "Channel Type", "Channel", "Status", "Scheduled Date", "Views", "Notes", "URL"];
  const rows = tasks.map((t) => [
    `"${(t.title || "").replace(/"/g, '""')}"`,
    t.platform || "youtube",
    t.contentFormat || "",
    t.channelType || "",
    `"${(t.channelName || "").replace(/"/g, '""')}"`,
    (STATUS_META[t.status]?.label) || t.status,
    t.scheduledDate ? toDateKey(t.scheduledDate) : "",
    t.viewsText || t.views || "",
    `"${(t.notes || "").replace(/"/g, '""')}"`,
    getTaskUrl(t) || "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-hub-${toDateKey(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function toDateKey(d) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(key) {
  if (!key) return "No date";
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
  if (!key) return "none";
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
      <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${color} ring-1 ring-inset ring-white/10`}>
        <Icon size={12} />
      </div>
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="text-[14px] sm:text-[16px] font-black text-gray-900 dark:text-white tabular-nums leading-none">{count}</span>
        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter truncate">{label}</span>
      </div>
    </div>
  );
}

/* ─── Status Checkbox ─── */
function StatusCheckbox({ status, onClick }) {
  if (status === "completed") {
    return (
      <button onClick={onClick} className="flex-shrink-0 text-emerald-500 hover:text-emerald-600 transition-colors" title="Mark incomplete">
        <CheckSquare size={16} />
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button onClick={onClick} className="flex-shrink-0 relative" title="Mark done">
        <Square size={16} className="text-blue-400" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-sm bg-blue-400" />
        </div>
      </button>
    );
  }
  return (
    <button onClick={onClick} className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors" title="Start task">
      <Square size={16} />
    </button>
  );
}

/* ─── Platform Icon ─── */
function PlatformIcon({ platform, size = 8 }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.website;
  const Icon = meta.icon;
  return <Icon size={size} className={`${meta.color} flex-shrink-0`} />;
}

/* ─── Inline Row for a single task ─── */
function TaskRow({ task, onMove, onDelete, onEdit }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const meta = STATUS_META[task.status] || STATUS_META.todo;
  const platform = task.platform || "youtube";
  const taskUrl = getTaskUrl(task);
  const thumb = getTaskThumbnail(task);
  const platMeta = PLATFORM_META[platform] || PLATFORM_META.website;

  const handleStatusClick = () => {
    const next = NEXT_STATUS[task.status];
    if (next) onMove(task._id, next);
    else onMove(task._id, PREV_STATUS[task.status]);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group flex items-center gap-2 px-2 py-0.5 sm:py-1 bg-white dark:bg-gray-800/80 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-sm cursor-grab active:cursor-grabbing"
    >
      {/* Checkbox */}
      <div className="scale-90">
        <StatusCheckbox status={task.status} onClick={handleStatusClick} />
      </div>

      {/* Thumbnail / Platform icon */}
      {thumb ? (
        <a
          href={taskUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-12 h-7 sm:w-14 sm:h-8 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 relative group/thumb shadow-sm"
        >
          <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" loading="lazy" />
          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
            <ExternalLink size={10} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
          </div>
          {task.duration && (
            <span className="absolute bottom-0 right-0 px-0.5 py-px bg-black/75 text-[6px] font-medium text-white rounded-tl">
              {task.duration}
            </span>
          )}
        </a>
      ) : (
        <a
          href={taskUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-shrink-0 w-10 h-6 sm:w-12 sm:h-7.5 rounded flex items-center justify-center ${platMeta.bg}`}
        >
          <PlatformIcon platform={platform} size={14} />
        </a>
      )}

      {/* Title + channel */}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] sm:text-xs font-semibold leading-none truncate ${task.status === "completed" ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 opacity-80 scale-95 origin-left">
          <PlatformIcon platform={platform} size={8} />
          {task.channelName && (
            <span className="text-[8px] text-gray-500 dark:text-gray-400 truncate max-w-[8rem]">
              {task.channelName}
            </span>
          )}
          {task.viewsText && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              <span className="text-[8px] text-gray-500 dark:text-gray-400 inline-flex items-center gap-0.5">
                <Eye size={7} /> {task.viewsText}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content format pill — always visible */}
      {task.contentFormat && (
        <span className={`inline-flex text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${FORMAT_PILL[task.contentFormat] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
          {FORMAT_OPTIONS.find((f) => f.value === task.contentFormat)?.label || task.contentFormat}
        </span>
      )}

      {/* Assigned Users — full name! */}
      {task.assignedTo && task.assignedTo.length > 0 && (
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          {task.assignedTo.map((name) => (
            <span
              key={name}
              className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight border border-transparent shadow-sm ${ASSIGNED_PILL[name.toLowerCase()] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Channel type pill */}
      <span className="hidden sm:inline-flex text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 flex-shrink-0">
        {task.channelType}
      </span>

      {/* Status text */}
      <span className={`hidden md:inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${meta.pill}`}>
        {meta.label}
      </span>

      {/* Notes indicator */}
      {task.notes && (
        <span className="flex-shrink-0 text-gray-400 dark:text-gray-500" title={task.notes}>
          <FileText size={12} />
        </span>
      )}

      {/* Actions (visible on hover) */}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {PREV_STATUS[task.status] && (
          <button
            onClick={() => onMove(task._id, PREV_STATUS[task.status])}
            className="px-1.5 py-0.5 rounded text-[9px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Back to ${STATUS_META[PREV_STATUS[task.status]].label}`}
          >
            Undo
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Edit"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => { if (confirm("Delete this task?")) onDelete(task._id); }}
          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

/* ─── Preview Modal ─── */
function PreviewModal({ open, onClose, tasks, dateKey }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  // Sort tasks by Assigned to field
  const sortedTasks = [...tasks].sort((a, b) => {
    const getAssignedToString = (task) => {
      if (!task.assignedTo || task.assignedTo.length === 0) return "";
      if (Array.isArray(task.assignedTo)) {
        return task.assignedTo.map(a => a.charAt(0).toUpperCase() + a.slice(1)).sort().join(", ");
      }
      return task.assignedTo.charAt(0).toUpperCase() + task.assignedTo.slice(1);
    };
    
    const aAssigned = getAssignedToString(a);
    const bAssigned = getAssignedToString(b);
    
    // Empty assignments go to the end
    if (!aAssigned && !bAssigned) return 0;
    if (!aAssigned) return 1;
    if (!bAssigned) return -1;
    
    return aAssigned.localeCompare(bAssigned);
  });

  const formatAssignedTo = (assignedTo) => {
    if (!assignedTo || assignedTo.length === 0) return "";
    return Array.isArray(assignedTo) 
      ? assignedTo.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(", ")
      : assignedTo.charAt(0).toUpperCase() + assignedTo.slice(1);
  };

  const formatContentFormat = (contentFormat) => {
    if (!contentFormat || contentFormat.length === 0) return "";
    const formatMap = { short: "Shorts", long: "Long" };
    return Array.isArray(contentFormat)
      ? contentFormat.map(f => formatMap[f] || f).join(", ")
      : formatMap[contentFormat] || contentFormat;
  };

  const generatePlainTextTable = () => {
    const headers = ["Channel Type", "Assigned to", "Content Format", "Title", "URL"];
    const rows = sortedTasks.map(task => [
      task.channelType || '',
      formatAssignedTo(task.assignedTo),
      formatContentFormat(task.contentFormat),
      task.title || '',
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Preview - {formatDateLabel(dateKey)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''} • Sorted by Assigned to
            </p>
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
                  URL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.map((task, index) => (
                <tr key={task._id} className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}>
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
                            assignee === 'soundarya' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {assignee.charAt(0).toUpperCase() + assignee.slice(1)}
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
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                    {getTaskUrl(task) && (
                      <a
                        href={getTaskUrl(task)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                        title={getTaskUrl(task)}
                      >
                        {getTaskUrl(task)}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
/* ─── Date Group ─── */
function DateGroup({ dateKey, tasks, onMove, onDelete, onEdit, onPreview, onDropTask, defaultOpen }) {
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

  const borderColor =
    cat === "overdue" ? "border-l-red-500" :
    cat === "today" ? "border-l-blue-500" :
    "border-l-gray-300 dark:border-l-gray-600";

  const headerBg =
    cat === "overdue" ? "bg-red-50/60 dark:bg-red-950/10" :
    cat === "today" ? "bg-blue-50/60 dark:bg-blue-950/10" :
    "bg-gray-50/60 dark:bg-gray-800/30";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border border-gray-100 dark:border-gray-700 border-l-[4px] ${borderColor} overflow-hidden shadow-md shadow-gray-200/20 dark:shadow-black/20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm transition-all duration-300 ${isOver ? "ring-2 ring-blue-500 ring-inset scale-[1.01] brightness-105" : ""}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-1.5 sm:py-2 ${headerBg} backdrop-blur-md transition-colors hover:brightness-95 `}
      >
        <span className="flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-300" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
          <ChevronRight size={16} />
        </span>

        <span className={`text-sm font-black ${cat === "overdue" ? "text-red-600 dark:text-red-400" : cat === "today" ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"}`}>
          {formatDateLabel(dateKey)}
        </span>

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
      </button>

      {open && (
        <div className="p-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/20">
          {tasks.map((t) => (
            <TaskRow key={t._id} task={t} onMove={onMove} onDelete={onDelete} onEdit={onEdit} />
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
}

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
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86_400_000).toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (open && !initialized) {
    if (editTask) {
      setUrlInput(editTask.url || (editTask.videoId ? `https://www.youtube.com/watch?v=${editTask.videoId}` : ""));
      setTitle(editTask.title || "");
      setPlatform(editTask.platform || "youtube");
      setContentFormat(Array.isArray(editTask.contentFormat) ? editTask.contentFormat : (editTask.contentFormat ? [editTask.contentFormat] : []));
      setAssignedTo(Array.isArray(editTask.assignedTo) ? editTask.assignedTo : (editTask.assignedTo ? [editTask.assignedTo] : []));
      setChannelType(editTask.channelType || channelTypes[0] || "");
      setScheduledDate(editTask.scheduledDate ? toDateKey(editTask.scheduledDate) : new Date(Date.now() + 86_400_000).toISOString().split("T")[0]);
      setNotes(editTask.notes || "");
    } else {
      setUrlInput("");
      setTitle("");
      setPlatform("youtube");
      setContentFormat([]);
      setAssignedTo([]);
      setChannelType(channelTypes[0] || "");
      setScheduledDate(new Date(Date.now() + 86_400_000).toISOString().split("T")[0]);
      setNotes("");
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
  const canSave = isValidUrl && title.trim() && channelType && scheduledDate;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
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
        scheduledDate,
        notes,
      };
      if (isEdit) {
        await api.put(`/video-tasks/${editTask._id}`, payload);
        toast.success("Updated");
      } else {
        payload.channelName = "";
        payload.channelHandle = "";
        payload.views = 0;
        payload.viewsText = "";
        payload.duration = "";
        await api.post("/video-tasks", payload);
        toast.success("Added to board");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || (isEdit ? "Failed to update" : "Failed to add"));
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
            {saving ? <Loader2 size={12} className="animate-spin" /> : isEdit ? <Pencil size={12} /> : <Plus size={12} />}
            {isEdit ? "Save Changes" : "Add to Board"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Board ─── */
export default function ProductionHub() {
  const [tasks, setTasks] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, typesRes] = await Promise.all([
        api.get("/video-tasks"),
        api.get("/competitor-types"),
      ]);
      setTasks(tasksRes.data);
      setTypes(typesRes.data);
    } catch {
      toast.error("Failed to load board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleMove = useCallback(async (id, newStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === id
          ? { ...t, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : null }
          : t,
      ),
    );
    try {
      await api.put(`/video-tasks/${id}`, { status: newStatus });
    } catch {
      toast.error("Failed to update");
      fetchTasks();
    }
  }, [fetchTasks]);

  const handleDelete = useCallback(async (id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    try {
      await api.delete(`/video-tasks/${id}`);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete");
      fetchTasks();
    }
  }, [fetchTasks]);

  const handleEdit = useCallback((task) => {
    setEditTask(task);
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setEditTask(null);
  }, []);

  const handleDropTask = useCallback(async (taskId, newDate) => {
    // If newDate is null (no-date group), we might handle it as clearing the date
    const dateVal = newDate === "no-date" ? null : newDate;
    
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, scheduledDate: dateVal } : t))
    );

    try {
      await api.put(`/video-tasks/${taskId}`, { scheduledDate: dateVal });
      toast.success(`Moved to ${newDate === "no-date" ? "Backlog" : formatDateLabel(newDate).split('—')[0].trim()}`);
    } catch {
      toast.error("Failed to move task");
      fetchTasks();
    }
  }, [fetchTasks]);

  const handlePreview = useCallback((dateKey, tasks) => {
    setPreviewModal({ open: true, tasks, dateKey });
  }, []);

  const handlePreviewClose = useCallback(() => {
    setPreviewModal({ open: false, tasks: [], dateKey: null });
  }, []);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (activeType !== "all") list = list.filter((t) => t.channelType === activeType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.channelName?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tasks, activeType, search]);

  const stats = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndKey = toDateKey(weekEnd);
    const active = filtered.filter((t) => t.status !== "completed");
    const overdue = active.filter((t) => t.scheduledDate && toDateKey(t.scheduledDate) < todayKey);
    const today = active.filter((t) => t.scheduledDate && toDateKey(t.scheduledDate) === todayKey);
    const thisWeek = active.filter((t) => {
      const k = t.scheduledDate ? toDateKey(t.scheduledDate) : "";
      return k >= todayKey && k <= weekEndKey;
    });
    const completed = filtered.filter((t) => t.status === "completed");
    return { overdue: overdue.length, today: today.length, thisWeek: thisWeek.length, backlog: active.length, completed: completed.length };
  }, [filtered]);

  const dateGroups = useMemo(() => {
    const active = filtered.filter((t) => t.status !== "completed");
    const map = {};
    active.forEach((t) => {
      const key = t.scheduledDate ? toDateKey(t.scheduledDate) : "no-date";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
    );
    return Object.keys(map)
      .sort((a, b) => {
        if (a === "no-date") return 1;
        if (b === "no-date") return -1;
        return a.localeCompare(b);
      })
      .map((key) => ({ key, tasks: map[key] }));
  }, [filtered]);

  const completedTasks = useMemo(() => {
    return filtered
      .filter((t) => t.status === "completed")
      .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));
  }, [filtered]);

  const uniqueTypes = useMemo(() => {
    const set = new Set(tasks.map((t) => t.channelType).filter(Boolean));
    return [...set].sort();
  }, [tasks]);

  const typeNames = useMemo(() => types.map((t) => t.name), [types]);

  return (
    <AdminLayout title="Production Hub" titleInfo="Track & manage scheduled content" icon={LayoutDashboard} contentFit>
      <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-[1400px] mx-auto gap-1.5 sm:gap-2">

        {/* Stats & Search Ribbon */}
        {!loading && tasks.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between gap-4 px-3 py-1.5 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-gray-100/50 dark:border-gray-700/50">
            <div className="flex items-center gap-4 sm:gap-6">
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
                placeholder="Search..."
                onClear={() => setSearch("")}
              />
              <button
                onClick={fetchTasks}
                disabled={loading}
                className="p-1 rounded text-gray-500 hover:text-blue-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
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
        <FilterBar className="flex-shrink-0 p-1.5 sm:p-2">
          {/* View mode, types, search and actions all on one row when possible */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 w-full">
            <div className="flex items-center gap-2 flex-shrink-0">
              <FilterLabel icon={Filter}>View:</FilterLabel>
              <FilterSegment
                options={[
                  { value: "schedule", label: "Schedule", count: stats.backlog },
                  { value: "completed", label: "Completed", count: stats.completed }
                ]}
                value={viewMode}
                onChange={setViewMode}
                variant="success"
              />
            </div>
            
            <span className="hidden lg:block w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              <FilterLabel icon={LayoutDashboard}>Types:</FilterLabel>
              <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar pb-0.5 -mb-0.5 px-0.5">
                <FilterChip
                  active={activeType === "all"}
                  onClick={() => setActiveType("all")}
                  count={tasks.length}
                >
                  All
                </FilterChip>
                {uniqueTypes.map((ct) => {
                  const count = tasks.filter(t => t.channelType === ct).length;
                  return (
                    <FilterChip
                      key={ct}
                      active={activeType === ct}
                      onClick={() => setActiveType(ct)}
                      count={count}
                    >
                      {ct}
                    </FilterChip>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1 md:mt-0 ml-auto">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => { setEditTask(null); setShowModal(true); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                >
                  <Plus size={12} />
                  Add
                </button>
                
                <button
                  onClick={() => exportToCsv(filtered)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                  title="Export CSV"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        </FilterBar>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading board…</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <LayoutDashboard size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No tasks yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              Schedule content from ViralLens or add manually
            </p>
            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> Add Your First Content
            </button>
          </div>
        ) : viewMode === "schedule" ? (
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {dateGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">All caught up!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No pending tasks. Switch to Completed to review.</p>
              </div>
            ) : (
              dateGroups.map((g) => (
                <DateGroup
                  key={g.key}
                  dateKey={g.key === "no-date" ? null : g.key}
                  tasks={g.tasks}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPreview={handlePreview}
                  onDropTask={handleDropTask}
                  defaultOpen={getDateCategory(g.key) === "overdue" || getDateCategory(g.key) === "today" || g.key === "no-date"}
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Circle size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No completed tasks yet</p>
              </div>
            ) : (
              completedTasks.map((t) => (
                <TaskRow key={t._id} task={t} onMove={handleMove} onDelete={handleDelete} onEdit={handleEdit} />
              ))
            )}
          </div>
        )}
      </div>

      <ContentModal
        open={showModal}
        onClose={handleModalClose}
        onSaved={fetchTasks}
        channelTypes={typeNames}
        editTask={editTask}
      />
      
      <PreviewModal
        open={previewModal.open}
        onClose={handlePreviewClose}
        tasks={previewModal.tasks}
        dateKey={previewModal.dateKey}
      />
    </AdminLayout>
  );
}
