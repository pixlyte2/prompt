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
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
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


const badgeClass = {
  blue: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 max-w-[7rem]",
  violet: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-violet-50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200 max-w-[7rem]",
  amber: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-amber-50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 max-w-[7rem]",
};

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
          <div key={i} className={`h-[3.25rem] sm:h-[4.25rem] sm:flex-1 animate-pulse bg-gray-100/90 dark:bg-gray-800/80 ${segmentDividerClass(i)}`} />
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
      className={`group relative flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 text-left transition-all duration-300 hover:bg-white/40 dark:hover:bg-gray-700/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${segmentDividerClass(index)}`}
    >
      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={12} className={fg} aria-hidden />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base sm:text-lg font-black tabular-nums leading-none text-gray-900 dark:text-white tracking-tight">{value}</span>
          <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{label}</span>
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
  const [todayTasks, setTodayTasks] = useState([]);

  const loadTodayTasks = useCallback(async () => {
    try {
      const { data } = await api.get("/video-tasks");
      const dt = new Date();
      const today = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      const todayList = data.filter(t => t.scheduledDate && t.scheduledDate.startsWith(today));
      setTodayTasks(todayList);
    } catch (err) {
      console.error("Failed to load today's tasks", err);
    }
  }, []);

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
    loadTodayTasks();
  }, [loadStats, loadTodayTasks]);


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
          <h2 id="dash-stats" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
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
              <div className="rounded-2xl border border-white/60 dark:border-gray-700/60 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-xl shadow-gray-200/20 dark:shadow-black/20 overflow-hidden ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
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
          <div className="flex items-center justify-between mb-1 flex-shrink-0">
            <h2 id="dash-activity" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Recent Activity
            </h2>
            {history.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/ai-chat")}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <Zap size={11} /> AI Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryItemId(null);
                    setHistoryModal(true);
                  }}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </button>
              </div>
            )}
          </div>

          {!lastUsed ? (
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
          ) : (
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
              {/* Assigned to Today Breakdown & Details */}
              <div className="flex-shrink-0 flex flex-col gap-2.5 mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Live: Today's Assignments</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[240px] overflow-hidden">
                  {["Pooja", "Soundarya"].map(name => {
                    const myTasks = todayTasks.filter(t => {
                      if (!t.assignedTo) return false;
                      const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
                      return assignees.some(a => a.toLowerCase() === name.toLowerCase());
                    });
                    const count = myTasks.length;
                    if (count === 0) return null;
                    const isPooja = name === "Pooja";
                    const colorClasses = isPooja 
                      ? "bg-gradient-to-br from-pink-50/80 to-rose-50/30 border-pink-100/60 text-pink-700 dark:from-pink-950/20 dark:to-rose-950/10 dark:border-pink-900/40 dark:text-pink-300" 
                      : "bg-gradient-to-br from-purple-50/80 to-indigo-50/30 border-purple-100/60 text-purple-700 dark:from-purple-950/20 dark:to-indigo-950/10 dark:border-purple-900/40 dark:text-purple-300";
                    
                    const dotClass = isPooja ? "bg-pink-500" : "bg-purple-500";
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: isPooja ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={name} 
                        className={`flex flex-col h-full min-w-0 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:scale-[1.01] ${colorClasses}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase tracking-widest">{name}</span>
                          <span className="text-[11px] font-black tabular-nums bg-white/70 dark:bg-black/40 px-2.5 py-0.5 rounded-full ring-1 ring-inset ring-white/20 shadow-inner">{count}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pt-1">
                          {myTasks.map(task => {
                            const taskUrl = getTaskUrl(task);
                            const format = task.contentFormat || "";
                            const fStr = format.toString().toLowerCase();
                            const isShort = fStr.includes("short");
                            const isLong = fStr.includes("long");
                            
                            const formatLabel = isShort ? "Short" : isLong ? "Long" : "";
                            const formatColors = isShort 
                              ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800" 
                              : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800";
                            
                            return (
                              <div key={task._id} className="flex items-center gap-2 group/task rounded-xl px-2.5 py-1.5 transition-all hover:bg-white/60 dark:hover:bg-black/30">
                                <span className={`w-2 h-2 rounded-full ${dotClass} flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-gray-900`} />
                                
                                <a 
                                  href={taskUrl || "#"} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-0 flex items-center justify-between gap-3 group/link"
                                >
                                  <p className={`text-[11px] font-bold leading-tight truncate transition-all group-hover/link:translate-x-0.5 ${task.status === "completed" ? "line-through text-gray-400 dark:text-gray-500 opacity-60" : "text-gray-900 dark:text-white opacity-90 group-hover:opacity-100 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400"}`}>
                                    {task.title}
                                  </p>
                                  {formatLabel && (
                                    <span className={`flex-shrink-0 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border shadow-sm ${formatColors}`}>
                                      {formatLabel}
                                    </span>
                                  )}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Last-session banner */}
              <button
                type="button"
                onClick={() => openChatWithItem(lastUsed)}
                className="flex-shrink-0 w-full rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-gradient-to-r from-amber-50/80 to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/15 px-3 py-2 text-left flex items-center gap-2.5 hover:shadow-sm transition-shadow group"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 flex-shrink-0">
                  <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 leading-none">
                    Resume last session
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lastChannel && <span className={badgeClass.blue}>{lastChannel}</span>}
                    {lastPromptType && <span className={badgeClass.violet}>{lastPromptType}</span>}
                    {(lastUsed.subType || lastUsed.aiModel) && (
                      <span className={badgeClass.amber}>{lastUsed.subType || lastUsed.aiModel}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
                  {timeAgo(lastUsed.timestamp)}
                </span>
                <ChevronRight className="text-gray-400 group-hover:text-amber-500 transition-colors flex-shrink-0" size={14} />
              </button>

              {/* Two-column activity — internally scrollable */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
                {/* Inputs */}
                <div className="min-h-0 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-shrink-0">
                    <MessageSquare size={12} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Inputs
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5">
                    {history.slice(0, 2).map((item) => (
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

                {/* Outputs */}
                <div className="min-h-0 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Outputs
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5">
                    {history.slice(0, 2).map((item) => (
                      <RecentHistoryRow
                        key={`gen-${item.id}`}
                        item={item}
                        mode="output"
                        onOpenChat={openChatWithItem}
                        onOpenGeneration={openGeneration}
                      />
                    ))}
                  </div>
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
