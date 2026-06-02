import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  Library,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Youtube,
  Instagram,
  Facebook,
  Globe,
  ExternalLink,
  Eye,
  X,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import api from "../services/api";

const PLATFORM_META = {
  youtube: { icon: Youtube, color: "text-red-500" },
  instagram: { icon: Instagram, color: "text-pink-500" },
  facebook: { icon: Facebook, color: "text-blue-600" },
  website: { icon: Globe, color: "text-gray-500" },
};

function toDateKey(d) {
  if (!d || d === "null" || d === "undefined") return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(key) {
  if (!key || key === "no-date") return "No completion date";
  const d = new Date(key + "T00:00:00");
  const today = new Date();
  const todayKey = toDateKey(today);
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const yestKey = toDateKey(yest);
  const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  if (key === todayKey) return `Today — ${label}`;
  if (key === yestKey) return `Yesterday — ${label}`;
  return label;
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

function hasScript(task) {
  return Boolean(String(task?.script ?? "").trim());
}

function sortTasksForDisplay(a, b) {
  const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
  const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
  if (idA !== idB) return idA - idB;
  return String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" });
}

function completionDateKey(task) {
  return toDateKey(task.completedAt || task.updatedAt) || "no-date";
}

const SCRIPT_LIBRARY_DAY_WINDOW = 5;

function getLastNDayKeys(n = SCRIPT_LIBRARY_DAY_WINDOW) {
  const keys = new Set();
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    if (key) keys.add(key);
  }
  return keys;
}

function isWithinLastNDays(task, allowedKeys) {
  const key = completionDateKey(task);
  if (!key || key === "no-date") return false;
  return allowedKeys.has(key);
}

function PlatformIcon({ platform, size = 14 }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.website;
  const Icon = meta.icon;
  return <Icon size={size} className={`${meta.color} flex-shrink-0`} />;
}

function ScriptViewModal({ task, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!task) return null;
  const body = String(task.script ?? "").trim();

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        className="relative z-10 flex w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[40rem] flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border-t sm:border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl"
      >
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3 sm:hidden shrink-0" />
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/80 dark:bg-gray-900/50">
          <div className="min-w-0">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">Script</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-[15rem] overflow-y-auto vo-script-scrollbar bg-gray-50/55 dark:bg-gray-955/20 px-5 py-4">
          {body ? (
            <pre className="whitespace-pre-wrap break-words text-[13px] sm:text-sm leading-relaxed text-gray-800 dark:text-gray-100 font-sans">
              {body}
            </pre>
          ) : (
            <p className="text-sm text-gray-500">No script on this video.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScriptLibraryRow({ task, index, onGenerate }) {
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const scriptOk = hasScript(task);
  const thumb = getTaskThumbnail(task);
  const taskUrl = getTaskUrl(task);
  const platform = task.platform || "youtube";

  const handleGenerate = async () => {
    const body = String(task.script ?? "").trim();
    if (!body) {
      toast.error("No script on this completed video");
      return;
    }
    setGenerating(true);
    try {
      try {
        await navigator.clipboard.writeText(body);
      } catch {
        /* paste into Source Input even if clipboard blocked */
      }
      onGenerate(body);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {scriptModalOpen && <ScriptViewModal task={task} onClose={() => setScriptModalOpen(false)} />}
      <div className="group flex flex-col p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/40 hover:bg-violet-50/80 dark:hover:bg-violet-950/30 hover:border-violet-300/60 dark:hover:border-violet-800/60 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
          <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 flex-1">
            <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-black text-gray-500 mt-1 sm:mt-3.5">
              {index + 1}
            </div>
            {thumb ? (
              <a
                href={taskUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-16 h-10 sm:w-20 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative ring-1 ring-black/5 block group-hover:scale-105 transition-transform"
              >
                <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ExternalLink size={12} className="drop-shadow" />
                </span>
              </a>
            ) : (
              <div className="flex-shrink-0 w-16 h-10 sm:w-20 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200/60 dark:border-gray-700/60">
                <PlatformIcon platform={platform} size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                {task.title}
              </h3>
              <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-1">
                {task.customVideoId != null && (
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-950/80 dark:bg-blue-950/40 px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    ID: {task.customVideoId}
                  </span>
                )}
                <span className="inline-flex items-center rounded-md sm:rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-950/60 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Completed
                </span>
                {scriptOk ? (
                  <span className="inline-flex items-center rounded-md sm:rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-950/60 dark:bg-violet-950/40 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">
                    Script Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md sm:rounded-lg border border-dashed border-amber-300 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-955/20 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    No Script
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 sm:pt-0 sm:border-0 sm:justify-end shrink-0">
            <button
              type="button"
              disabled={!scriptOk}
              onClick={() => setScriptModalOpen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg sm:rounded-xl transition-all border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
              title={scriptOk ? "View script" : "No script"}
              aria-label="View script"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              disabled={!scriptOk || generating}
              onClick={handleGenerate}
              className="h-8 px-3 sm:h-9 sm:px-4 inline-flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              title={scriptOk ? "Copy script and open AI Chat Source Input" : "Add a script in Production Hub first"}
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Generate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function DateSection({ dateKey, tasks, defaultOpen, onGenerate }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/40 dark:bg-gray-900/20 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 text-left bg-gray-50/90 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-955 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="text-gray-400">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{formatDateLabel(dateKey)}</span>
          <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200/80 dark:bg-gray-850 text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
      </button>
      {open && (
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-950/10">
          {tasks.map((t, idx) => (
            <ScriptLibraryRow key={t._id} task={t} index={idx} onGenerate={onGenerate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScriptLibrary({ onGenerate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scriptOnly, setScriptOnly] = useState(false);

  const last5DayKeys = useMemo(() => getLastNDayKeys(), []);

  const recentTasks = useMemo(
    () => (tasks || []).filter((t) => isWithinLastNDays(t, last5DayKeys)),
    [tasks, last5DayKeys],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/video-tasks?bucket=completed");
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load completed videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(() => {
    const withScript = recentTasks.filter(hasScript).length;
    return { total: recentTasks.length, withScript };
  }, [recentTasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return recentTasks.filter((t) => {
      if (scriptOnly && !hasScript(t)) return false;
      if (!q) return true;
      return (
        String(t.title || "").toLowerCase().includes(q) ||
        String(t.script || "").toLowerCase().includes(q) ||
        String(t.channelName || "").toLowerCase().includes(q)
      );
    });
  }, [recentTasks, searchQuery, scriptOnly]);

  const dateGroups = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      const key = completionDateKey(t);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    Object.values(map).forEach((arr) => arr.sort(sortTasksForDisplay));
    const keys = Object.keys(map).sort((a, b) => {
      if (a === "no-date") return 1;
      if (b === "no-date") return -1;
      return b.localeCompare(a);
    });
    return keys.map((key) => ({ key, tasks: map[key] }));
  }, [filteredTasks]);

  const todayKey = toDateKey(new Date());

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex flex-col h-full min-h-0 gap-1.5 custom-scrollbar">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-4 bg-white/70 dark:bg-gray-900/60 backdrop-blur border border-gray-200/80 dark:border-gray-800/80 rounded-xl sm:rounded-2xl shrink-0">
          <div className="flex items-center gap-2 w-full sm:flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or script…"
                className="w-full pl-8 sm:pl-10 pr-8 py-1.5 sm:py-2 border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl bg-white dark:bg-gray-955 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <span className="shrink-0 inline-flex items-center rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/40 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-violet-700 dark:text-violet-300">
              Last {SCRIPT_LIBRARY_DAY_WINDOW} days
            </span>
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={() => setScriptOnly((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                scriptOnly
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              With script ({metrics.withScript})
            </button>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
              {metrics.total} completed
            </span>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
            <Loader2 size={28} className="animate-spin text-violet-500" />
            <p className="text-sm">Loading completed videos…</p>
          </div>
        ) : dateGroups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/20 text-gray-500">
            <Library size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No completed videos found</p>
            <p className="text-xs mt-1 max-w-sm px-4">
              {searchQuery || scriptOnly
                ? "Try clearing search or filters."
                : `Only videos completed in the last ${SCRIPT_LIBRARY_DAY_WINDOW} days appear here.`}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 custom-scrollbar pb-2">
            {dateGroups.map((g, i) => (
              <DateSection
                key={g.key}
                dateKey={g.key}
                tasks={g.tasks}
                defaultOpen={i === 0 || g.key === todayKey}
                onGenerate={onGenerate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
