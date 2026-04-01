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
  Plus,
  ArrowUpRight,
  Activity,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCw,
  Zap,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
import { getUser } from "../../utils/api";
import HistoryModal from "../../components/HistoryModal";

const VISIBLE_HISTORY = 2;
const PREVIEW_LEN = 72;

const statItems = [
  { key: "totalPrompts", label: "Prompts", icon: FileText, path: "/admin/prompts", bar: "bg-blue-500", iconBg: "bg-blue-50 dark:bg-blue-950/50", fg: "text-blue-600 dark:text-blue-400" },
  { key: "totalChannels", label: "Channels", icon: Layers, path: "/admin/channels", bar: "bg-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950/50", fg: "text-emerald-600 dark:text-emerald-400" },
  { key: "totalUsers", label: "Users", icon: Users, path: "/admin/users", bar: "bg-violet-500", iconBg: "bg-violet-50 dark:bg-violet-950/50", fg: "text-violet-600 dark:text-violet-400" },
  { key: "totalPromptTypes", label: "Prompt types", icon: Activity, path: "/admin/prompt-types", bar: "bg-amber-500", iconBg: "bg-amber-50 dark:bg-amber-950/50", fg: "text-amber-600 dark:text-amber-400" },
];

const actions = [
  { title: "Prompt", icon: Plus, path: "/admin/prompts", cta: "Open" },
  { title: "Users", icon: Users, path: "/admin/users", cta: "Manage" },
  { title: "AI Chat", icon: MessageSquare, path: "/admin/ai-chat", cta: "Launch" },
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
  const shortened = raw.length > PREVIEW_LEN;
  return `${raw.substring(0, PREVIEW_LEN)}${shortened ? "…" : ""}`;
}

function previewResultText(result) {
  if (!result) return "";
  const plain = result.replace(/<[^>]*>/g, "").replace(/[#*`_~]/g, "");
  const shortened = plain.length > PREVIEW_LEN;
  return `${plain.substring(0, PREVIEW_LEN)}${shortened ? "…" : ""}`;
}

const badgeClass = {
  blue: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 max-w-[7rem]",
  violet: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-violet-50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200 max-w-[7rem]",
  amber: "text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-amber-50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 max-w-[7rem]",
};

function SectionLabel({ id, title, action }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1 flex-shrink-0">
      <h2 id={id} className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      {action}
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
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 px-2 py-1.5 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-0"
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
            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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
    <div
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 shadow-sm overflow-hidden flex-shrink-0"
      aria-hidden="true"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:flex-row">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-[3.25rem] sm:h-[4.25rem] sm:flex-1 animate-pulse bg-gray-100/90 dark:bg-gray-800/80 ${segmentDividerClass(i)}`}
          />
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
      className={`group relative flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3.5 text-left transition-colors hover:bg-gray-50/95 dark:hover:bg-gray-700/35 active:bg-gray-100/80 dark:active:bg-gray-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${segmentDividerClass(index)}`}
    >
      <span className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${bar} opacity-90`} aria-hidden />
      <div className={`ml-1 flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon size={16} className={fg} aria-hidden />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-lg sm:text-xl font-semibold tabular-nums leading-none text-gray-900 dark:text-white">{value}</p>
        <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate">{label}</p>
      </div>
      <ChevronRight
        size={16}
        className="flex-shrink-0 text-gray-300 dark:text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500 dark:group-hover:text-blue-400"
        aria-hidden
      />
    </button>
  );
}

function OverviewStatStrip({ children }) {
  return (
    <div className="rounded-xl border border-gray-200/90 dark:border-gray-700/90 bg-white dark:bg-gray-800/50 shadow-sm overflow-hidden ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
      <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:flex-row">{children}</div>
    </div>
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

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "AI_CHAT_HISTORY") setHistoryRev((r) => r + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const history = useMemo(() => getAIChatHistory(), [location.pathname, location.key, historyRev]);
  const recentHistory = useMemo(() => history.slice(0, VISIBLE_HISTORY), [history]);
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
  }, [loadStats]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const displayName = user?.name || user?.email?.split("@")[0] || "there";

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
    [navigate]
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
      <div className="flex flex-col h-full min-h-0 gap-2 md:gap-2.5 overflow-hidden w-full max-w-[1600px] mx-auto">
        {/* Compact header bar */}
        <motion.div
          {...fadeIn}
          className="flex-shrink-0 rounded-xl border border-gray-200/90 dark:border-gray-700/90 bg-gradient-to-r from-white to-slate-50/90 dark:from-gray-800 dark:to-gray-800/90 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 leading-none">Good {greeting}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-0.5">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => loadStats({ silent: true })}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Refresh stats"
              aria-label="Refresh stats"
            >
              <RotateCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/ai-chat")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Zap size={14} aria-hidden />
              AI Chat
            </button>
          </div>
        </motion.div>

        {/* Stats — single strip, no gaps between metrics */}
        <section className="flex-shrink-0" aria-labelledby="dash-stats">
          <SectionLabel
            id="dash-stats"
            title="Overview"
            action={
              <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:inline">Open any metric</span>
            }
          />
          {loading ? (
            <StatsSkeleton />
          ) : (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <OverviewStatStrip>
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
              </OverviewStatStrip>
            </motion.div>
          )}
        </section>

        {/* Shortcuts */}
        <section className="flex-shrink-0" aria-labelledby="dash-shortcuts">
          <SectionLabel id="dash-shortcuts" title="Shortcuts" />
          <div className="grid grid-cols-3 gap-2">
            {actions.map(({ title, icon: Icon, path, cta }) => (
              <button
                key={title}
                type="button"
                onClick={() => navigate(path)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-2.5 py-2 text-left shadow-sm hover:shadow hover:border-gray-300 dark:hover:border-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-w-0"
              >
                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/80">
                  <Icon size={14} className="text-gray-700 dark:text-gray-200" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{title}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{cta}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Activity: fills remaining height, no page scroll */}
        <section className="flex-1 min-h-0 flex flex-col overflow-hidden" aria-labelledby="dash-activity">
          <SectionLabel
            id="dash-activity"
            title="Activity"
            action={
              lastUsed ? (
                <button
                  type="button"
                  onClick={() => navigate("/admin/ai-chat")}
                  className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                >
                  Chat <ArrowUpRight size={10} />
                </button>
              ) : null
            }
          />

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-2">
            {!lastUsed ? (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-800/20 px-4 py-3 text-center">
                <MessageSquare className="h-8 w-8 text-blue-500/70 dark:text-blue-400/80 mb-2" aria-hidden />
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">No AI chats yet</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs">
                  Open AI Chat to generate — recent runs appear here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/admin/ai-chat")}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Sparkles size={12} />
                  Open AI Chat
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openChatWithItem(lastUsed)}
                  className="flex-shrink-0 w-full rounded-lg border border-amber-200/90 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/90 to-orange-50/40 dark:from-amber-950/35 dark:to-orange-950/20 px-2.5 py-2 text-left flex flex-wrap items-center gap-2 hover:shadow-sm"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/50">
                    <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">Last session</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {lastChannel ? <span className={badgeClass.blue}>{lastChannel}</span> : null}
                      {lastPromptType ? <span className={badgeClass.violet}>{lastPromptType}</span> : null}
                      {(lastUsed.subType || lastUsed.aiModel) ? (
                        <span className={badgeClass.amber}>{lastUsed.subType || lastUsed.aiModel}</span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">{timeAgo(lastUsed.timestamp)}</span>
                  <ChevronRight className="text-gray-400 flex-shrink-0" size={14} />
                </button>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-hidden">
                  <div className="min-h-0 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-1 flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MessageSquare size={11} /> Inputs
                      </span>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
                      {recentHistory.map((item) => (
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
                  <div className="min-h-0 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-1 flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> Outputs
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryItemId(null);
                          setHistoryModal(true);
                        }}
                        className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        All
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
                      {recentHistory.map((item) => (
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
              </>
            )}
          </div>
        </section>
      </div>

      {historyModal && <HistoryModal onClose={() => setHistoryModal(false)} initialItemId={historyItemId} />}
    </AdminLayout>
  );
}
