import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import api from "../utils/api";
import { toDateKey } from "../utils/videoTaskSchedule";

const WORK_DAYS = 6;
const PANEL_EXPANDED = "w-[clamp(195px,18.75vw,315px)]";
const PANEL_COLLAPSED = "w-14";

const ASSIGNEE_META = {
  pooja: {
    dot: "bg-pink-400",
    bar: "bg-pink-500",
    text: "text-pink-600 dark:text-pink-300",
    pill: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    softBg: "bg-pink-50/70 dark:bg-pink-950/20 border-pink-200/70 dark:border-pink-800/40",
    label: "Pooja",
  },
  mahalakshmi: {
    dot: "bg-purple-400",
    bar: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-300",
    pill: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    softBg: "bg-purple-50/70 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-800/40",
    label: "Maha",
  },
  maha: {
    dot: "bg-purple-400",
    bar: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-300",
    pill: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    softBg: "bg-purple-50/70 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-800/40",
    label: "Maha",
  },
};

const FORMAT_PILL = {
  long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

function getMondayOfCurrentWeek() {
  const monday = new Date();
  const dayOfWeek = monday.getDay();
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDays() {
  const monday = getMondayOfCurrentWeek();
  return Array.from({ length: WORK_DAYS }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      dateKey: toDateKey(date),
      date,
      shortLabel: date.toLocaleDateString("en-IN", { weekday: "short" }),
      dayNum: date.getDate(),
    };
  });
}

function getAssigneeMeta(name) {
  const key = String(name).toLowerCase();
  if (ASSIGNEE_META[key]) return ASSIGNEE_META[key];
  return {
    dot: "bg-blue-400",
    bar: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-300",
    pill: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    softBg: "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700",
    label: key.charAt(0).toUpperCase() + key.slice(1),
  };
}

function accumulateTaskCounts(bucket, task) {
  const assignees = Array.isArray(task.assignedTo)
    ? task.assignedTo.filter(Boolean)
    : task.assignedTo
      ? [task.assignedTo]
      : ["Unassigned"];

  const formats = Array.isArray(task.contentFormat)
    ? task.contentFormat
    : [task.contentFormat].filter(Boolean);

  assignees.forEach((name) => {
    if (!bucket[name]) bucket[name] = { long: 0, short: 0, count: 0 };
    bucket[name].count += 1;
    formats.forEach((f) => {
      const fl = String(f).toLowerCase();
      if (fl.includes("short")) bucket[name].short += 1;
      else if (fl.includes("long")) bucket[name].long += 1;
    });
  });
}

function buildWeekOverview(tasks, weekDays) {
  const byDay = Object.fromEntries(weekDays.map(({ dateKey }) => [dateKey, {}]));
  const weekTotal = {};
  const weekDateKeys = new Set(weekDays.map((d) => d.dateKey));

  let longTotal = 0;
  let shortTotal = 0;

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    const key = toDateKey(task.scheduledDate);
    if (!weekDateKeys.has(key)) return;

    accumulateTaskCounts(byDay[key], task);
    accumulateTaskCounts(weekTotal, task);

    const formats = Array.isArray(task.contentFormat)
      ? task.contentFormat
      : [task.contentFormat].filter(Boolean);
    formats.forEach((f) => {
      const fl = String(f).toLowerCase();
      if (fl.includes("short")) shortTotal += 1;
      else if (fl.includes("long")) longTotal += 1;
    });
  });

  const assigneeOrder = ["mahalakshmi", "maha", "pooja"];
  const seen = new Set();
  const assignees = [];

  assigneeOrder.forEach((key) => {
    const match = Object.keys(weekTotal).find((n) => n.toLowerCase() === key);
    if (match && !seen.has(match)) {
      seen.add(match);
      assignees.push(match);
    }
  });
  Object.keys(weekTotal)
    .filter((n) => !seen.has(n))
    .sort((a, b) => a.localeCompare(b))
    .forEach((n) => assignees.push(n));

  const weekTaskTotal = Object.values(weekTotal).reduce((s, c) => s + (c?.count || 0), 0);

  return {
    byDay,
    weekTotal,
    assignees,
    analytics: {
      longTotal,
      shortTotal,
      weekTaskTotal,
    },
  };
}

function WeekStatsCard({ analytics, assignees, weekTotal }) {
  const { weekTaskTotal, longTotal, shortTotal } = analytics;
  if (weekTaskTotal === 0) return null;

  const formatTotal = longTotal + shortTotal;
  const longPct = formatTotal > 0 ? Math.round((longTotal / formatTotal) * 100) : 0;

  const assigneeShares = assignees.map((name) => {
    const c = weekTotal[name] || { long: 0, short: 0 };
    return { name, total: (c.long || 0) + (c.short || 0), meta: getAssigneeMeta(name) };
  });
  const assigneeSum = assigneeShares.reduce((s, a) => s + a.total, 0) || 1;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-md shadow-gray-200/20 dark:shadow-black/20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm shrink-0">
      <div className="relative overflow-hidden px-3 py-3 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white/30 dark:from-blue-950/30 dark:via-indigo-950/15 dark:to-gray-900/20">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-indigo-400/20 blur-2xl dark:bg-indigo-500/10"
          aria-hidden
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-gray-800/80 border border-blue-100/80 dark:border-blue-900/40 shadow-sm">
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-700/70 dark:text-blue-300/80">
                This week
              </p>
              {formatTotal > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  {longTotal > 0 && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.long}`}>
                      {longTotal}L
                    </span>
                  )}
                  {shortTotal > 0 && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.short}`}>
                      {shortTotal}S
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="text-3xl font-black tabular-nums leading-none text-gray-900 dark:text-white">
              {weekTaskTotal}
            </span>
          </div>
        </div>

        {formatTotal > 0 && (
          <div className="relative mt-3">
            <div className="h-1.5 rounded-full overflow-hidden flex bg-white/60 dark:bg-gray-800/60 shadow-inner">
              <div className="bg-indigo-500 transition-all duration-500" style={{ width: `${longPct}%` }} />
              <div className="bg-orange-400 transition-all duration-500" style={{ width: `${100 - longPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {assigneeShares.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100/80 dark:border-gray-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Workload</span>
            <div className="flex items-center gap-1.5">
              {assigneeShares.map(({ name, total, meta }) => (
                <span key={name} className={`inline-flex items-center gap-1 text-[10px] font-bold ${meta.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label} {total}
                </span>
              ))}
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
            {assigneeShares.map(({ name, total, meta }) => (
              <div
                key={name}
                className={`${meta.bar} transition-all duration-500`}
                style={{ width: `${Math.round((total / assigneeSum) * 100)}%` }}
                title={`${meta.label}: ${total}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDayLabel(dateKey, isToday) {
  const d = new Date(`${dateKey}T00:00:00`);
  const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  if (isToday) return `Today — ${label}`;
  return label;
}

function buildDayDailySummary(dayCounts) {
  let long = 0;
  let short = 0;
  Object.values(dayCounts).forEach((c) => {
    long += c?.long || 0;
    short += c?.short || 0;
  });
  return { long, short, total: long + short };
}

function getAssigneeDotColor(name) {
  const key = String(name).toLowerCase();
  if (key === "unassigned") return "bg-amber-400";
  if (key === "pooja") return "bg-pink-400";
  if (key === "mahalakshmi" || key === "maha") return "bg-purple-400";
  return "bg-blue-400";
}

function getAssigneeTextColor(name) {
  const key = String(name).toLowerCase();
  if (key === "unassigned") return "text-amber-600 dark:text-amber-400";
  const meta = ASSIGNEE_META[key];
  if (meta) return meta.text;
  return "text-gray-700 dark:text-gray-300";
}

function AssigneePill({ name, counts, wide = false }) {
  const totalSum = (counts.long || 0) + (counts.short || 0);
  const dotColor = getAssigneeDotColor(name);
  const textColor = getAssigneeTextColor(name);
  const displayName = getAssigneeMeta(name).label;

  return (
    <div
      className={`flex items-center justify-between gap-1 pl-2 pr-1.5 py-1 rounded-xl border shadow-sm backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border-white/50 dark:border-gray-700/50 ${
        wide ? "flex-1 min-w-0" : "shrink-0"
      }`}
      title={`${displayName}: ${counts.long || 0} long · ${counts.short || 0} short`}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
        <span className={`text-[9px] font-black uppercase tracking-wider truncate ${textColor}`}>
          {displayName}
        </span>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {totalSum > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.125rem] px-1 py-0.5 rounded-lg text-[9px] font-black bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 shadow-sm">
            {totalSum}
          </span>
        )}
        {counts.long > 0 && (
          <span className={`inline-flex items-center justify-center min-w-[1.125rem] px-1 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.long} shadow-sm`}>
            {counts.long}L
          </span>
        )}
        {counts.short > 0 && (
          <span className={`inline-flex items-center justify-center min-w-[1.125rem] px-1 py-0.5 rounded-lg text-[9px] font-bold ${FORMAT_PILL.short} shadow-sm`}>
            {counts.short}S
          </span>
        )}
      </div>
    </div>
  );
}

function DayDateGroup({ dateKey, dayCounts, assignees, isToday }) {
  const dailySummary = buildDayDailySummary(dayCounts);
  const allNames = [...assignees, ...Object.keys(dayCounts).filter((n) => !assignees.includes(n))];
  const assignmentEntries = allNames
    .map((name) => [name, dayCounts[name]])
    .filter(([, counts]) => counts?.count);

  const borderColor = isToday ? "border-l-blue-500" : "border-l-gray-300 dark:border-l-gray-600";
  const headerBg = isToday ? "bg-blue-50/60 dark:bg-blue-950/10" : "bg-gray-50/60 dark:bg-gray-800/30";

  return (
    <div
      className={`flex-1 min-h-0 flex flex-col rounded-2xl border border-gray-100 dark:border-gray-700 border-l-[4px] ${borderColor} overflow-hidden shadow-md shadow-gray-200/20 dark:shadow-black/20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm transition-all duration-300`}
    >
      <div className={`flex flex-1 flex-col justify-center gap-1.5 px-2.5 py-2 w-full ${headerBg} backdrop-blur-md`}>
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <span
            className={`text-xs font-black truncate ${
              isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {formatDayLabel(dateKey, isToday)}
          </span>

          {dailySummary.total > 0 ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 shadow-sm shrink-0">
              <span className="text-[10px] font-black tabular-nums text-gray-700 dark:text-gray-300">
                {dailySummary.total}
              </span>
              {(dailySummary.long > 0 || dailySummary.short > 0) && (
                <>
                  <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                  <div className="flex items-center gap-1">
                    {dailySummary.long > 0 && (
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{dailySummary.long}L</span>
                    )}
                    {dailySummary.short > 0 && (
                      <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">{dailySummary.short}S</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">—</span>
          )}
        </div>

        {assignmentEntries.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5 w-full">
            {assignmentEntries.map(([name, counts]) => (
              <AssigneePill key={name} name={name} counts={counts} wide />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WeekTotalsRow({ weekTotal, assignees, weekTaskTotal }) {
  if (weekTaskTotal === 0 || assignees.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 shrink-0">
      {assignees.map((name) => {
        const meta = getAssigneeMeta(name);
        const counts = weekTotal[name] || { long: 0, short: 0 };
        const total = (counts.long || 0) + (counts.short || 0);
        return (
          <div
            key={name}
            className={`rounded-xl border px-2.5 py-2 ${meta.softBg} ${meta.text} shadow-sm`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              <span className="text-[10px] font-black uppercase tracking-wider">{meta.label}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black leading-none tabular-nums">{total}</span>
              <div className="flex items-center gap-1 ml-auto">
                {counts.long > 0 && (
                  <span className={`inline-flex items-center justify-center px-1.5 py-px rounded text-[8px] font-bold ${FORMAT_PILL.long}`}>
                    {counts.long}L
                  </span>
                )}
                {counts.short > 0 && (
                  <span className={`inline-flex items-center justify-center px-1.5 py-px rounded text-[8px] font-bold ${FORMAT_PILL.short}`}>
                    {counts.short}S
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekOverviewPanel({ isCollapsed, onToggleCollapse }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const weekDays = useMemo(() => getWeekDays(), []);
  const todayKey = toDateKey(new Date());

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0]?.date;
    const end = weekDays[weekDays.length - 1]?.date;
    if (!start || !end) return "";
    return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString("en-IN", { month: "short" })}`;
  }, [weekDays]);

  const { byDay, weekTotal, assignees, analytics } = useMemo(
    () => buildWeekOverview(tasks, weekDays),
    [tasks, weekDays],
  );

  const { weekTaskTotal } = analytics;

  const fetchTasks = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get("/video-tasks");
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <aside
      className={`hidden md:flex shrink-0 relative bg-gray-50/50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-screen flex-col z-20 transition-[width] duration-300 ease-in-out ${
        isCollapsed ? PANEL_COLLAPSED : PANEL_EXPANDED
      }`}
    >
      <div
        className={`flex-shrink-0 border-b border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 min-h-16 flex items-center ${
          isCollapsed ? "px-2 justify-center" : "px-3"
        }`}
      >
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 min-w-0 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 items-center justify-center shadow-sm shrink-0">
                <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 leading-tight">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Week Overview
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {weekRangeLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/admin/trending-hub"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Open schedule"
              >
                <ExternalLink size={14} />
              </Link>
              <button
                type="button"
                onClick={() => fetchTasks(true)}
                disabled={loading || refreshing}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 items-center justify-center shadow-sm">
            <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" aria-hidden />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer"
        title={isCollapsed ? "Expand week overview" : "Collapse week overview"}
        aria-label={isCollapsed ? "Expand week overview" : "Collapse week overview"}
      >
        {isCollapsed ? <ChevronLeft size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <p className="text-xs font-semibold text-gray-500">Loading…</p>
          </div>
        ) : isCollapsed ? (
          <div className="flex flex-col flex-1 min-h-0 p-1.5 gap-1 overflow-hidden">
            {weekDays.map(({ dateKey, shortLabel }) => {
              const dayCounts = byDay[dateKey] || {};
              const dailySummary = buildDayDailySummary(dayCounts);
              const dayTotal = dailySummary.total;
              const isToday = dateKey === todayKey;
              const formatHint = [
                dailySummary.long > 0 ? `${dailySummary.long}L` : "",
                dailySummary.short > 0 ? `${dailySummary.short}S` : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={dateKey}
                  title={`${shortLabel}: ${dayTotal}${formatHint ? ` · ${formatHint}` : ""}`}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border min-h-0 py-1 transition-colors ${
                    isToday
                      ? "bg-blue-100 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 shadow-sm shadow-blue-500/20"
                      : "bg-white/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase leading-none tracking-wide ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                    {shortLabel.slice(0, 2)}
                  </span>
                  <span className={`text-sm font-black tabular-nums leading-none ${dayTotal ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                    {dayTotal || "·"}
                  </span>
                  {formatHint ? (
                    <div className="flex flex-col items-center gap-0.5 leading-none">
                      {dailySummary.long > 0 && (
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{dailySummary.long}L</span>
                      )}
                      {dailySummary.short > 0 && (
                        <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">{dailySummary.short}S</span>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : weekTaskTotal === 0 ? (
          <div className="flex flex-col flex-1 min-h-0 p-3">
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-800/20 text-center px-4">
              <CalendarDays className="h-8 w-8 text-gray-400 mb-2" aria-hidden />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nothing scheduled this week</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Schedule from Trending or Production Hub
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col flex-1 min-h-0 overflow-hidden p-2.5 gap-2"
            style={{ paddingBottom: "5.5rem" }}
          >
            <WeekStatsCard analytics={analytics} assignees={assignees} weekTotal={weekTotal} />

            <div className="flex-1 min-h-0 flex flex-col gap-1.5">
              {weekDays.map((day) => (
                <DayDateGroup
                  key={day.dateKey}
                  dateKey={day.dateKey}
                  dayCounts={byDay[day.dateKey] || {}}
                  assignees={assignees}
                  isToday={day.dateKey === todayKey}
                />
              ))}
            </div>

            <WeekTotalsRow weekTotal={weekTotal} assignees={assignees} weekTaskTotal={weekTaskTotal} />
          </div>
        )}
      </div>
    </aside>
  );
}

export default WeekOverviewPanel;
