import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Layers,
  FileText,
  MessageSquare,
  BarChart3,
  Activity,
  Clock,
  Sparkles,
  ChevronRight,
  Zap,
  ScrollText,
  Mic,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
import { downloadVoiceOverFile } from "../../utils/voiceOverDownload";
import { getUser } from "../../utils/api";
import HistoryModal from "../../components/HistoryModal";

const PREVIEW_LEN = 90;

const statItems = [
  { key: "totalPrompts", label: "Prompts", icon: FileText, path: "/admin/prompts", bar: "bg-blue-500", iconBg: "bg-blue-50 dark:bg-blue-950/50", fg: "text-blue-600 dark:text-blue-400" },
  { key: "totalChannels", label: "Channels", icon: Layers, path: "/admin/channels", bar: "bg-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950/50", fg: "text-emerald-600 dark:text-emerald-400" },
  { key: "totalUsers", label: "Users", icon: Users, path: "/admin/users", bar: "bg-violet-500", iconBg: "bg-violet-50 dark:bg-violet-950/50", fg: "text-violet-600 dark:text-violet-400" },
  { key: "totalPromptTypes", label: "Prompt Types", icon: Activity, path: "/admin/prompt-types", bar: "bg-amber-500", iconBg: "bg-amber-50 dark:bg-amber-950/50", fg: "text-amber-600 dark:text-amber-400" },
];

function getAIChatHistory() {
  try {
    const stored = localStorage.getItem("AI_CHAT_HISTORY");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function previewInputText(item) {
  const raw = item.sourceText || item.prompt || "";
  return raw.length > PREVIEW_LEN ? `${raw.substring(0, PREVIEW_LEN)}…` : raw;
}

function previewResultText(result) {
  if (!result) return "";
  const plain = result.replace(/<[^>]*>/g, "").replace(/[#*`_~]/g, "");
  return plain.length > PREVIEW_LEN ? `${plain.substring(0, PREVIEW_LEN)}…` : plain;
}

function getTaskUrl(task) {
  if (task.url) return task.url;
  if (task.videoId && (task.platform === "youtube" || !task.platform)) {
    return `https://www.youtube.com/watch?v=${task.videoId}`;
  }
  return null;
}

function toDateKey(d) {
  if (!d || d === "null" || d === "undefined") return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function hasScript(task) {
  return Boolean(String(task?.script ?? "").trim());
}

function getTomorrowDateKey() {
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  return toDateKey(tmrw);
}

function formatTomorrowLabel(key) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

const ASSIGNEES = [
  { value: "pooja", label: "Pooja" },
  { value: "mahalakshmi", label: "Mahalakshmi" },
];

function filterTasksForAssignee(tasks, assigneeValue) {
  return tasks.filter((t) => {
    if (!t.assignedTo) return false;
    const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
    return assignees.some((a) => String(a).toLowerCase() === assigneeValue);
  });
}

function countTaskFormats(tasks) {
  return tasks.reduce((sum, t) => {
    const fmts = Array.isArray(t.contentFormat) ? t.contentFormat : [t.contentFormat].filter(Boolean);
    return sum + fmts.length;
  }, 0);
}


const badgeClass = {
  blue: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 max-w-[7rem]",
  violet: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-violet-50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200 max-w-[7rem]",
  amber: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-amber-50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 max-w-[7rem]",
};

const FORMAT_PILL = {
  short: "bg-orange-100 text-orange-700 border-orange-200/50 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50",
  long: "bg-indigo-100 text-indigo-700 border-indigo-200/50 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800/50",
};

const ASSIGNEE_STYLES = {
  pooja: {
    card: "bg-white/80 dark:bg-gray-900/80 border-pink-100/60 dark:border-pink-900/40 shadow-pink-100/20 dark:shadow-pink-900/10",
    mesh: "bg-pink-400",
    dot: "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]",
    text: "text-pink-600 dark:text-pink-400",
  },
  mahalakshmi: {
    card: "bg-white/80 dark:bg-gray-900/80 border-purple-100/60 dark:border-purple-900/40 shadow-purple-100/20 dark:shadow-purple-900/10",
    mesh: "bg-purple-400",
    dot: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]",
    text: "text-purple-600 dark:text-purple-400",
  },
};

const AssigneePipelineGrid = memo(function AssigneePipelineGrid({ tasks, showScriptBadge }) {
  const columns = ASSIGNEES.map(({ value, label }) => {
    const myTasks = filterTasksForAssignee(tasks, value);
    const count = countTaskFormats(myTasks);
    return { value, label, myTasks, count };
  }).filter((col) => col.count > 0);

  if (columns.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-hidden">
      {columns.map(({ value, label, myTasks, count }) => {
        const styles = ASSIGNEE_STYLES[value] || ASSIGNEE_STYLES.pooja;
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            key={value}
            className={`flex flex-col h-full min-w-0 rounded-xl border px-3 py-2 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl hover:-translate-y-0.5 group/monitor relative overflow-hidden ${styles.card}`}
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none ${styles.mesh}`} />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
                <span className={`text-[12px] font-black uppercase tracking-wider ${styles.text}`}>{label}</span>
              </div>
              <span className="text-[11px] font-black tabular-nums bg-gray-100 dark:bg-black/40 px-2.5 py-0.5 rounded-full ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.05] shadow-inner text-gray-700 dark:text-gray-300">
                {count}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 relative z-10">
              {myTasks.map((task) => {
                const taskUrl = getTaskUrl(task);
                const isDone = task.status === "completed";
                return (
                  <div
                    key={task._id}
                    className="flex items-center gap-2 group/task rounded-lg px-2 py-1 transition-all hover:bg-gray-50/80 dark:hover:bg-black/40 border border-transparent hover:border-black/[0.02] dark:hover:border-white/[0.02] hover:shadow-sm"
                  >
                    <Activity size={12} className={`flex-shrink-0 ${isDone ? "text-gray-300" : styles.text} opacity-40 group-hover/task:opacity-100 transition-opacity`} />
                    {String(task.voiceOverStoredName || "").trim() ? (
                      <button
                        type="button"
                        title="Download uploaded voice-over file"
                        className="flex-shrink-0 p-0.5 rounded text-emerald-600 dark:text-emerald-400 opacity-60 hover:opacity-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            await downloadVoiceOverFile(task);
                            toast.success("Download started");
                          } catch (err) {
                            toast.error(err.message || "Download failed");
                          }
                        }}
                      >
                        <Mic size={12} />
                      </button>
                    ) : null}
                    <a
                      href={taskUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={
                        String(task.script || "").trim()
                          ? `${task.title}\n\nScript:\n${String(task.script).trim()}`
                          : task.title
                      }
                      className="flex-1 min-w-0 flex items-center justify-between gap-3 group/link"
                    >
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {(showScriptBadge || hasScript(task)) ? (
                          <ScrollText
                            size={11}
                            className={`flex-shrink-0 ${isDone ? "text-gray-300" : showScriptBadge ? "text-emerald-500" : styles.text} ${showScriptBadge ? "opacity-70" : "opacity-50"}`}
                            aria-hidden
                          />
                        ) : null}
                        <p
                          className={`text-[11px] font-bold leading-tight truncate transition-all group-hover/link:translate-x-0.5 ${
                            isDone
                              ? "line-through text-gray-400 dark:text-gray-500 opacity-60"
                              : "text-gray-900 dark:text-white opacity-85 group-hover:opacity-100"
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {showScriptBadge ? (
                          <span className="flex-shrink-0 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border shadow-sm bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50">
                            Ready
                          </span>
                        ) : null}
                        {(Array.isArray(task.contentFormat) ? task.contentFormat : [task.contentFormat])
                          .filter(Boolean)
                          .map((fmt) => {
                            const isShort = fmt.toLowerCase().includes("short");
                            const isLong = fmt.toLowerCase().includes("long");
                            const fmtLabel = isShort ? "Short" : isLong ? "Long" : fmt;
                            const colorClass = isShort
                              ? FORMAT_PILL.short
                              : isLong
                                ? FORMAT_PILL.long
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
                            return (
                              <span
                                key={fmt}
                                className={`flex-shrink-0 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border shadow-sm transition-transform group-hover/link:scale-105 ${colorClass}`}
                              >
                                {fmtLabel}
                              </span>
                            );
                          })}
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

function PipelineSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 animate-pulse" />
      ))}
    </div>
  );
}

const HistoryBadges = memo(function HistoryBadges({ item }) {
  const ch = item.channel || item.title?.split(" - ")[0];
  const pt = item.promptType || item.title?.split(" - ")[1];
  return (
    <div className="flex items-center gap-1 min-w-0">
      {ch ? <span className={badgeClass.blue}>{ch}</span> : null}
      {pt ? <span className={badgeClass.violet}>{pt}</span> : null}
      {item.subType ? <span className={badgeClass.amber}>{item.subType}</span> : null}
    </div>
  );
});

const RecentHistoryRow = memo(function RecentHistoryRow({ item, mode, onOpenChat, onOpenGeneration }) {
  const handleClick = () => {
    if (mode === "input") onOpenChat(item);
    else onOpenGeneration(item.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 px-2.5 py-2 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <HistoryBadges item={item} />
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">{timeAgo(item.timestamp)}</span>
      </div>
      <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1 leading-snug">
        {mode === "input" ? previewInputText(item) : previewResultText(item.result)}
      </p>
      <div className="flex items-center justify-between mt-1 gap-1">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{item.videoLength || "—"}</span>
        {mode === "input" ? (
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate max-w-[45%]">{item.aiModel || ""}</span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(item.result || "");
              toast.success("Copied");
            }}
            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
});

function segmentDividerClass(index) {
  const parts = ["min-w-0 w-full sm:flex-1"];
  if (index > 0) parts.push("sm:border-l border-gray-200/90 dark:border-gray-600/80");
  if (index >= 2) parts.push("border-t sm:border-t-0 border-gray-200/90 dark:border-gray-600/80");
  return parts.join(" ");
}

function StatsSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 shadow-sm overflow-hidden" aria-hidden="true">
      <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:flex-row">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-8 sm:flex-1 animate-pulse bg-gray-100/90 dark:bg-gray-800/80 ${segmentDividerClass(i)}`} />
        ))}
      </div>
    </div>
  );
}

function StatSegment({ index, label, icon: Icon, path, bar, iconBg, fg, value, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(path)}
      className={`group relative flex items-center gap-1 px-2 py-0.5 sm:px-2.5 text-left transition-all duration-300 hover:bg-white/40 dark:hover:bg-gray-700/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${segmentDividerClass(index)}`}
    >
      <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded ${iconBg} shadow-sm transition-transform duration-300 group-hover:scale-105`}>
        <Icon size={10} className={fg} aria-hidden />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-baseline gap-1">
          <span className="text-xs sm:text-sm font-black tabular-nums leading-none text-gray-900 dark:text-white tracking-tight">{value}</span>
          <span className="text-[7px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{label}</span>
        </div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const reduceMotion = useReducedMotion();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChannels: 0,
    totalPrompts: 0,
    totalPromptTypes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);
  const [historyRev, setHistoryRev] = useState(0);
  const [videoTasks, setVideoTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const loadVideoTasks = useCallback(async () => {
    try {
      const { data } = await api.get("/video-tasks");
      setVideoTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load video tasks", err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const tomorrowKey = useMemo(() => getTomorrowDateKey(), []);

  const todayTasks = useMemo(
    () => videoTasks.filter((t) => t.scheduledDate && toDateKey(t.scheduledDate) === todayKey),
    [videoTasks, todayKey],
  );

  const tomorrowScriptTasks = useMemo(
    () =>
      videoTasks.filter(
        (t) => t.scheduledDate && toDateKey(t.scheduledDate) === tomorrowKey && hasScript(t),
      ),
    [videoTasks, tomorrowKey],
  );

  const hasTomorrowScripts = tomorrowScriptTasks.length > 0;
  const hasDeliveryToday = todayTasks.some((t) => {
    if (!t.assignedTo) return false;
    const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
    return assignees.some((a) => ASSIGNEES.some(({ value }) => String(a).toLowerCase() === value));
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "AI_CHAT_HISTORY") setHistoryRev((r) => r + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const history = useMemo(() => getAIChatHistory(), [location.pathname, location.key, historyRev]);
  const lastUsed = history[0] || null;

  const lastChannel = lastUsed?.title?.split(" - ")[0] || null;
  const lastPromptType = lastUsed?.title?.split(" - ")[1] || null;

  const loadStats = useCallback(async (opts = { silent: false }) => {
    if (opts.silent) setRefreshing(true);
    try {
      const { data } = await api.get("/dashboard");
      setStats({
        totalUsers: data.totalUsers ?? 0,
        totalChannels: data.totalChannels ?? 0,
        totalPrompts: data.totalPrompts ?? 0,
        totalPromptTypes: data.totalPromptTypes ?? 0,
      });
    } catch {
      toast.error("Could not refresh workspace stats");
    } finally {
      setLoading(false);
      if (opts.silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadVideoTasks();
  }, [loadStats, loadVideoTasks]);


  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const openChatWithItem = useCallback(
    (item) => {
      navigate("/admin/ai-chat", {
        state: {
          promptId: item.promptId,
          sourceText: item.sourceText,
          videoLength: item.videoLength,
          aiModel: item.aiModel,
        },
      });
    },
    [navigate],
  );

  const openGeneration = useCallback((id) => {
    setHistoryItemId(id);
    setHistoryModal(true);
  }, []);

  const fadeIn = reduceMotion
    ? { initial: false, animate: {} }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } };

  return (
    <AdminLayout
      title="Dashboard"
      titleInfo={`Good ${greeting}, ${user?.name || "Admin"}`}
      icon={BarChart3}
      contentFit
    >
      <div className="flex flex-col h-full min-h-0 gap-2.5 overflow-hidden w-full max-w-[1600px] mx-auto">
        {/* ── Stats section with inline quick-actions ── */}
        <section className="flex-shrink-0" aria-labelledby="dash-stats">
          <h2 id="dash-stats" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Overview
          </h2>

          {loading ? (
            <StatsSkeleton />
          ) : (
            <motion.div
              layout
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="rounded-xl border border-white/60 dark:border-gray-700/60 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-lg shadow-gray-200/20 dark:shadow-black/20 overflow-hidden ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
                <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:flex-row">
                  {statItems.map(({ key, label, icon, path, bar, iconBg, fg }, index) => (
                    <StatSegment
                      key={key}
                      index={index}
                      label={label}
                      icon={icon}
                      path={path}
                      bar={bar}
                      iconBg={iconBg}
                      fg={fg}
                      value={stats[key]}
                      onNavigate={navigate}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* ── Activity — fills all remaining viewport ── */}
        <section className="flex-1 min-h-0 flex flex-col overflow-hidden" aria-labelledby="dash-activity">

          {/* Delivery Monitor — Premium Assignments Widget */}
          <div className="flex-shrink-0 flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                </div>
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  Delivery Monitor
                  <span className="h-3 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
                  <span className="opacity-60">Pipeline Overview</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30">
                <Zap size={10} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Live</span>
              </div>
            </div>
            
            {tasksLoading ? (
              <PipelineSkeleton />
            ) : hasDeliveryToday ? (
              <AssigneePipelineGrid tasks={todayTasks} />
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 px-1">No deliveries scheduled for today.</p>
            )}
          </div>

          {(tasksLoading || hasTomorrowScripts) && (
            <div className="flex-shrink-0 flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ScrollText size={12} className="text-sky-500" aria-hidden />
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    Scripts for Tomorrow
                    <span className="h-3 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
                    <span className="opacity-60">{formatTomorrowLabel(tomorrowKey)}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/admin/production-hub")}
                  className="flex items-center gap-1 text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-tighter hover:underline"
                >
                  Production Hub
                  <ChevronRight size={10} />
                </button>
              </div>
              {tasksLoading ? (
                <PipelineSkeleton />
              ) : (
                <AssigneePipelineGrid tasks={tomorrowScriptTasks} showScriptBadge />
              )}
            </div>
          )}

          {!lastUsed && !hasTomorrowScripts ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-800/20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-3">
                <MessageSquare className="h-7 w-7 text-blue-500/80 dark:text-blue-400/80" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No activity yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Start an AI Chat session to generate content. Your recent activity will appear here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/admin/ai-chat")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                <Sparkles size={13} />
                Open AI Chat
              </button>
            </div>
          ) : !lastUsed && hasTomorrowScripts ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-xl border border-dashed border-sky-200/80 dark:border-sky-800/60 bg-sky-50/30 dark:bg-sky-950/20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center mb-3">
                <ScrollText className="h-7 w-7 text-sky-500/80 dark:text-sky-400/80" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tomorrow&apos;s scripts are ready</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Scheduled tasks with scripts appear in the pipeline above. Add voice-over or open AI Chat when you need more content.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/admin/voice-over")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 shadow-sm transition-colors"
                >
                  <Mic size={13} />
                  Voice Over
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/ai-chat")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 shadow-sm transition-colors"
                >
                  <Sparkles size={13} />
                  AI Chat
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
              {/* Last-session banner */}

              {/* Single Column Activity */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Recent Activity / Prompts
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 no-scrollbar">
                  {history.slice(0, 6).map((item) => (
                    <RecentHistoryRow
                      key={item.id}
                      item={item}
                      mode="input"
                      onOpenChat={openChatWithItem}
                      onOpenGeneration={openGeneration}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {historyModal && <HistoryModal onClose={() => setHistoryModal(false)} initialItemId={historyItemId} />}
    </AdminLayout>
  );
}
