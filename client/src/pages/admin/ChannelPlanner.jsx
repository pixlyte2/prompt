import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  FileText,
  Filter,
  Image,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import PageTabBar from "../../components/PageTabBar";
import api, { httpClient } from "../../services/api";
import { clearCacheByPrefix } from "../../utils/cache";
import ChannelPlanModal from "../../components/ChannelPlanModal";
import ConfirmModal from "../../components/ConfirmModal";

const DATE_GROUP_PAGE_SIZE = 10;
const LOG_HISTORY_DAYS_PER_PAGE = 10;

const REPORT_PERIODS = [
  { value: "current-week", label: "This week", shortLabel: "Week" },
  { value: "last-3-months", label: "Last Three Month", shortLabel: "3 mo" },
  { value: "current-month", label: "This month", shortLabel: "Month" },
  { value: "last-12-months", label: "Last 12 months", shortLabel: "12 mo" },
  { value: "custom", label: "Custom" },
];

const REPORT_ATTENTION_FILTERS = [
  { value: "all", label: "All channels", shortLabel: "All" },
  { value: "attention", label: "Needs attention", shortLabel: "Alert" },
];

const PAGE_TABS = [
  { id: "plans", label: "Plans", shortLabel: "Plans", icon: CalendarDays },
  { id: "log-work", label: "Log Work", shortLabel: "Log", icon: ClipboardList },
  { id: "report", label: "Report", shortLabel: "Report", icon: FileText },
];

const FORMAT_PILL = {
  long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  firstCut: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const ROW_PILL_SIZES = {
  planId: "shrink-0 w-[2.75rem] justify-center",
  count: "shrink-0 w-[3.25rem] justify-center",
  firstCut: "shrink-0 min-w-[4.75rem] justify-center",
};

const NOTES_PILL =
  "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-sky-200/90 bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-100 dark:border-sky-700/60 dark:bg-sky-900/35 dark:text-sky-100 dark:hover:border-sky-500 dark:hover:bg-sky-900/55 min-h-[20px] sm:min-h-[26px] sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[11px]";

/* ─── Production Hub-style shared UI ─── */

function FilterSegment({ options, value, onChange, variant = "default" }) {
  const activeVariants = {
    default: "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm",
    success: "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm",
  };

  return (
    <div className="inline-flex max-w-full min-w-0 overflow-x-auto scrollbar-hide rounded-xl border border-gray-200/50 bg-gray-100/80 p-1 dark:border-gray-700/50 dark:bg-gray-800/80">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative flex min-h-8 flex-shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold touch-manipulation transition-colors sm:min-h-0 sm:px-3.5 sm:py-1.5 sm:text-xs ${
            value === option.value
              ? activeVariants[variant]
              : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200"
          }`}
        >
          <span className="sm:hidden">{option.shortLabel ?? option.label}</span>
          <span className="hidden sm:inline">{option.label}</span>
          {option.count !== undefined && option.count > 0 && (
            <span
              className={`ml-0.5 rounded-md px-1 py-0.5 text-[9px] font-bold tabular-nums ${
                value === option.value
                  ? variant === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
              }`}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function formatFootageMinutes(minutes) {
  const value = Number(minutes) || 0;
  if (value <= 0) return null;
  const hours = value / 60;
  if (hours >= 1) return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
  return `${Math.round(value)}m`;
}

function FilterChipMetric({ label, value, active, variant = "neutral" }) {
  if (value === undefined || value === null || value === "") return null;
  const tones = {
    footage: active
      ? "bg-white/20 text-white"
      : "border border-teal-200/80 bg-teal-50 text-teal-700 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-300",
    long: active
      ? "bg-white/20 text-white"
      : `border border-current ${FORMAT_PILL.long}`,
    short: active
      ? "bg-white/20 text-white"
      : `border border-current ${FORMAT_PILL.short}`,
    neutral: active
      ? "bg-white/25 text-white"
      : "border border-gray-200/80 bg-gray-50/80 text-gray-600 dark:border-gray-600/60 dark:bg-gray-800/40 dark:text-gray-300",
  };
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] leading-none transition-colors ${tones[variant]}`}
      title={`${label}: ${value}`}
    >
      <span className="font-medium opacity-65 sm:hidden">{label === "Footage" ? "Ft" : label === "Long" ? "L" : label === "Short" ? "S" : label === "Plans" ? "#" : label}</span>
      <span className="hidden font-medium opacity-65 sm:inline">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}

function FilterChip({ active, onClick, children, count, footageMinutes, longCount, shortCount }) {
  const footageLabel = footageMinutes !== undefined ? formatFootageMinutes(footageMinutes) : null;
  const showPlanMetrics = footageMinutes !== undefined || longCount !== undefined || shortCount !== undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide touch-manipulation transition-colors sm:min-h-0 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs ${
        active
          ? "border-transparent bg-primary-500 text-white shadow-sm"
          : "border-gray-200/80 bg-white/60 text-gray-700 hover:border-primary-400/50 hover:bg-white hover:shadow-sm dark:border-gray-700/80 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:border-primary-500/50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
      {showPlanMetrics && (
        <span className="inline-flex items-center gap-1">
          <FilterChipMetric label="Footage" value={footageLabel} active={active} variant="footage" />
          <FilterChipMetric label="Long" value={longCount > 0 ? longCount : null} active={active} variant="long" />
          <FilterChipMetric label="Short" value={shortCount > 0 ? shortCount : null} active={active} variant="short" />
        </span>
      )}
      {!showPlanMetrics && count !== undefined && count > 0 && (
        <FilterChipMetric label="Plans" value={count} active={active} variant="neutral" />
      )}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder, onClear }) {
  return (
    <div className="group relative min-w-0 w-full max-w-md flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search size={14} className="text-gray-400 transition-colors duration-300 group-focus-within:text-primary-500" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="buffer-input min-h-9 w-full py-1.5 pl-8 pr-8 text-sm sm:min-h-0 sm:rounded-xl sm:py-1 sm:pl-7 sm:pr-7 sm:text-xs"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 flex min-w-10 items-center justify-center pr-1 text-gray-400 transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300 sm:min-w-0 sm:pr-3"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function FilterLabel({ icon: Icon, children, className = "" }) {
  return (
    <div className={`flex flex-shrink-0 items-center gap-1.5 px-1 text-[11px] font-bold tracking-tight text-gray-700 dark:text-gray-300 sm:px-1.5 sm:text-xs ${className}`}>
      {Icon && <Icon size={12} className="h-3 w-3 text-primary-500 dark:text-primary-400 sm:h-3.5 sm:w-3.5" />}
      <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">
        {children}
      </span>
    </div>
  );
}

function StatCard({ icon, label, shortLabel, count, color, compact = false }) {
  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-1 rounded border-none bg-transparent transition-opacity hover:opacity-80">
        <div className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded ring-1 ring-inset ring-white/10 ${color}`}>
          {icon ? createElement(icon, { size: 9 }) : null}
        </div>
        <div className="flex min-w-0 items-baseline gap-0.5">
          <span className="text-[11px] font-black tabular-nums leading-none text-gray-900 dark:text-white sm:text-[12px]">
            {count}
          </span>
          <span className="truncate text-[7px] font-bold uppercase tracking-tighter text-gray-500 dark:text-gray-400 sm:text-[8px]">
            <span className="sm:hidden">{shortLabel ?? label}</span>
            <span className="hidden sm:inline">{label}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1 rounded border-none bg-transparent transition-opacity hover:opacity-80 sm:gap-1.5">
      <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded ring-1 ring-inset ring-white/10 sm:h-4.5 sm:w-4.5 ${color}`}>
        {icon ? createElement(icon, { size: 11 }) : null}
      </div>
      <div className="flex min-w-0 items-baseline gap-0.5 sm:gap-1">
        <span className="text-[12px] font-black tabular-nums leading-none text-gray-900 dark:text-white sm:text-[15px]">
          {count}
        </span>
        <span className="truncate text-[8px] font-bold uppercase tracking-tighter text-gray-500 dark:text-gray-400 sm:text-[9px]">
          <span className="sm:hidden">{shortLabel ?? label}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
      </div>
    </div>
  );
}

function ChannelPlannerTabPanel({ tabId, activeTab, children }) {
  const isActive = activeTab === tabId;
  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      aria-hidden={!isActive}
      className={
        isActive
          ? "flex flex-col max-sm:h-auto max-sm:flex-none sm:min-h-0 sm:flex-1 sm:overflow-hidden"
          : "hidden"
      }
    >
      {children}
    </div>
  );
}

/* ─── Date helpers ─── */

function toTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateCategory(dateKey) {
  if (!dateKey) return "upcoming";
  const today = toTodayKey();
  if (dateKey < today) return "overdue";
  if (dateKey === today) return "today";
  return "upcoming";
}

function formatDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  const today = toTodayKey();
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwKey = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, "0")}-${String(tmrw.getDate()).padStart(2, "0")}`;
  const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
  if (dateKey === today) return `Today — ${label}`;
  if (dateKey === tmrwKey) return `Tomorrow — ${label}`;
  return label;
}

function formatLogDate(value) {
  if (!value) return "—";
  return formatDateLabel(dateToKey(new Date(value)));
}

function dateToKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function historyRangeForPage(page, daysPerPage = LOG_HISTORY_DAYS_PER_PAGE) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() - (page - 1) * daysPerPage);
  const start = new Date(end);
  start.setDate(start.getDate() - (daysPerPage - 1));
  return { from: dateToKey(start), to: dateToKey(end) };
}

function resolveReportRange(period, customFrom, customTo) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (period === "custom") {
    return { from: customFrom || "", to: customTo || "" };
  }

  if (period === "current-week") {
    const start = new Date(today);
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { from: dateToKey(start), to: dateToKey(end) };
  }

  if (period === "last-3-months") {
    const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    return { from: dateToKey(from), to: dateToKey(today) };
  }

  if (period === "current-month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: dateToKey(from), to: dateToKey(to) };
  }

  if (period === "last-12-months") {
    const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    return { from: dateToKey(from), to: dateToKey(today) };
  }

  return resolveReportRange("current-week", "", "");
}

/* ─── Plan row metrics ─── */

const COUNT_TONES = {
  idle: {
    dot: "bg-gray-300 dark:bg-gray-600",
    pill: "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400",
  },
  active: {
    dot: "bg-blue-500",
    pill: "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-400",
  },
  complete: {
    dot: "bg-emerald-500",
    pill: "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-400",
  },
};

function PlanIdPill({ planId }) {
  if (!planId) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-1.5 py-px text-[9px] font-bold tabular-nums text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300 ${ROW_PILL_SIZES.planId}`}
      title={`Plan ID ${planId}`}
    >
      #{planId}
    </span>
  );
}

function NotesPill({ notes, onOpen }) {
  if (!notes) return null;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.();
      }}
      className={NOTES_PILL}
      title="Notes — tap to read"
      aria-label="Open notes"
    >
      <FileText size={11} className="flex-shrink-0 opacity-90 sm:h-3.5 sm:w-3.5" aria-hidden />
      <span className="hidden sm:inline">Notes</span>
    </button>
  );
}

function CountPill({ label, planned, logged = 0 }) {
  const plannedN = Math.max(0, Number(planned) || 0);
  const loggedN = Math.max(0, Number(logged) || 0);
  const formatClass = label === "L" ? FORMAT_PILL.long : FORMAT_PILL.short;
  const tone =
    plannedN > 0 && loggedN >= plannedN
      ? COUNT_TONES.complete.pill
      : loggedN > 0
        ? `${formatClass} border-current`
        : plannedN > 0
          ? `${formatClass} border-current`
          : COUNT_TONES.idle.pill;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px] min-h-[22px] sm:min-h-[26px] ${ROW_PILL_SIZES.count} ${tone}`}
      title={`${label === "L" ? "Long" : "Short"}: ${loggedN} logged / ${plannedN} planned`}
    >
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">
        {loggedN}/{plannedN}
      </span>
    </span>
  );
}

function FirstCutBadge({ ready }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px] min-h-[22px] sm:min-h-[26px] ${ROW_PILL_SIZES.firstCut} ${
        ready ? COUNT_TONES.complete.pill : COUNT_TONES.idle.pill
      }`}
      title={ready ? "First cut (FC) is ready for review" : "First cut (FC) is still pending"}
    >
      {ready ? <CheckCircle2 size={11} className="flex-shrink-0" /> : <Circle size={11} className="flex-shrink-0" />}
      <span className="font-black uppercase tracking-wide opacity-80">FC</span>
      <span className="hidden sm:inline">{ready ? "Ready" : "Pending"}</span>
      <span className="sm:hidden">{ready ? "Rdy" : "Pnd"}</span>
    </span>
  );
}

function ChannelPlanRow({ plan, onEdit, onDelete, onToggleStatus, onThumbnail, onOpenNotes }) {
  const isCompleted = plan.status === "completed";
  const completionBlockers = isCompleted ? [] : planCompletionBlockers(plan);
  const canComplete = completionBlockers.length === 0;
  const notes = String(plan.notes || "").trim();
  const channelName = plan.channelId?.name || "Unknown";
  const assigneeName = plan.assignedTo?.name;
  const channelLabel = [channelName, assigneeName].filter(Boolean).join(" · ");
  const completeTitle = isCompleted
    ? "Reopen plan"
    : canComplete
      ? "Mark completed"
      : `Complete all planned videos first: ${completionBlockers.join(", ")}`;

  return (
    <div className="group flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-white px-2 py-2 transition-colors hover:border-primary-400/60 hover:bg-primary-50/70 hover:shadow-sm dark:border-gray-700/50 dark:bg-gray-800/80 dark:hover:border-primary-700/60 dark:hover:bg-primary-900/40 sm:flex-row sm:items-center sm:gap-2 sm:px-2.5 sm:py-1">
      <div className="flex min-w-0 items-center gap-1.5 sm:contents sm:gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus(plan)}
          disabled={!isCompleted && !canComplete}
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full touch-manipulation transition-colors sm:h-auto sm:w-auto ${
            isCompleted
              ? "text-emerald-500 hover:text-amber-500"
              : canComplete
                ? "text-gray-300 hover:text-emerald-500 dark:text-gray-600 dark:hover:text-emerald-400"
                : "cursor-not-allowed text-gray-200 dark:text-gray-700"
          }`}
          title={completeTitle}
        >
          {isCompleted ? <CheckCircle2 size={18} className="sm:h-[22px] sm:w-[22px]" /> : <Circle size={18} className="sm:h-[22px] sm:w-[22px]" />}
        </button>

        <div className="order-last ml-auto flex flex-shrink-0 items-center gap-0.5 sm:order-none sm:ml-0 sm:opacity-40 sm:transition-opacity sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 touch-manipulation transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/40 dark:hover:text-primary-400 sm:h-auto sm:w-auto sm:p-1"
            title="Edit plan"
          >
            <Pencil className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(plan)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 touch-manipulation transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:h-auto sm:w-auto sm:p-1"
            title="Delete plan"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
          </button>
        </div>

        <PlanIdPill planId={plan.planId} />

        <button
          type="button"
          disabled={!plan.thumbnail}
          onClick={() => plan.thumbnail && onThumbnail(plan.thumbnail)}
          className="flex h-7 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm disabled:cursor-default dark:border-gray-700 dark:bg-gray-700/50 sm:h-7 sm:w-12"
          title={plan.thumbnail ? "View thumbnail" : "No thumbnail"}
        >
          {plan.thumbnail ? (
            <img src={plan.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <Image size={14} className="text-gray-400" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[13px] font-semibold leading-tight sm:text-xs ${
              isCompleted ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-900 dark:text-white"
            }`}
            title={`${plan.title}${channelLabel ? ` · ${channelLabel}` : ""}`}
          >
            {plan.title}
            <span className="hidden font-normal text-gray-400 dark:text-gray-500 sm:inline"> · {channelLabel}</span>
          </p>
          <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400 sm:hidden" title={channelLabel}>
            {channelLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-1 pl-10 sm:contents sm:gap-1.5 sm:pl-0">
        <NotesPill notes={notes} onOpen={() => onOpenNotes(plan)} />
        <CountPill label="L" planned={plan.longPlanned} logged={plan.longCompleted} />
        <CountPill label="S" planned={plan.shortPlanned} logged={plan.shortCompleted} />
        <FirstCutBadge ready={Boolean(plan.firstCut)} />
      </div>
    </div>
  );
}

function DateGroup(props) {
  const { group, viewMode } = props;
  const [open, setOpen] = useState(false);
  const totals = group.totals;
  const rawCat = viewMode === "completed" ? "completed" : getDateCategory(group.date);
  const cat =
    viewMode === "schedule" && rawCat === "overdue" ? "upcoming" : rawCat;

  const borderColor =
    cat === "today"
      ? "border-l-blue-500"
      : cat === "completed"
        ? "border-l-emerald-500/50"
        : "border-l-gray-300 dark:border-l-gray-600";

  const headerBg =
    cat === "today"
      ? "bg-blue-50/40 dark:bg-blue-950/10"
      : cat === "completed"
        ? "bg-emerald-50/30 dark:bg-emerald-950/5"
        : "bg-gray-50/60 dark:bg-gray-800/30";

  const dateTextClass =
    cat === "today"
      ? "text-blue-600 dark:text-blue-400"
      : cat === "completed"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-gray-800 dark:text-gray-200";

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-gray-100 border-l-[4px] bg-white/40 shadow-md shadow-gray-200/20 backdrop-blur-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-900/40 dark:shadow-black/20 ${borderColor}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between gap-2 px-2.5 py-1 text-left backdrop-blur-md transition-colors hover:brightness-95 sm:gap-3 sm:px-3 sm:py-1.5 ${headerBg}`}
      >
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <ChevronRight
            size={13}
            className="flex-shrink-0 text-gray-500 transition-transform duration-300 dark:text-gray-400 sm:h-3.5 sm:w-3.5"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          />
          <span className={`truncate text-xs font-black sm:text-sm ${dateTextClass}`}>{formatDateLabel(group.date)}</span>
          <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-black tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:px-2 sm:text-[10px]">
            {group.tasks.length}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-2">
          <span className="inline-flex items-center gap-0.5 rounded-md border border-gray-200/50 bg-white/60 px-1 py-0.5 text-[8px] font-black uppercase tracking-wider text-gray-500 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:py-1 sm:text-[10px] dark:border-gray-700/50 dark:bg-gray-800/60 dark:text-gray-400">
            {totals.longPlanned > 0 && (
              <span className={`rounded-md px-1 py-0.5 font-bold tabular-nums sm:rounded-lg sm:px-1.5 ${FORMAT_PILL.long}`}>
                {totals.longCompleted || 0}/{totals.longPlanned}L
              </span>
            )}
            {totals.shortPlanned > 0 && (
              <span className={`rounded-md px-1 py-0.5 font-bold tabular-nums sm:rounded-lg sm:px-1.5 ${FORMAT_PILL.short}`}>
                {totals.shortCompleted || 0}/{totals.shortPlanned}S
              </span>
            )}
            <span className="text-[8px] font-bold text-emerald-600 sm:text-[10px] dark:text-emerald-400">
              {totals.firstCut || 0}<span className="hidden sm:inline"> ready</span><span className="sm:hidden"> FC</span>
            </span>
          </span>
        </div>
      </button>
      {open && (
        <div className="space-y-1.5 bg-gray-50/50 p-2 dark:bg-gray-800/20 sm:space-y-2 sm:p-3">
          {group.tasks.map((plan) => (
            <ChannelPlanRow key={plan._id} plan={plan} {...props} />
          ))}
        </div>
      )}
    </section>
  );
}

function pendingPlanCount(planned, completed) {
  return Math.max(0, (Number(planned) || 0) - (Number(completed) || 0));
}

function planCompletionBlockers(plan) {
  const blockers = [];
  const longRemaining = pendingPlanCount(plan.longPlanned, plan.longCompleted);
  const shortRemaining = pendingPlanCount(plan.shortPlanned, plan.shortCompleted);

  if (longRemaining > 0) {
    blockers.push(`${longRemaining} long${longRemaining === 1 ? "" : "s"} remaining`);
  }
  if (shortRemaining > 0) {
    blockers.push(`${shortRemaining} short${shortRemaining === 1 ? "" : "s"} remaining`);
  }
  return blockers;
}

function mapPlanToLogWorkOption(plan) {
  return {
    _id: plan._id,
    planId: plan.planId,
    title: plan.title,
    channelId: plan.channelId?._id || plan.channelId,
    channelName: plan.channelId?.name || "",
    scheduledDate: plan.scheduledDate,
    longPlanned: plan.longPlanned ?? 0,
    shortPlanned: plan.shortPlanned ?? 0,
    longCompleted: plan.longCompleted ?? 0,
    shortCompleted: plan.shortCompleted ?? 0,
    longPending: pendingPlanCount(plan.longPlanned, plan.longCompleted),
    shortPending: pendingPlanCount(plan.shortPlanned, plan.shortCompleted),
  };
}

function workLogDateKey(value) {
  if (!value) return "";
  return dateToKey(new Date(value));
}

function maxLogEntryCount(planned, completedTotal, currentEntryCount = 0) {
  return Math.max(
    0,
    (Number(planned) || 0) - (Number(completedTotal) || 0) + (Number(currentEntryCount) || 0),
  );
}

function buildLogCountLimits({ longPlanned, shortPlanned, longCompleted, shortCompleted, existingLong = 0, existingShort = 0 }) {
  return {
    maxLong: maxLogEntryCount(longPlanned, longCompleted, existingLong),
    maxShort: maxLogEntryCount(shortPlanned, shortCompleted, existingShort),
    longPlanned: longPlanned ?? 0,
    shortPlanned: shortPlanned ?? 0,
  };
}

function flattenPlanGroups(response) {
  return (response.data?.groups || []).flatMap((group) => group.tasks || []);
}

function formatPlanScheduleDate(scheduledDate) {
  if (!scheduledDate) return "—";
  const key = new Date(scheduledDate).toISOString().slice(0, 10);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${key}T00:00:00`));
}

const LOG_WORK_PLAN_MOBILE_MQ = "(max-width: 767px)";
const LOG_WORK_PLAN_TABLE_MQ = "(min-width: 1024px)";
const LOG_WORK_ROW_GRID =
  "w-full grid-cols-[2.75rem_minmax(0,1.4fr)_minmax(0,1fr)_5.5rem_3.25rem_3.25rem] items-center gap-x-2.5";
const LOG_WORK_DROPDOWN_PANEL =
  "fixed z-[200] overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900";

function parseLoggedCounts(longValue, shortValue, firstCutLogged = false, limits = null) {
  const longPendingLogged = longValue === "" ? 0 : Number(longValue);
  const shortPendingLogged = shortValue === "" ? 0 : Number(shortValue);
  if (
    !Number.isInteger(longPendingLogged) ||
    longPendingLogged < 0 ||
    !Number.isInteger(shortPendingLogged) ||
    shortPendingLogged < 0
  ) {
    return { error: "Counts must be non-negative whole numbers" };
  }
  if (limits) {
    if (longPendingLogged > limits.maxLong) {
      return {
        error: `Long logged cannot exceed ${limits.maxLong} (planned ${limits.longPlanned})`,
      };
    }
    if (shortPendingLogged > limits.maxShort) {
      return {
        error: `Short logged cannot exceed ${limits.maxShort} (planned ${limits.shortPlanned})`,
      };
    }
  }
  if (longPendingLogged === 0 && shortPendingLogged === 0 && !firstCutLogged) {
    return { error: "Enter at least one count or mark first cut ready" };
  }
  return { longPendingLogged, shortPendingLogged, firstCutLogged: Boolean(firstCutLogged) };
}

function LogWorkPlanMobileCard({ plan }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-start gap-2">
        {plan.planId ? (
          <span className="inline-flex flex-shrink-0 items-center rounded-full border border-blue-200/70 bg-blue-50 px-2 py-0.5 text-[11px] font-bold tabular-nums text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300">
            #{plan.planId}
          </span>
        ) : (
          <span className="flex-shrink-0 text-xs text-gray-400">—</span>
        )}
        <span
          className="min-w-0 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white"
          title={plan.title}
        >
          {plan.title}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-0 sm:pl-0">
        <span className="min-w-0 text-xs text-gray-500 dark:text-gray-400" title={plan.channelName}>
          {plan.channelName}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatPlanScheduleDate(plan.scheduledDate)}
        </span>
        <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${FORMAT_PILL.long}`}>
          {plan.longPending}/{plan.longPlanned} L
        </span>
        <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${FORMAT_PILL.short}`}>
          {plan.shortPending}/{plan.shortPlanned} S
        </span>
      </div>
    </div>
  );
}

function LogWorkPlanRowContent({ plan }) {
  const titleClass = "truncate text-sm font-semibold text-gray-900 dark:text-white";
  const metaClass = "truncate text-xs text-gray-500 dark:text-gray-400";

  return (
    <>
      <span className="inline-flex justify-center">
        {plan.planId ? (
          <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-2 py-0.5 text-[11px] font-bold tabular-nums text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300">
            #{plan.planId}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </span>
      <span className={titleClass} title={plan.title}>
        {plan.title}
      </span>
      <span className={metaClass} title={plan.channelName}>
        {plan.channelName}
      </span>
      <span className="flex justify-center">
        <span className={`${metaClass} text-center`}>
          {formatPlanScheduleDate(plan.scheduledDate)}
        </span>
      </span>
      <span
        className={`inline-flex justify-center rounded-md px-2 py-1 text-[11px] font-bold tabular-nums ${FORMAT_PILL.long}`}
      >
        {plan.longPending}/{plan.longPlanned}
      </span>
      <span
        className={`inline-flex justify-center rounded-md px-2 py-1 text-[11px] font-bold tabular-nums ${FORMAT_PILL.short}`}
      >
        {plan.shortPending}/{plan.shortPlanned}
      </span>
    </>
  );
}

function WorkLogEntryRow({ log, editable = false, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [longValue, setLongValue] = useState(String(log.longPendingLogged ?? 0));
  const [shortValue, setShortValue] = useState(String(log.shortPendingLogged ?? 0));
  const [firstCutValue, setFirstCutValue] = useState(Boolean(log.firstCutLogged));
  const [saving, setSaving] = useState(false);

  const planIdNumber = log.planIdNumber ?? log.planId?.planId;
  const title = log.title || log.planId?.title || "—";
  const channel = log.channelName || log.channelId?.name || "—";
  const shootDateLabel = formatPlanScheduleDate(log.planId?.scheduledDate);

  useEffect(() => {
    if (!editing) {
      setLongValue(String(log.longPendingLogged ?? 0));
      setShortValue(String(log.shortPendingLogged ?? 0));
      setFirstCutValue(Boolean(log.firstCutLogged));
    }
  }, [log.longPendingLogged, log.shortPendingLogged, log.firstCutLogged, editing]);

  const cancelEdit = () => {
    setLongValue(String(log.longPendingLogged ?? 0));
    setShortValue(String(log.shortPendingLogged ?? 0));
    setFirstCutValue(Boolean(log.firstCutLogged));
    setEditing(false);
  };

  const editLimits = useMemo(() => {
    const planMeta = log.planId;
    if (!planMeta || typeof planMeta !== "object") return null;
    return buildLogCountLimits({
      longPlanned: planMeta.longPlanned,
      shortPlanned: planMeta.shortPlanned,
      longCompleted: planMeta.longCompleted,
      shortCompleted: planMeta.shortCompleted,
      existingLong: log.longPendingLogged ?? 0,
      existingShort: log.shortPendingLogged ?? 0,
    });
  }, [log]);

  const handleSave = async () => {
    const parsed = parseLoggedCounts(longValue, shortValue, firstCutValue, editLimits);
    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }
    setSaving(true);
    try {
      await onUpdate?.(log._id, parsed);
      setEditing(false);
    } catch {
      // Parent shows toast
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-white px-1.5 py-1.5 text-center text-[11px] font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="group flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-white px-2 py-2 transition-colors hover:border-primary-400/60 hover:bg-primary-50/70 hover:shadow-sm dark:border-gray-700/50 dark:bg-gray-800/80 dark:hover:border-primary-700/60 dark:hover:bg-primary-900/40 sm:flex-row sm:items-center sm:gap-2 sm:px-2.5 sm:py-1">
      <div className="flex min-w-0 items-center gap-1.5 sm:contents sm:gap-2">
        {editable && (
          <div className="order-last ml-auto flex flex-shrink-0 items-center gap-0.5 sm:order-none sm:ml-0 sm:opacity-40 sm:transition-opacity sm:group-hover:opacity-100">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950/40 sm:h-auto sm:w-auto sm:p-1"
                  title="Save"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-800 sm:h-auto sm:w-auto sm:p-1"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/40 sm:h-auto sm:w-auto sm:p-1"
                  title="Edit log"
                >
                  <Pencil className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(log)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 sm:h-auto sm:w-auto sm:p-1"
                    title="Delete log"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
                  </button>
                ) : null}
              </>
            )}
          </div>
        )}

        <PlanIdPill planId={planIdNumber} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-tight text-gray-900 dark:text-white sm:text-xs" title={title}>
            {title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400 sm:hidden">
            <span title={channel}>{channel}</span>
            <span className="text-gray-400 dark:text-gray-500"> · </span>
            <span title="Shoot date">{shootDateLabel}</span>
          </p>
        </div>

        <span className="hidden min-w-0 truncate text-xs text-gray-500 dark:text-gray-400 sm:block" title={channel}>
          {channel}
        </span>

        <span
          className="hidden flex-shrink-0 text-[11px] tabular-nums text-gray-500 dark:text-gray-400 sm:block sm:max-w-[6.5rem] sm:truncate"
          title={`Shoot date — ${shootDateLabel}`}
        >
          {shootDateLabel}
        </span>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-1 pl-10 sm:contents sm:gap-1.5 sm:pl-0">
        {editing ? (
          <>
            <input
              type="number"
              min={0}
              max={editLimits?.maxLong ?? undefined}
              step={1}
              value={longValue}
              onChange={(event) => setLongValue(event.target.value)}
              disabled={saving}
              className={`${inputClass} w-[3rem] sm:w-[3.25rem]`}
              aria-label="Long logged"
            />
            <input
              type="number"
              min={0}
              max={editLimits?.maxShort ?? undefined}
              step={1}
              value={shortValue}
              onChange={(event) => setShortValue(event.target.value)}
              disabled={saving}
              className={`${inputClass} w-[3.25rem]`}
              aria-label="Short logged"
            />
            <label className="inline-flex min-h-[22px] cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-semibold dark:border-gray-600">
              <input
                type="checkbox"
                checked={firstCutValue}
                onChange={(event) => setFirstCutValue(event.target.checked)}
                disabled={saving}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500/40"
              />
              FC
            </label>
          </>
        ) : (
          <>
            {(log.longPendingLogged ?? 0) > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tabular-nums ${FORMAT_PILL.long} border-current ${ROW_PILL_SIZES.count}`}
              >
                L {log.longPendingLogged}
              </span>
            )}
            {(log.shortPendingLogged ?? 0) > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tabular-nums ${FORMAT_PILL.short} border-current ${ROW_PILL_SIZES.count}`}
              >
                S {log.shortPendingLogged}
              </span>
            )}
            {log.firstCutLogged ? <FirstCutBadge ready /> : null}
          </>
        )}
      </div>
    </div>
  );
}

function WorkLogDateGroup({ dateKey, logs, editable, onUpdateLog, onDeleteLog }) {
  const [open, setOpen] = useState(false);
  const totals = useMemo(
    () => ({
      long: logs.reduce((sum, log) => sum + (log.longPendingLogged || 0), 0),
      short: logs.reduce((sum, log) => sum + (log.shortPendingLogged || 0), 0),
      firstCut: logs.filter((log) => log.firstCutLogged).length,
    }),
    [logs],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 border-l-[4px] border-l-primary-500 bg-white/40 shadow-md shadow-gray-200/20 backdrop-blur-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-900/40 dark:shadow-black/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 bg-primary-50/40 px-2.5 py-1 text-left backdrop-blur-md transition-colors hover:brightness-95 dark:bg-primary-950/10 sm:gap-3 sm:px-3 sm:py-1.5"
      >
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <ChevronRight
            size={13}
            className="flex-shrink-0 text-gray-500 transition-transform duration-300 dark:text-gray-400 sm:h-3.5 sm:w-3.5"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          />
          <span className="truncate text-xs font-black text-primary-600 dark:text-primary-400 sm:text-sm">
            {formatDateLabel(dateKey)}
          </span>
          <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-black tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:px-2 sm:text-[10px]">
            {logs.length}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-2">
          <span className="inline-flex items-center gap-0.5 rounded-md border border-gray-200/50 bg-white/60 px-1 py-0.5 text-[8px] font-black uppercase tracking-wider text-gray-500 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:py-1 sm:text-[10px] dark:border-gray-700/50 dark:bg-gray-800/60 dark:text-gray-400">
            {totals.long > 0 && (
              <span className={`rounded-md px-1 py-0.5 font-bold tabular-nums sm:rounded-lg sm:px-1.5 ${FORMAT_PILL.long}`}>
                {totals.long}L
              </span>
            )}
            {totals.short > 0 && (
              <span className={`rounded-md px-1 py-0.5 font-bold tabular-nums sm:rounded-lg sm:px-1.5 ${FORMAT_PILL.short}`}>
                {totals.short}S
              </span>
            )}
            {totals.firstCut > 0 && (
              <span className="text-[9px] font-bold text-emerald-600 sm:text-[10px] dark:text-emerald-400">
                {totals.firstCut} FC
              </span>
            )}
          </span>
        </div>
      </button>
      {open && (
        <div className="space-y-1.5 bg-gray-50/50 p-2 dark:bg-gray-800/20 sm:space-y-2 sm:p-3">
          {logs.map((log) => (
            <WorkLogEntryRow
              key={log._id}
              log={log}
              editable={editable}
              onUpdate={onUpdateLog}
              onDelete={onDeleteLog}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function WorkLogEntriesList({ logs, loading, emptyMessage, editable = false, onUpdateLog, onDeleteLog }) {
  const groupedByDate = useMemo(() => {
    const map = new Map();
    logs.forEach((log) => {
      const key = dateToKey(new Date(log.logDate));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(log);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  if (loading) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
        <Loader2 size={20} className="animate-spin text-primary-500" />
        <span className="text-xs">Loading logged work…</span>
      </div>
    );
  }

  if (groupedByDate.length === 0) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No logs in this range</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-2 sm:space-y-2 sm:p-3">
      {groupedByDate.map(([dateKey, dayLogs]) => (
        <WorkLogDateGroup
          key={dateKey}
          dateKey={dateKey}
          logs={dayLogs}
          editable={editable}
          onUpdateLog={onUpdateLog}
          onDeleteLog={onDeleteLog}
        />
      ))}
    </div>
  );
}

function LogWorkPlanPicker({ plans, value, onChange, loading, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [panelStyle, setPanelStyle] = useState(null);
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia(LOG_WORK_PLAN_MOBILE_MQ).matches,
  );
  const [isTableLayout, setIsTableLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia(LOG_WORK_PLAN_TABLE_MQ).matches,
  );
  const containerRef = useRef(null);

  const selected = useMemo(
    () => plans.find((plan) => String(plan._id) === value),
    [plans, value],
  );

  const filteredPlans = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return plans;
    return plans.filter((plan) => {
      const haystack = [
        plan.title,
        plan.channelName,
        plan.planId != null ? String(plan.planId) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [plans, query]);

  useEffect(() => {
    const mobileMedia = window.matchMedia(LOG_WORK_PLAN_MOBILE_MQ);
    const tableMedia = window.matchMedia(LOG_WORK_PLAN_TABLE_MQ);
    const update = () => {
      setIsMobileLayout(mobileMedia.matches);
      setIsTableLayout(tableMedia.matches);
    };
    update();
    mobileMedia.addEventListener("change", update);
    tableMedia.addEventListener("change", update);
    return () => {
      mobileMedia.removeEventListener("change", update);
      tableMedia.removeEventListener("change", update);
    };
  }, []);

  const closePicker = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const updatePanelStyle = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const horizontalInset = window.innerWidth >= 640 ? 16 : 12;
    setPanelStyle({
      top: rect.bottom + 6,
      left: horizontalInset,
      width: window.innerWidth - horizontalInset * 2,
      maxWidth: "none",
    });
  }, []);

  useEffect(() => {
    if (!open || isMobileLayout) {
      setPanelStyle(null);
      return undefined;
    }
    updatePanelStyle();
    window.addEventListener("resize", updatePanelStyle);
    window.addEventListener("scroll", updatePanelStyle, true);
    return () => {
      window.removeEventListener("resize", updatePanelStyle);
      window.removeEventListener("scroll", updatePanelStyle, true);
    };
  }, [open, isMobileLayout, updatePanelStyle]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (isMobileLayout) return;
      const panel = document.getElementById("log-work-plan-picker-panel");
      if (
        !containerRef.current?.contains(event.target) &&
        !panel?.contains(event.target)
      ) {
        closePicker();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, isMobileLayout, closePicker]);

  useEffect(() => {
    if (!open || !isMobileLayout) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isMobileLayout]);

  const emptyMessage =
    plans.length === 0
      ? "No open plans available. Completed plans are hidden — add or reopen a plan on the Plans tab."
      : "No plans match your search.";

  const renderSearchField = () => (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by title, channel, or plan ID…"
        className="buffer-input py-2.5 pl-9 pr-3 text-sm"
        autoFocus
      />
    </div>
  );

  const planButtons = (useCardLayout) =>
    filteredPlans.length === 0 ? (
      <li className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</li>
    ) : (
      filteredPlans.map((plan) => {
        const isSelected = String(plan._id) === value;
        return (
          <li key={plan._id}>
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                onChange(String(plan._id));
                closePicker();
              }}
              className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors sm:px-3 sm:py-2.5 ${
                useCardLayout ? "" : `grid ${LOG_WORK_ROW_GRID}`
              } ${
                isSelected
                  ? "bg-primary-50 ring-1 ring-primary-200/80 dark:bg-primary-900/30 dark:ring-primary-800/60"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/70"
              }`}
            >
              {useCardLayout ? <LogWorkPlanMobileCard plan={plan} /> : <LogWorkPlanRowContent plan={plan} />}
            </button>
          </li>
        );
      })
    );

  return (
    <div ref={containerRef} className="relative min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Plan</span>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (open) closePicker();
          else setOpen(true);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex min-h-12 w-full items-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? "border-primary-400/60 bg-white shadow-md ring-2 ring-primary-500/20 dark:border-primary-500/50 dark:bg-gray-800"
            : "border-gray-200/80 bg-white/90 hover:border-primary-300/60 hover:bg-white dark:border-gray-700 dark:bg-gray-800/90 dark:hover:border-primary-500/40"
        }`}
      >
        <div className="min-w-0 flex-1">
          {loading ? (
            <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 size={16} className="animate-spin text-primary-500" />
              Loading plans…
            </span>
          ) : selected ? (
            <>
              <div className={isTableLayout ? "hidden" : ""}>
                <LogWorkPlanMobileCard plan={selected} />
              </div>
              <div className={`${isTableLayout ? "grid" : "hidden"} pr-1 ${LOG_WORK_ROW_GRID}`}>
                <LogWorkPlanRowContent plan={selected} />
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">Select an open plan</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        !loading &&
        isMobileLayout &&
        createPortal(
          <div>
            <button
              type="button"
              className="fixed inset-0 z-[200] bg-black/40"
              aria-label="Close plan picker"
              onClick={closePicker}
            />
            <div className="fixed inset-x-0 bottom-0 z-[201] flex max-h-[80vh] flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div className="mx-auto mt-2 h-1 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Select a plan</p>
                <button
                  type="button"
                  onClick={closePicker}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="border-b border-gray-100 px-3 pb-2.5 dark:border-gray-800">{renderSearchField()}</div>
              <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1 custom-scrollbar">
                {planButtons(true)}
              </ul>
            </div>
          </div>,
          document.body,
        )}

      {open &&
        !loading &&
        !isMobileLayout &&
        panelStyle &&
        createPortal(
          <div id="log-work-plan-picker-panel" className={LOG_WORK_DROPDOWN_PANEL} style={panelStyle}>
            <div className="border-b border-gray-100 p-2 dark:border-gray-800 sm:p-2.5">{renderSearchField()}</div>
            {isTableLayout ? (
              <div
                className={`grid ${LOG_WORK_ROW_GRID} border-b border-gray-100 bg-gray-50/90 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400`}
              >
                <span className="text-center">ID</span>
                <span>Title</span>
                <span>Channel</span>
                <span className="text-center">Shoot date</span>
                <span className="text-center">Long</span>
                <span className="text-center">Short</span>
              </div>
            ) : null}
            <ul role="listbox" className="max-h-80 overflow-y-auto p-1 custom-scrollbar">
              {planButtons(!isTableLayout)}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

function LogWorkPanel({ onLogged, isActive, refreshKey }) {
  const [planOptions, setPlanOptions] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [logDate, setLogDate] = useState(() => toTodayKey());
  const [longPending, setLongPending] = useState("");
  const [shortPending, setShortPending] = useState("");
  const [firstCutLogged, setFirstCutLogged] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasOlder, setHistoryHasOlder] = useState(false);
  const [deleteLog, setDeleteLog] = useState(null);
  const [deletingLog, setDeletingLog] = useState(false);

  const selectedPlan = useMemo(
    () => planOptions.find((plan) => String(plan._id) === selectedPlanId),
    [planOptions, selectedPlanId],
  );

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setLoadError(null);
    try {
      clearCacheByPrefix("/channel-plans");
      clearCacheByPrefix("/channel-plan-work-logs");
      const scheduleRes = await httpClient.get("/channel-plans?bucket=schedule&limit=50&page=1");
      const uniquePlans = flattenPlanGroups(scheduleRes).filter((plan) => plan.status !== "completed");
      uniquePlans.sort((a, b) => {
        const channelCompare = (a.channelId?.name || "").localeCompare(b.channelId?.name || "");
        if (channelCompare !== 0) return channelCompare;
        const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
        const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
        if (dateA && dateB) return dateB - dateA;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      });
      setPlanOptions(uniquePlans.map(mapPlanToLogWorkOption));
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load plans";
      setLoadError(message);
      setPlanOptions([]);
      toast.error(message);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const loadHistory = useCallback(async (page) => {
    const range = historyRangeForPage(page);
    setHistoryLoading(true);
    try {
      clearCacheByPrefix("/channel-plan-work-logs");
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const [currentRes, olderRes] = await Promise.all([
        httpClient.get(`/channel-plan-work-logs?${params.toString()}`),
        httpClient.get(
          `/channel-plan-work-logs?${new URLSearchParams({
            from: historyRangeForPage(page + 1).from,
            to: historyRangeForPage(page + 1).to,
          }).toString()}`,
        ),
      ]);
      setHistoryLogs(currentRes.data.logs || []);
      setHistoryHasOlder((olderRes.data.logs || []).length > 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load logged work");
      setHistoryLogs([]);
      setHistoryHasOlder(false);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = window.setTimeout(() => void loadOptions(), 100);
    return () => window.clearTimeout(timer);
  }, [isActive, loadOptions]);

  useEffect(() => {
    if (!isActive) return undefined;
    void loadHistory(historyPage);
  }, [isActive, historyPage, refreshKey, loadHistory]);

  useEffect(() => {
    setLongPending("0");
    setShortPending("0");
    setFirstCutLogged(false);
  }, [selectedPlanId]);

  const submitLimits = useMemo(() => {
    if (!selectedPlan) return null;
    const existingLog = historyLogs.find(
      (entry) =>
        String(entry.planId?._id || entry.planId) === selectedPlanId &&
        workLogDateKey(entry.logDate) === logDate,
    );
    return buildLogCountLimits({
      longPlanned: selectedPlan.longPlanned,
      shortPlanned: selectedPlan.shortPlanned,
      longCompleted: selectedPlan.longCompleted,
      shortCompleted: selectedPlan.shortCompleted,
      existingLong: existingLog?.longPendingLogged ?? 0,
      existingShort: existingLog?.shortPendingLogged ?? 0,
    });
  }, [selectedPlan, selectedPlanId, logDate, historyLogs]);

  const handleUpdateLog = async (logId, parsed) => {
    try {
      clearCacheByPrefix("/channel-plan-work-logs");
      clearCacheByPrefix("/channel-plans");
      await httpClient.patch(`/channel-plan-work-logs/${logId}`, parsed);
      toast.success("Log updated");
      await Promise.all([loadHistory(historyPage), loadOptions(), onLogged?.()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update log");
      throw error;
    }
  };

  const handleDeleteLog = async () => {
    if (!deleteLog) return;
    setDeletingLog(true);
    try {
      clearCacheByPrefix("/channel-plan-work-logs");
      clearCacheByPrefix("/channel-plans");
      await api.delete(`/channel-plan-work-logs/${deleteLog._id}`);
      toast.success("Log deleted");
      setDeleteLog(null);
      await Promise.all([loadHistory(historyPage), loadOptions(), onLogged?.()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete log");
    } finally {
      setDeletingLog(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPlanId) {
      toast.error("Select a plan first");
      return;
    }
    if (!logDate) {
      toast.error("Select a log date");
      return;
    }

    const parsed = parseLoggedCounts(longPending, shortPending, firstCutLogged, submitLimits);
    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }

    setSubmitting(true);
    try {
      clearCacheByPrefix("/channel-plans");
      await api.post("/channel-plan-work-logs", {
        planId: selectedPlanId,
        logDate,
        longPendingLogged: parsed.longPendingLogged,
        shortPendingLogged: parsed.shortPendingLogged,
        firstCutLogged: parsed.firstCutLogged,
      });
      toast.success(logDate === toTodayKey() ? "Work logged for today" : "Work logged");
      setLongPending("0");
      setShortPending("0");
      setFirstCutLogged(false);
      setHistoryPage(1);
      await Promise.all([loadOptions(), loadHistory(1)]);
      await onLogged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log work");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 max-sm:flex-none sm:min-h-0 sm:flex-1 sm:gap-3 sm:overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="relative z-20 flex-shrink-0 overflow-visible rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900/40 sm:rounded-2xl sm:p-4"
      >
        <div className="mb-2 flex items-center gap-2 sm:mb-3">
          <ClipboardList size={15} className="text-primary-500 sm:h-4 sm:w-4" />
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">Log shoot output</h2>
        </div>
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end sm:gap-3">
          <div className="flex min-w-0 w-full flex-col gap-2 md:flex-row md:items-end md:gap-3 xl:w-1/2 xl:max-w-[50%] sm:gap-3">
            <div className="min-w-0 flex-1">
              <LogWorkPlanPicker
                plans={planOptions}
                value={selectedPlanId}
                onChange={setSelectedPlanId}
                loading={loadingOptions}
                disabled={loadingOptions}
              />
            </div>
            <label className="block w-full shrink-0 md:w-[8.25rem]">
              <span className="mb-1 block text-[11px] font-semibold text-gray-600 dark:text-gray-400 sm:mb-1.5 sm:text-xs">Log date</span>
              <input
                type="date"
                value={logDate}
                max={toTodayKey()}
                onChange={(event) => setLogDate(event.target.value)}
                className="buffer-input min-h-10 w-full py-2 text-sm sm:min-h-12 sm:py-2.5"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:items-end sm:gap-3">
            <label className="block min-w-0 sm:w-[5.5rem]">
              <span className="mb-1 block text-[11px] font-semibold text-gray-600 dark:text-gray-400 sm:mb-1.5 sm:text-xs">Long logged</span>
              <input
                type="number"
                min={0}
                max={submitLimits?.maxLong ?? undefined}
                step={1}
                inputMode="numeric"
                value={longPending}
                onChange={(event) => setLongPending(event.target.value)}
                disabled={!selectedPlanId}
                className="buffer-input min-h-10 text-sm font-semibold tabular-nums sm:min-h-11"
                placeholder="0"
              />
            </label>
            <label className="block min-w-0 sm:w-[5.5rem]">
              <span className="mb-1 block text-[11px] font-semibold text-gray-600 dark:text-gray-400 sm:mb-1.5 sm:text-xs">Short logged</span>
              <input
                type="number"
                min={0}
                max={submitLimits?.maxShort ?? undefined}
                step={1}
                inputMode="numeric"
                value={shortPending}
                onChange={(event) => setShortPending(event.target.value)}
                disabled={!selectedPlanId}
                className="buffer-input min-h-10 text-sm font-semibold tabular-nums sm:min-h-11"
                placeholder="0"
              />
            </label>
            <label className="col-span-2 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200 sm:col-span-1 sm:min-h-11 sm:w-auto sm:px-3 sm:py-2 sm:text-xs">
              <input
                type="checkbox"
                checked={firstCutLogged}
                onChange={(event) => setFirstCutLogged(event.target.checked)}
                disabled={!selectedPlanId}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500/40"
              />
              <span className="sm:hidden">FC ready</span>
              <span className="hidden sm:inline">First cut ready</span>
            </label>
            <button
              type="submit"
              disabled={submitting || !selectedPlanId}
              className="buffer-button-primary col-span-2 inline-flex min-h-10 items-center justify-center gap-1.5 disabled:opacity-50 sm:col-span-1 sm:h-[42px] sm:min-h-0 sm:px-5"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Submit
            </button>
          </div>
        </div>
        {loadError && (
          <p className="mt-2 text-[11px] font-medium text-red-600 dark:text-red-400">{loadError}</p>
        )}
        {!loadingOptions && !loadError && planOptions.length === 0 && (
          <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
            No open plans found. Add a plan on the Plans tab or reopen a completed one.
          </p>
        )}
        {selectedPlan && submitLimits && (
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 sm:mt-2.5 sm:text-xs">
            L {selectedPlan.longPending}/{selectedPlan.longPlanned} pending (max {submitLimits.maxLong} this entry) · S {selectedPlan.shortPending}/{selectedPlan.shortPlanned} pending (max {submitLimits.maxShort} this entry)
          </p>
        )}
      </form>

      <section className="flex flex-col overflow-visible rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/40 sm:min-h-0 sm:flex-1 sm:overflow-hidden sm:rounded-2xl">
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800 sm:px-4 sm:py-3">
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">Recent logged work</h3>
            <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
              <span className="sm:hidden">{LOG_HISTORY_DAYS_PER_PAGE}d/page · newest first</span>
              <span className="hidden sm:inline">Last {LOG_HISTORY_DAYS_PER_PAGE} days per page · newest first</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={historyLoading || historyPage <= 1}
              onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-primary-300 hover:text-primary-600 disabled:opacity-30 dark:border-gray-600"
              title="Newer dates"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[4.5rem] text-center text-xs font-semibold tabular-nums text-gray-600 dark:text-gray-300">
              Page {historyPage}
            </span>
            <button
              type="button"
              disabled={historyLoading || !historyHasOlder}
              onClick={() => setHistoryPage((page) => page + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-primary-300 hover:text-primary-600 disabled:opacity-30 dark:border-gray-600"
              title="Older dates"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => void loadHistory(historyPage)}
              disabled={historyLoading}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/60 bg-white/80 text-gray-500 shadow-sm transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700/60 dark:bg-gray-800/80"
              title="Refresh history"
            >
              <RefreshCw size={14} className={historyLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="overflow-visible sm:min-h-0 sm:flex-1 sm:overflow-y-auto custom-scrollbar">
          <WorkLogEntriesList
            logs={historyLogs}
            loading={historyLoading}
            emptyMessage="Submit a log above to see it here."
            editable
            onUpdateLog={handleUpdateLog}
            onDeleteLog={setDeleteLog}
          />
        </div>
      </section>

      <ConfirmModal
        isOpen={Boolean(deleteLog)}
        title="Delete work log?"
        message={
          deleteLog ? (
            <>
              This removes the log for <strong>{deleteLog.title || deleteLog.planId?.title || "this plan"}</strong> on{" "}
              <strong>{formatLogDate(dateToKey(new Date(deleteLog.logDate)))}</strong>. Plan completed counts will be
              recalculated.
            </>
          ) : null
        }
        confirmText="Delete"
        danger
        loading={deletingLog}
        onConfirm={() => void handleDeleteLog()}
        onCancel={() => {
          if (!deletingLog) setDeleteLog(null);
        }}
      />
    </div>
  );
}

/* ─── Report helpers ─── */

function reportProgressPercent(planned, logged) {
  const p = Number(planned) || 0;
  const l = Number(logged) || 0;
  if (p <= 0) return null;
  return Math.min(100, Math.round((l / p) * 100));
}

function reportFormatIsBehind(pending, logged) {
  return (Number(pending) || 0) > 0 && (Number(logged) || 0) < (Number(pending) || 0);
}

function reportChannelOutputStatus(row) {
  const longBehind = reportFormatIsBehind(row.actual?.long, row.logged?.long);
  const shortBehind = reportFormatIsBehind(row.actual?.short, row.logged?.short);
  if (longBehind || shortBehind) return "behind";
  return "on_track";
}

function reportChannelNeedsAttention(row) {
  return reportChannelOutputStatus(row) === "behind";
}

function sortReportChannels(rows) {
  return [...rows].sort((a, b) => {
    const aBehind = reportChannelNeedsAttention(a);
    const bBehind = reportChannelNeedsAttention(b);
    if (aBehind !== bBehind) return aBehind ? -1 : 1;
    return a.channelName.localeCompare(b.channelName);
  });
}

function resolveReportRows(summary, activeChannelTab, attentionFilter) {
  if (!summary) return { rows: [], totals: null };
  let rows =
    activeChannelTab === "all"
      ? summary.channels
      : summary.channels.filter((row) => String(row.channelId) === activeChannelTab);
  const totals = activeChannelTab === "all" ? summary.totals : rows[0] ?? null;
  if (attentionFilter === "attention") {
    rows = rows.filter((row) => reportChannelNeedsAttention(row));
  }
  rows = sortReportChannels(rows);
  return { rows, totals };
}

function ReportLoadingPanel({ label = "Loading summary…" }) {
  return (
    <div className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white/40 px-3 py-2 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
      <Loader2 size={13} className="animate-spin text-primary-500" />
      {label}
    </div>
  );
}

function ReportEmptyPanel({ message }) {
  return (
    <div className="flex min-h-[56px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white/30 px-3 py-2 text-center text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
      {message}
    </div>
  );
}

function ReportStatusBadge({ status }) {
  if (status === "behind") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
        Behind
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400">
      On track
    </span>
  );
}

function FormatProgressBar({ label, planned, pending, logged, barClass = "bg-primary-500" }) {
  const pct = reportProgressPercent(planned, logged);
  const hasData = (planned ?? 0) > 0 || (pending ?? 0) > 0 || (logged ?? 0) > 0;
  if (!hasData) {
    return (
      <div className="text-[10px] text-gray-400 dark:text-gray-500">—</div>
    );
  }
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
        {pct !== null && (
          <span className="text-[10px] font-semibold tabular-nums text-gray-600 dark:text-gray-300">{pct}%</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-gray-500 dark:text-gray-400">
        <span>
          Pending <span className="font-bold tabular-nums text-gray-700 dark:text-gray-200">{pending ?? 0}</span>
        </span>
        <span>
          Logged <span className="font-bold tabular-nums text-gray-700 dark:text-gray-200">{logged ?? 0}</span>
        </span>
        {(planned ?? 0) > 0 && (
          <span className="tabular-nums">
            {logged ?? 0}/{planned} logged
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryFirstCutCell({ pending, complete }) {
  return (
    <div
      className="inline-flex items-center justify-center gap-1.5 tabular-nums"
      title={`Pending ${pending}, Complete ${complete}`}
    >
      <span
        className={`inline-flex min-w-[1.75rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums ${COUNT_TONES.idle.pill}`}
      >
        {pending}
      </span>
      <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600" aria-hidden>
        /
      </span>
      <span
        className={`inline-flex min-w-[1.75rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums ${COUNT_TONES.complete.pill}`}
      >
        {complete}
      </span>
    </div>
  );
}

function ReportOverviewSection({ totals, attentionCount, loading }) {
  if (loading) return <ReportLoadingPanel label="Loading overview…" />;
  if (!totals) return null;

  const loggedTotal = (totals.logged?.long ?? 0) + (totals.logged?.short ?? 0);

  return (
    <section className="buffer-card flex-shrink-0 p-1.5 sm:p-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <h3 className="shrink-0 text-[10px] font-semibold text-gray-900 dark:text-white sm:text-[11px]">Overview</h3>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-5 sm:gap-x-2 sm:gap-y-0 lg:gap-x-3">
          <StatCard compact icon={CalendarDays} label="Plans in period" shortLabel="Plans" count={totals.planCount ?? 0} color="bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400" />
          <StatCard compact icon={Layers3} label="Long pending" shortLabel="L pend" count={totals.actual?.long ?? 0} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" />
          <StatCard compact icon={Circle} label="Short pending" shortLabel="S pend" count={totals.actual?.short ?? 0} color="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" />
          <StatCard compact icon={ClipboardList} label="Logged output" shortLabel="Logged" count={loggedTotal} color="bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400" />
          <StatCard compact icon={Circle} label="Needs attention" shortLabel="Alert" count={attentionCount} color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" />
        </div>
      </div>
    </section>
  );
}

function ReportOutputProgressSection({ rows, loading, attentionFilter }) {
  if (loading) return <ReportLoadingPanel label="Loading progress…" />;
  if (!rows.length) {
    return (
      <ReportEmptyPanel
        message={
          attentionFilter === "attention"
            ? "No channels need attention in this period."
            : "No open plans or work logs in this period."
        }
      />
    );
  }

  return (
    <section className="buffer-card flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-gray-100 px-2 py-1.5 dark:border-gray-800 sm:px-2.5 sm:py-2">
        <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white sm:text-xs">Long &amp; short progress</h3>
        <p className="mt-0.5 hidden text-[10px] leading-snug text-gray-500 dark:text-gray-400 sm:block">
          Progress % is logged output vs planned for the period. Pending vs logged shows the logging gap.
        </p>
      </div>
      <div className="space-y-1.5 p-1.5 sm:hidden">
        {rows.map((row) => (
          <div
            key={row.channelId}
            className={`rounded-lg border p-2 ${
              reportChannelNeedsAttention(row)
                ? "border-amber-200/80 bg-amber-50/30 dark:border-amber-800/40 dark:bg-amber-950/10"
                : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/40"
            }`}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-semibold text-gray-900 dark:text-white" title={row.channelName}>
                {row.channelName}
              </p>
              <ReportStatusBadge status={reportChannelOutputStatus(row)} />
            </div>
            <div className="space-y-1.5">
              <FormatProgressBar
                label="Long"
                planned={row.planned?.long ?? 0}
                pending={row.actual?.long ?? 0}
                logged={row.logged?.long ?? 0}
                barClass="bg-indigo-500"
              />
              <FormatProgressBar
                label="Short"
                planned={row.planned?.short ?? 0}
                pending={row.actual?.short ?? 0}
                logged={row.logged?.short ?? 0}
                barClass="bg-orange-500"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden min-h-0 overflow-auto custom-scrollbar sm:block">
        <table className="w-full min-w-0 text-[10px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80 text-[9px] font-black uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
              <th className="px-2.5 py-1.5 text-left sm:px-3">Channel</th>
              <th className="border-l border-gray-100 px-2.5 py-1.5 text-left dark:border-gray-800 sm:px-3">Long</th>
              <th className="border-l border-gray-100 px-2.5 py-1.5 text-left dark:border-gray-800 sm:px-3">Short</th>
              <th className="border-l border-gray-100 px-2.5 py-1.5 text-center dark:border-gray-800 sm:px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {rows.map((row) => (
              <tr
                key={row.channelId}
                className={
                  reportChannelNeedsAttention(row)
                    ? "bg-amber-50/40 dark:bg-amber-950/10"
                    : "hover:bg-gray-50/80 dark:hover:bg-gray-800/30"
                }
              >
                <td className="max-w-[9rem] truncate px-2.5 py-1.5 font-semibold text-gray-900 dark:text-white sm:px-3" title={row.channelName}>
                  {row.channelName}
                </td>
                <td className="border-l border-gray-50 px-2.5 py-1.5 dark:border-gray-800/60 sm:px-3">
                  <FormatProgressBar
                    label="Long"
                    planned={row.planned?.long ?? 0}
                    pending={row.actual?.long ?? 0}
                    logged={row.logged?.long ?? 0}
                    barClass="bg-indigo-500"
                  />
                </td>
                <td className="border-l border-gray-50 px-2.5 py-1.5 dark:border-gray-800/60 sm:px-3">
                  <FormatProgressBar
                    label="Short"
                    planned={row.planned?.short ?? 0}
                    pending={row.actual?.short ?? 0}
                    logged={row.logged?.short ?? 0}
                    barClass="bg-orange-500"
                  />
                </td>
                <td className="border-l border-gray-50 px-2.5 py-1.5 text-center dark:border-gray-800/60 sm:px-3">
                  <ReportStatusBadge status={reportChannelOutputStatus(row)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportFirstCutSection({ rows, loading }) {
  const visibleRows = rows.filter(
    (row) => (row.firstCut?.pending ?? 0) > 0 || (row.firstCut?.complete ?? 0) > 0,
  );
  if (loading) return null;
  if (!visibleRows.length) return null;

  return (
    <section className="buffer-card flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-gray-100 px-2 py-1.5 dark:border-gray-800 sm:px-2.5 sm:py-2">
        <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white sm:text-xs">First cut readiness</h3>
        <p className="mt-0.5 hidden text-[10px] leading-snug text-gray-500 dark:text-gray-400 sm:block">
          Open plans — not limited to report period.
        </p>
      </div>
      <div className="space-y-1 p-1.5 sm:hidden">
        {visibleRows.map((row) => (
          <div key={row.channelId} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900/40">
            <p className="min-w-0 truncate text-xs font-semibold text-gray-900 dark:text-white" title={row.channelName}>
              {row.channelName}
            </p>
            <SummaryFirstCutCell pending={row.firstCut?.pending ?? 0} complete={row.firstCut?.complete ?? 0} />
          </div>
        ))}
      </div>
      <div className="hidden overflow-auto custom-scrollbar sm:block">
        <table className="w-full min-w-0 text-[10px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80 text-[9px] font-black uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
              <th className="px-2.5 py-1.5 text-left sm:px-3">Channel</th>
              <th className="border-l border-gray-100 px-2.5 py-1.5 text-center dark:border-gray-800 sm:px-3">
                <span className={`inline-block rounded-md px-2 py-0.5 ${FORMAT_PILL.firstCut}`}>Pending / Complete</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {visibleRows.map((row) => (
              <tr key={row.channelId} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30">
                <td className="max-w-[12rem] truncate px-2.5 py-1.5 font-semibold text-gray-900 dark:text-white sm:px-3" title={row.channelName}>
                  {row.channelName}
                </td>
                <td className="border-l border-gray-50 px-2.5 py-1.5 text-center dark:border-gray-800/60 sm:px-3">
                  <SummaryFirstCutCell pending={row.firstCut?.pending ?? 0} complete={row.firstCut?.complete ?? 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WorkLogReportPanel({ activeChannelTab, onChannelTabChange, refreshKey, isActive }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("last-3-months");
  const [attentionFilter, setAttentionFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(
    () => resolveReportRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const periodLabel = REPORT_PERIODS.find((option) => option.value === period)?.label || "Report";

  const loadReport = useCallback(async () => {
    if (!range.from || !range.to) return;
    if (range.from > range.to) {
      toast.error("Start date must be on or before end date");
      return;
    }
    setLoading(true);
    try {
      clearCacheByPrefix("/channel-plan-work-logs");
      clearCacheByPrefix("/channel-plans");
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const summaryResponse = await httpClient.get(`/channel-plan-work-logs/summary?${params.toString()}`);
      setSummary(summaryResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    if (period === "custom" && !customFrom && !customTo) {
      const defaults = resolveReportRange("current-week", "", "");
      setCustomFrom(defaults.from);
      setCustomTo(defaults.to);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    if (!isActive && refreshKey === 0) return;
    void loadReport();
  }, [loadReport, refreshKey, isActive]);

  const reportChannels = useMemo(() => {
    if (!summary?.channels?.length) return [];
    return summary.channels
      .map((row) => ({
        _id: row.channelId,
        name: row.channelName,
        count: (row.logged?.long ?? 0) + (row.logged?.short ?? 0) + (row.planCount ?? 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [summary]);

  const { rows: reportRows, totals: scopedTotals } = useMemo(
    () => resolveReportRows(summary, activeChannelTab, attentionFilter),
    [summary, activeChannelTab, attentionFilter],
  );

  const attentionCount = useMemo(() => {
    if (!summary?.channels?.length) return 0;
    const pool =
      activeChannelTab === "all"
        ? summary.channels
        : summary.channels.filter((row) => String(row.channelId) === activeChannelTab);
    return pool.filter((row) => reportChannelNeedsAttention(row)).length;
  }, [summary, activeChannelTab]);

  const firstCutRows = useMemo(() => {
    if (!summary) return [];
    if (activeChannelTab === "all") return sortReportChannels(summary.channels);
    const row = summary.channels.find((entry) => String(entry.channelId) === activeChannelTab);
    return row ? [row] : [];
  }, [summary, activeChannelTab]);

  const showReportEmpty =
    !loading &&
    summary &&
    !reportRows.length &&
    !((scopedTotals?.planCount ?? 0) > 0) &&
    activeChannelTab !== "all" &&
    !summary.channels.some((row) => String(row.channelId) === activeChannelTab);

  return (
    <div className="flex flex-col gap-1.5 max-sm:flex-none sm:min-h-0 sm:flex-1 sm:gap-2 sm:overflow-y-auto sm:pr-1 custom-scrollbar">
      <div className="flex flex-shrink-0 flex-col gap-1 px-0.5 sm:gap-1.5 sm:px-1">
        <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-hide sm:gap-1.5">
            <FilterLabel icon={CalendarDays} className="hidden sm:flex">Period:</FilterLabel>
            <FilterSegment
              options={REPORT_PERIODS}
              value={period}
              onChange={setPeriod}
            />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {!loading && attentionCount > 0 && (
              <span className="hidden items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-700 sm:flex dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
                {attentionCount} behind
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadReport()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/60 bg-white/80 text-gray-500 shadow-sm transition hover:border-primary-300 hover:text-primary-600 dark:border-gray-700/60 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:text-primary-400"
              title="Refresh report"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {period === "custom" && (
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-end">
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-gray-400">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="buffer-input min-h-11 text-sm sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-gray-400">To</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="buffer-input min-h-11 text-sm sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
              />
            </label>
          </div>
        )}

        <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
          <span className="sm:hidden">{formatLogDate(range.from)} – {formatLogDate(range.to)}</span>
          <span className="hidden sm:inline">{periodLabel} · {formatLogDate(range.from)} – {formatLogDate(range.to)}</span>
        </p>
      </div>

      <div className="flex max-w-full flex-shrink-0 flex-col gap-1 px-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5 sm:px-1">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-hide sm:gap-1.5">
          <FilterSegment
            options={REPORT_ATTENTION_FILTERS}
            value={attentionFilter}
            onChange={setAttentionFilter}
            variant="default"
          />
        </div>
        {reportChannels.length > 0 && (
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide">
            <FilterLabel icon={Layers3} className="hidden sm:flex">Channel:</FilterLabel>
            <FilterChip active={activeChannelTab === "all"} onClick={() => onChannelTabChange("all")}>
              All
            </FilterChip>
            {reportChannels.map((channel) => (
              <FilterChip
                key={channel._id}
                active={activeChannelTab === String(channel._id)}
                onClick={() => onChannelTabChange(String(channel._id))}
                count={channel.count}
              >
                {channel.name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {showReportEmpty ? (
        <ReportEmptyPanel message="No summary for this channel in the selected period." />
      ) : (
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <ReportOverviewSection totals={scopedTotals} attentionCount={attentionCount} loading={loading} />
          <ReportOutputProgressSection rows={reportRows} loading={loading} attentionFilter={attentionFilter} />
          <ReportFirstCutSection rows={firstCutRows} loading={loading} />
        </div>
      )}
    </div>
  );
}

function PlanNotesModal({ plan, onClose }) {
  if (!plan) return null;
  const notes = String(plan.notes || "").trim();

  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-labelledby="plan-notes-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:rounded-2xl"
      >
        <div className="mx-auto mt-2 h-1 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="min-w-0">
            <h3 id="plan-notes-modal-title" className="text-sm font-bold leading-snug text-gray-900 dark:text-white">
              Notes
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">{plan.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-gray-800 dark:text-gray-100">
            {notes}
          </pre>
        </div>
        <div className="flex justify-end border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200/80 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ThumbnailModal({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:rounded-2xl">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4">
          <span className="text-xs font-bold uppercase tracking-widest text-white drop-shadow-md">Thumbnail Preview</span>
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
        <img src={url} alt="Plan thumbnail" className="max-h-[85vh] w-full bg-gray-100 object-contain dark:bg-gray-800" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}

export default function ChannelPlanner() {
  const [pageTab, setPageTab] = useState("plans");
  const [channels, setChannels] = useState([]);
  const [contentManagers, setContentManagers] = useState([]);
  const [gridChannels, setGridChannels] = useState([]);
  const [activeChannelTab, setActiveChannelTab] = useState("all");
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState("schedule");
  const [dateGroupPage, setDateGroupPage] = useState(1);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalGroups: 0, totalPlans: 0 });
  const [stats, setStats] = useState({ schedule: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [notesPlan, setNotesPlan] = useState(null);

  const filterParams = useMemo(() => {
    if (activeChannelTab !== "all") return { channelId: activeChannelTab };
    return {};
  }, [activeChannelTab]);

  const loadReferenceData = useCallback(async () => {
    try {
      const [channelsResponse, usersResponse] = await Promise.all([
        api.get("/channels"),
        api.get("/users/content-managers"),
      ]);
      setChannels(channelsResponse.data);
      setContentManagers(usersResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load channels");
    }
  }, []);

  const loadPlans = useCallback(async () => {
    if (pageTab !== "plans") return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bucket: viewMode,
        page: String(dateGroupPage),
        limit: String(DATE_GROUP_PAGE_SIZE),
        ...filterParams,
      });
      if (search.trim()) params.set("search", search.trim());

      const statsParams = new URLSearchParams({ bucket: viewMode });
      if (search.trim()) statsParams.set("search", search.trim());

      const [plansResponse, statsResponse] = await Promise.all([
        api.get(`/channel-plans?${params.toString()}`),
        api.get(`/channel-plans/stats?${statsParams.toString()}`),
      ]);
      setGroups(plansResponse.data.groups || []);
      setPagination(plansResponse.data.pagination || { page: 1, totalPages: 1, totalGroups: 0, totalPlans: 0 });
      setStats(statsResponse.data);
      setGridChannels(statsResponse.data.channels || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load channel plans");
    } finally {
      setLoading(false);
    }
  }, [pageTab, viewMode, dateGroupPage, filterParams, search]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPlans(), 250);
    return () => window.clearTimeout(timer);
  }, [loadPlans]);

  useEffect(() => {
    if (activeChannelTab === "all" || pageTab !== "plans") return;
    if (!gridChannels.some((channel) => String(channel._id) === activeChannelTab)) {
      setActiveChannelTab("all");
    }
  }, [gridChannels, activeChannelTab, pageTab]);

  const changeView = (value) => {
    setViewMode(value);
    setDateGroupPage(1);
    setActiveChannelTab("all");
  };

  const changeChannelTab = (value) => {
    setActiveChannelTab(value);
    setDateGroupPage(1);
  };

  const changePageTab = (tab) => {
    setPageTab(tab);
    setActiveChannelTab("all");
    setDateGroupPage(1);
    if (tab === "log-work") setSearch("");
  };

  const handleSaved = async () => {
    await loadReferenceData();
    await loadPlans();
    setReportRefreshKey((key) => key + 1);
  };

  const handleWorkLogged = () => {
    setReportRefreshKey((key) => key + 1);
  };

  const handleToggleStatus = async (plan) => {
    if (plan.status !== "completed") {
      const blockers = planCompletionBlockers(plan);
      if (blockers.length) {
        toast.error(`Complete all planned videos first: ${blockers.join(", ")}`);
        return;
      }
    }
    try {
      await api.put(`/channel-plans/${plan._id}`, {
        status: plan.status === "completed" ? "todo" : "completed",
      });
      toast.success(plan.status === "completed" ? "Plan reopened" : "Plan completed");
      await loadPlans();
      setReportRefreshKey((key) => key + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update plan");
    }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    try {
      await api.delete(`/channel-plans/${deletePlan._id}`);
      toast.success("Plan deleted");
      setDeletePlan(null);
      await loadPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete plan");
    } finally {
      setDeleting(false);
    }
  };

  const bucketOptions = [
    { value: "schedule", label: "In Production", shortLabel: "Active", count: stats.schedule },
    { value: "completed", label: "Completed", shortLabel: "Done", count: stats.completed },
  ];

  const showChannelFootage = viewMode === "schedule" || viewMode === "completed";
  const totalChannelFootage = useMemo(
    () => gridChannels.reduce((sum, channel) => sum + (Number(channel.footageMinutes) || 0), 0),
    [gridChannels],
  );
  const totalLongCount = useMemo(
    () => gridChannels.reduce((sum, channel) => sum + (Number(channel.longCount) || 0), 0),
    [gridChannels],
  );
  const totalShortCount = useMemo(
    () => gridChannels.reduce((sum, channel) => sum + (Number(channel.shortCount) || 0), 0),
    [gridChannels],
  );

  const hasPlans = stats.schedule + stats.completed > 0;
  const showStatsRibbon = pageTab === "plans" && !loading && hasPlans;

  return (
    <AdminLayout title="Channel Planner" titleInfo="Plan & track channel output" icon={CalendarDays} contentFit noPadding>
      <div className="flex h-full min-h-0 w-full flex-col gap-1.5 overflow-y-auto px-2 pb-3 pt-1.5 custom-scrollbar sm:gap-2 sm:overflow-hidden sm:px-4 sm:pb-4 sm:pt-2">
        <PageTabBar tabs={PAGE_TABS} activeTab={pageTab} onChange={changePageTab} ariaLabel="Channel Planner views" />

        <ChannelPlannerTabPanel tabId="plans" activeTab={pageTab}>
          {showStatsRibbon && (
            <div className="flex flex-shrink-0 items-center justify-between gap-2 overflow-x-auto scrollbar-hide rounded-lg border border-gray-100/50 bg-gray-50/50 px-2 py-1 dark:border-gray-700/50 dark:bg-gray-800/30 sm:gap-3 sm:px-3 sm:py-1.5">
              <div className="ml-0.5 flex items-center gap-2 sm:ml-1 sm:gap-4 md:gap-6">
                <StatCard icon={CalendarDays} label="In Production" shortLabel="Active" count={stats.schedule} color="text-primary-500" />
                <StatCard icon={CheckCircle2} label="Done" shortLabel="Done" count={stats.completed} color="text-emerald-500" />
              </div>
              <div className="ml-auto hidden max-w-sm flex-grow items-center gap-2 sm:flex">
                <SearchInput
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setDateGroupPage(1);
                  }}
                  placeholder="Search title, notes, or #id"
                  onClear={() => setSearch("")}
                />
                <button
                  type="button"
                  onClick={() => void loadPlans()}
                  disabled={loading}
                  className="rounded-lg border border-gray-200/50 bg-white/50 p-1.5 text-gray-500 shadow-sm transition hover:bg-white hover:text-primary-600 dark:border-gray-600/50 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:hover:text-primary-400"
                  title="Refresh"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          )}

          <div className="z-30 flex-shrink-0 px-0.5 py-0.5 sm:p-1.5">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="sm:hidden">
                <SearchInput
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setDateGroupPage(1);
                  }}
                  placeholder="Search plans..."
                  onClear={() => setSearch("")}
                />
              </div>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide">
                  <FilterLabel icon={Filter} className="hidden sm:flex">View:</FilterLabel>
                  <FilterSegment options={bucketOptions} value={viewMode} onChange={changeView} variant="success" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditPlan(null);
                    setModalOpen(true);
                  }}
                  className="buffer-button-primary inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1.5 text-[11px] font-semibold sm:gap-1.5 sm:px-4 sm:py-2"
                >
                  <Plus size={14} className="sm:h-4 sm:w-4" />
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add Plan</span>
                </button>
              </div>

              {gridChannels.length > 0 && (
                <div className="flex max-w-full items-center gap-2 overflow-x-auto scrollbar-hide">
                  <FilterLabel icon={Layers3} className="hidden sm:flex">Channel:</FilterLabel>
                  <FilterChip
                    active={activeChannelTab === "all"}
                    onClick={() => changeChannelTab("all")}
                    footageMinutes={showChannelFootage ? totalChannelFootage : undefined}
                    longCount={showChannelFootage ? totalLongCount : undefined}
                    shortCount={showChannelFootage ? totalShortCount : undefined}
                  >
                    All
                  </FilterChip>
                  {gridChannels.map((channel) => (
                    <FilterChip
                      key={channel._id}
                      active={activeChannelTab === String(channel._id)}
                      onClick={() => changeChannelTab(String(channel._id))}
                      footageMinutes={showChannelFootage ? channel.footageMinutes : undefined}
                      longCount={showChannelFootage ? channel.longCount : undefined}
                      shortCount={showChannelFootage ? channel.shortCount : undefined}
                    >
                      {channel.name}
                    </FilterChip>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-visible sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 sm:min-h-64">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading plans…</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center sm:min-h-64">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 sm:mb-4 sm:h-16 sm:w-16 sm:rounded-2xl">
                  <Layers3 size={28} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No plans found</p>
                <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
                  Add a plan or adjust the active filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditPlan(null);
                    setModalOpen(true);
                  }}
                  className="buffer-button-primary mt-4 inline-flex items-center gap-1.5 text-xs"
                >
                  <Plus size={14} /> Add Your First Plan
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 pb-2 sm:space-y-2 sm:pb-20">
                {groups.map((group) => (
                  <DateGroup
                    key={group.date}
                    group={group}
                    viewMode={viewMode}
                    onEdit={(plan) => {
                      setEditPlan(plan);
                      setModalOpen(true);
                    }}
                    onDelete={setDeletePlan}
                    onToggleStatus={handleToggleStatus}
                    onThumbnail={setThumbnailUrl}
                    onOpenNotes={setNotesPlan}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && pagination.totalGroups > 0 && (
            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-1.5 rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2">
              <span className="hidden tabular-nums sm:inline">
                {pagination.totalGroups} dates · {pagination.totalPlansOnPage ?? pagination.totalPlans} plans on this page ·{" "}
                {DATE_GROUP_PAGE_SIZE} dates per page
              </span>
              <span className="tabular-nums sm:hidden">
                {pagination.totalPlansOnPage ?? pagination.totalPlans} plans
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setDateGroupPage((page) => page - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:border-primary-300 hover:text-primary-600 disabled:opacity-30 dark:border-gray-600 sm:h-auto sm:w-auto sm:p-1.5"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="tabular-nums">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setDateGroupPage((page) => page + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:border-primary-300 hover:text-primary-600 disabled:opacity-30 dark:border-gray-600 sm:h-auto sm:w-auto sm:p-1.5"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </ChannelPlannerTabPanel>

        <ChannelPlannerTabPanel tabId="log-work" activeTab={pageTab}>
          <LogWorkPanel
            isActive={pageTab === "log-work"}
            refreshKey={reportRefreshKey}
            onLogged={handleWorkLogged}
          />
        </ChannelPlannerTabPanel>

        <ChannelPlannerTabPanel tabId="report" activeTab={pageTab}>
          <WorkLogReportPanel
            activeChannelTab={activeChannelTab}
            onChannelTabChange={changeChannelTab}
            refreshKey={reportRefreshKey}
            isActive={pageTab === "report"}
          />
        </ChannelPlannerTabPanel>
      </div>

      <ChannelPlanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditPlan(null);
        }}
        onSaved={handleSaved}
        channels={channels}
        contentManagers={contentManagers}
        editPlan={editPlan}
      />
      <ConfirmModal
        isOpen={Boolean(deletePlan)}
        title="Delete channel plan?"
        message={
          <>
            This permanently deletes <strong>{deletePlan?.title}</strong>.
          </>
        }
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletePlan(null)}
        loading={deleting}
        danger
      />
      {thumbnailUrl && <ThumbnailModal url={thumbnailUrl} onClose={() => setThumbnailUrl("")} />}
      {notesPlan && <PlanNotesModal plan={notesPlan} onClose={() => setNotesPlan(null)} />}
    </AdminLayout>
  );
}
