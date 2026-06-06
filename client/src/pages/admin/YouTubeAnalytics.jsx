import { useState, useEffect, useMemo, useCallback, Component, useRef } from "react";
import axios from "axios";
import {
  Youtube,
  Trash2,
  Settings,
  Users,
  Eye,
  Video,
  ExternalLink,
  RefreshCw,
  X,
  PlusCircle,
  Clock,
  Loader2,
  TrendingUp,
  BarChart3,
  Clapperboard,
  Trophy,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  GitCompareArrows,
  ArrowUp,
  HelpCircle,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ReferenceLine,
} from "recharts";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
import {
  SCRAPE_VIDEO_CAP,
  formatCompact,
  computeDashboardStats,
  buildTopVideosByViews,
  buildWeeklyUploads,
  buildViewsDistribution,
  buildLastUploadedPerformance,
  sortVideosByRecent,
  computeViewsAxisMax,
  computeCompareSampleStats,
  COMPARE_SAMPLE_LIMITS,
} from "../../utils/youtubeAnalyticsData";

const YT_META_PREFIX = "YT_ANALYTICS_META_";
const YT_CHANNEL_PANEL_KEY = "YT_ANALYTICS_CHANNEL_PANEL_OPEN";

function readChannelPanelOpen() {
  try {
    const v = localStorage.getItem(YT_CHANNEL_PANEL_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

const PRESET_COLORS = {
  blue: { hex: "#3b82f6", bg: "bg-blue-500", text: "text-blue-500", light: "#93c5fd" },
  emerald: { hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500", light: "#6ee7b7" },
  violet: { hex: "#8b5cf6", bg: "bg-violet-500", text: "text-violet-500", light: "#c4b5fd" },
  amber: { hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500", light: "#fcd34d" },
  rose: { hex: "#f43f5e", bg: "bg-rose-500", text: "text-rose-500", light: "#fda4af" },
};

const SCRAPE_STATUS_STEPS = [
  "Connecting to YouTube…",
  "Reading subscriber count…",
  `Loading up to ${SCRAPE_VIDEO_CAP} recent videos…`,
  "Parsing views and upload dates…",
  "Large channels may take 2–4 minutes…",
];

function readChannelUiMeta(handle) {
  try {
    const raw = localStorage.getItem(`${YT_META_PREFIX}${handle.toLowerCase()}`);
    if (!raw) return { color: "blue" };
    return { color: JSON.parse(raw).color || "blue" };
  } catch {
    return { color: "blue" };
  }
}

function writeChannelUiMeta(handle, { color }) {
  localStorage.setItem(
    `${YT_META_PREFIX}${handle.toLowerCase()}`,
    JSON.stringify({ color: color || "blue", handle }),
  );
}

/** Compact KPI strip in chart card header (avoids Y-axis / plot overlap). */
function ChartHeaderStats({ stats }) {
  if (!stats?.length) return null;
  return (
    <div
      className="flex flex-nowrap items-center justify-end gap-0.5 sm:gap-1.5 min-w-0 shrink-0 pointer-events-none"
      aria-label="Chart summary"
    >
      {stats.slice(0, 3).map((s) => (
        <div
          key={s.label}
          className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-50/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-600/60"
        >
          <p className="text-[7px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
            {s.label}
          </p>
          <p className="text-[10px] sm:text-xs font-bold tabular-nums text-slate-900 dark:text-white leading-tight mt-0.5">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children, className = "", stats, headerExtra }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 shadow-sm flex flex-col min-h-[260px] ${className}`}
    >
      <div className="px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 min-w-0">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {Icon && <Icon size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</h3>
              {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2 min-w-0 shrink-0 sm:max-w-[72%] overflow-x-auto">
            {headerExtra}
            <ChartHeaderStats stats={stats} />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[200px] p-3 pt-2 pl-4 overflow-visible">{children}</div>
    </div>
  );
}

const UPLOADS_CHART_TYPE_OPTIONS = [
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
];

function UploadsChartTypeToggle({ value, onChange }) {
  return (
    <div
      className="inline-flex shrink-0 rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 pointer-events-auto"
      role="group"
      aria-label="Chart type"
    >
      {UPLOADS_CHART_TYPE_OPTIONS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs transition-colors ${
            value === t.id ? SEGMENT_ACTIVE : SEGMENT_IDLE
          }`}
          aria-pressed={value === t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function UploadsPerformanceTooltip({ active, payload, contentStyle }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const views = payload[0]?.value;

  return (
    <div style={contentStyle} className="px-2.5 py-2 shadow-lg">
      {row.title && (
        <p className="font-semibold text-[11px] leading-snug mb-1 max-w-[220px]">{row.title.slice(0, 80)}</p>
      )}
      <p className="text-[10px] opacity-90">
        <span className="font-medium">{row.chartLabel}</span>
        {" · "}
        <span className="font-semibold tabular-nums">{formatCompact(views)}</span> views
      </p>
      {row.isLongVideo && row.publishedDateLabel && (
        <p className="text-[10px] opacity-75 mt-0.5">{row.publishedDateLabel}</p>
      )}
    </div>
  );
}

function LastUploadsPerformanceChart({ chartType, items, count, avgViews, yMax, accentHex, tooltipStyle }) {
  const xAxis = (
    <XAxis
      dataKey="chartLabel"
      tick={{ fontSize: 8, fontWeight: 600 }}
      tickLine={false}
      interval={0}
      angle={-40}
      textAnchor="end"
      height={52}
      tickFormatter={(label) => {
        const n = parseInt(String(label).replace("#", ""), 10);
        if (n === 1 || n === count || n % 5 === 0) return label;
        return "";
      }}
    />
  );
  const shared = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
      {xAxis}
      <YAxis
        tick={{ fontSize: 9 }}
        tickFormatter={formatCompact}
        width={Y_AXIS_VIEWS_WIDTH}
        tickLine={false}
        domain={[0, yMax]}
        allowDataOverflow={false}
      />
      <Tooltip content={<UploadsPerformanceTooltip contentStyle={tooltipStyle} />} />
      <ReferenceLine y={avgViews} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" />
    </>
  );

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={items} margin={CHART_MARGIN_VIEWS}>
          {shared}
          <Line
            type="monotone"
            dataKey="views"
            stroke={accentHex}
            strokeWidth={2}
            dot={{ r: 3, fill: accentHex, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={items} margin={CHART_MARGIN_VIEWS}>
          {shared}
          <Area
            type="monotone"
            dataKey="views"
            stroke={accentHex}
            strokeWidth={2}
            fill={accentHex}
            fillOpacity={0.22}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={items} margin={CHART_MARGIN_VIEWS}>
        {shared}
        <Bar dataKey="views" fill={accentHex} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** How many recent uploads to include in charts and KPIs (not scrape cap). */
const VIDEO_LIMIT_OPTIONS = [10, 50, 100, 200, 500];
const DEFAULT_VIDEO_LIMIT = 50;

const PAGE_TABS = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "compare", label: "Channel Compare", icon: GitCompareArrows },
];

const COMPARE_METRICS = [
  {
    key: "totalViews",
    label: "Total views",
    format: "compact",
    tooltip: "Sum of view counts across every video in this sample size.",
  },
  {
    key: "avgViews",
    label: "Avg views / video",
    format: "compact",
    tooltip: "Mean views per video in the sample (total views ÷ video count).",
  },
  {
    key: "medianViews",
    label: "Median views",
    format: "compact",
    tooltip: "Middle value when videos are sorted by views — less skewed by one viral hit than the average.",
  },
  {
    key: "bestVideoViews",
    label: "Best video views",
    format: "compact",
    tooltip: "Highest view count among videos in this sample.",
  },
  {
    key: "videoCount",
    label: "Videos in sample",
    format: "number",
    tooltip: "How many of the newest uploads are included (up to the selected sample size).",
  },
];

const SEGMENT_ACTIVE =
  "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200/80 dark:ring-blue-800/60 font-semibold";
const SEGMENT_IDLE =
  "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium";

/** Room for formatCompact Y ticks (e.g. "74.0K") — avoid negative margin.left clipping tspan labels. */
const CHART_MARGIN_VIEWS = { top: 8, right: 12, left: 4, bottom: 4 };
const CHART_MARGIN_DUAL_AXIS = { top: 8, right: 12, left: 4, bottom: 4 };
const CHART_MARGIN_COUNT = { top: 8, right: 12, left: 4, bottom: 4 };
const Y_AXIS_VIEWS_WIDTH = 52;
const Y_AXIS_COUNT_WIDTH = 36;

function PageTabBar({ activeTab, onChange }) {
  return (
    <div
      className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide -mx-1 px-1"
      role="tablist"
      aria-label="YouTube Analytics views"
    >
      {PAGE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex-shrink-0 whitespace-nowrap ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function CompareChannelSelect({ label, value, onChange, channels, excludeHandle, disabled }) {
  return (
    <div className="min-w-0 flex-1">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      <select
        value={value?.id || ""}
        disabled={disabled}
        onChange={(e) => {
          const ch = channels.find((c) => c.id === e.target.value) || null;
          onChange(ch);
        }}
        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white disabled:opacity-50"
      >
        <option value="">Select channel…</option>
        {channels
          .filter((c) => !excludeHandle || c.handle !== excludeHandle)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (@{c.handle})
            </option>
          ))}
      </select>
    </div>
  );
}

function formatCompareMetric(value, format) {
  if (format === "compact") return formatCompact(value);
  return String(value ?? "—");
}

function CompareWinnerBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
      <ArrowUp size={10} strokeWidth={3} />
      Lead
    </span>
  );
}

function CompareMetricRow({ metric, valueA, valueB }) {
  const numA = Number(valueA) || 0;
  const numB = Number(valueB) || 0;
  const aWins = numA > numB;
  const bWins = numB > numA;
  const tie = numA === numB;

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      <td className="py-2.5 pr-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
        <span className="inline-flex items-center gap-1" title={metric.tooltip}>
          {metric.label}
          {metric.tooltip && (
            <HelpCircle size={11} className="text-slate-400 dark:text-slate-500 flex-shrink-0 cursor-help" aria-hidden />
          )}
        </span>
      </td>
      <td
        className={`py-2.5 px-2 text-right text-sm tabular-nums font-semibold ${
          aWins && !tie ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
        }`}
      >
        {formatCompareMetric(valueA, metric.format)}
        {aWins && !tie && <CompareWinnerBadge />}
      </td>
      <td
        className={`py-2.5 pl-2 text-right text-sm tabular-nums font-semibold ${
          bWins && !tie ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
        }`}
      >
        {formatCompareMetric(valueB, metric.format)}
        {bWins && !tie && <CompareWinnerBadge />}
      </td>
    </tr>
  );
}

function CompareSampleCard({ limit, statsA, statsB, channelA, channelB, accentA, accentB }) {
  if (!statsA || !statsB) return null;
  const colA = accentA?.bg || "bg-blue-500";
  const colB = accentB?.bg || "bg-violet-500";

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Newest {limit} uploads
          </h4>
          <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
            {Math.min(statsA.videoCount, limit)} / {Math.min(statsB.videoCount, limit)} videos
          </span>
        </div>
      </div>
      <div className="px-3 py-2">
        <table className="w-full">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <th className="text-left py-1.5 font-bold">Metric</th>
              <th className="text-right py-1.5 font-bold">
                <span className={`inline-flex items-center gap-1 justify-end ${colA} text-white px-1.5 py-0.5 rounded-md text-[9px]`}>
                  {channelA?.name?.charAt(0) || "A"}
                </span>
              </th>
              <th className="text-right py-1.5 font-bold">
                <span className={`inline-flex items-center gap-1 justify-end ${colB} text-white px-1.5 py-0.5 rounded-md text-[9px]`}>
                  {channelB?.name?.charAt(0) || "B"}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((m) => (
              <CompareMetricRow
                key={m.key}
                metric={m}
                valueA={statsA[m.key]}
                valueB={statsB[m.key]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Inline scrape progress — button state + content banner (no full-page modal). */
function ScrapeProgressBanner({ title, statusMessage, elapsedSec, channels, onCancel }) {
  if (!channels?.length) return null;
  return (
    <div
      className="rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/90 dark:bg-blue-950/40 px-4 py-3 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Loader2 size={20} className="text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{statusMessage}</p>
            <ul className="mt-2 space-y-1">
              {channels.map((ch) => (
                <li key={ch.handle} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  {ch.loading ? (
                    <Loader2 size={12} className="text-blue-500 animate-spin flex-shrink-0" />
                  ) : ch.done ? (
                    <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0" aria-hidden />
                  )}
                  <span className="font-medium truncate">
                    {ch.loading ? `Loading ${ch.name}…` : ch.done ? `${ch.name} — done` : ch.name}
                  </span>
                  <span className="text-slate-400 truncate">@{ch.handle}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center gap-1">
              <Clock size={10} /> {elapsedSec}s elapsed · up to {SCRAPE_VIDEO_CAP} videos per channel
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 flex-shrink-0"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function YouTubeAnalytics() {
  const [pageTab, setPageTab] = useState("analytics");
  const [types, setTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [compareChannelA, setCompareChannelA] = useState(null);
  const [compareChannelB, setCompareChannelB] = useState(null);
  const [compareVideosA, setCompareVideosA] = useState([]);
  const [compareVideosB, setCompareVideosB] = useState([]);
  const [compareLoadingA, setCompareLoadingA] = useState(false);
  const [compareLoadingB, setCompareLoadingB] = useState(false);
  const [compareFormat, setCompareFormat] = useState("long");
  const [compareSampleLimit, setCompareSampleLimit] = useState(DEFAULT_VIDEO_LIMIT);
  const compareCacheRef = useRef(new Map());
  const compareScrapeDoneRef = useRef(new Set());
  const compareAbortRefA = useRef(null);
  const compareAbortRefB = useRef(null);
  const [scrapeStatusMessage, setScrapeStatusMessage] = useState(SCRAPE_STATUS_STEPS[0]);
  const [scrapeElapsedSec, setScrapeElapsedSec] = useState(0);
  const scrapeAbortRef = useRef(null);
  const scrapeInFlightRef = useRef(false);
  const activeChannelRef = useRef(null);
  const analyticsCacheRef = useRef(new Map());
  /** null = use channel config from Trending Hub; otherwise manual long/short scrape */
  const [formatOverride, setFormatOverride] = useState(null);
  const [videoLimit, setVideoLimit] = useState(DEFAULT_VIDEO_LIMIT);
  const [uploadsChartType, setUploadsChartType] = useState("area");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [channelPanelOpen, setChannelPanelOpen] = useState(readChannelPanelOpen);
  const [mobileChannelOpen, setMobileChannelOpen] = useState(false);

  const toggleChannelPanel = useCallback(() => {
    setChannelPanelOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem(YT_CHANNEL_PANEL_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const [newChanName, setNewChanName] = useState("");
  const [newChanHandle, setNewChanHandle] = useState("");
  const [newChanCategory, setNewChanCategory] = useState("");
  const [newChanColor, setNewChanColor] = useState("blue");
  const [addingChannel, setAddingChannel] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editColor, setEditColor] = useState("");

  useEffect(() => () => scrapeAbortRef.current?.abort(), []);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  useEffect(() => {
    const scraping = refreshing || compareLoadingA || compareLoadingB;
    if (!scraping) {
      setScrapeElapsedSec(0);
      setScrapeStatusMessage(SCRAPE_STATUS_STEPS[0]);
      return undefined;
    }
    const started = Date.now();
    let step = 0;
    const tick = setInterval(() => {
      setScrapeElapsedSec(Math.floor((Date.now() - started) / 1000));
      step = (step + 1) % SCRAPE_STATUS_STEPS.length;
      setScrapeStatusMessage(SCRAPE_STATUS_STEPS[step]);
    }, 4000);
    return () => clearInterval(tick);
  }, [refreshing, compareLoadingA, compareLoadingB]);

  const fetchData = useCallback(async () => {
    try {
      const { data: typesData } = await api.get("/competitor-types");
      setTypes(typesData);
      const channelList = [];
      (typesData || []).forEach((type) => {
        (type.channels || []).forEach((ch) => {
          if (!ch?.handle) return;
          let meta = readChannelUiMeta(ch.handle);
          if (!localStorage.getItem(`${YT_META_PREFIX}${ch.handle.toLowerCase()}`)) {
            const colors = Object.keys(PRESET_COLORS);
            const seedColor =
              colors[Math.abs(ch.handle.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];
            meta = { color: seedColor };
            writeChannelUiMeta(ch.handle, meta);
          }
          channelList.push({
            id: `${type._id}-${ch.handle}`,
            name: ch.name,
            handle: ch.handle,
            typeId: type._id,
            typeName: type.name,
            color: meta.color || "blue",
            subscribers: 0,
            videoFormat: ch.videoFormat === "short" ? "short" : "long",
          });
        });
      });
      setChannels(channelList);
      if (channelList.length > 0 && !activeChannel) {
        setActiveChannel(channelList[0]);
      } else if (activeChannel) {
        const updated =
          channelList.find((c) => c.handle === activeChannel.handle) || channelList[0];
        setActiveChannel((prev) => {
          if (!prev || prev.handle !== updated.handle) return updated;
          return { ...updated, subscribers: prev.subscribers > 0 ? prev.subscribers : updated.subscribers };
        });
      }
    } catch {
      toast.error("Failed to load channels");
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAnalyticsCache = useCallback(() => {
    const ch = activeChannelRef.current;
    if (!ch?.handle || !ch?.typeId) {
      setVideos([]);
      setRefreshing(false);
      return;
    }

    const handleKey = ch.handle.toLowerCase();
    const channelDefault = ch.videoFormat === "short" ? "short" : "long";
    const videoFormat = formatOverride ?? channelDefault;
    const scrapeKey = `${handleKey}|${ch.typeId}|${videoFormat}`;
    const cached = analyticsCacheRef.current.get(scrapeKey);

    if (cached) {
      setVideos(cached.videos);
      setChannels((prev) =>
        prev.map((c) => (c.handle.toLowerCase() === handleKey ? { ...c, subscribers: cached.subscribers } : c)),
      );
      setActiveChannel((prev) => {
        if (!prev || prev.handle.toLowerCase() !== handleKey) return prev;
        if (prev.subscribers === cached.subscribers) return prev;
        return { ...prev, subscribers: cached.subscribers };
      });
    } else {
      setVideos([]);
    }
    setRefreshing(false);
  }, [formatOverride]);

  const loadVideos = useCallback(async ({ force = false, showToast = false } = {}) => {
    const ch = activeChannelRef.current;
    if (!ch?.handle || !ch?.typeId) return;

    const handleKey = ch.handle.toLowerCase();
    const channelDefault = ch.videoFormat === "short" ? "short" : "long";
    const videoFormat = formatOverride ?? channelDefault;
    const scrapeKey = `${handleKey}|${ch.typeId}|${videoFormat}`;

    if (!force) return;

    if (scrapeInFlightRef.current) return;

    scrapeAbortRef.current?.abort();
    const ctrl = new AbortController();
    scrapeAbortRef.current = ctrl;
    scrapeInFlightRef.current = true;
    setRefreshing(true);

    try {
      const params = new URLSearchParams({
        typeId: ch.typeId,
        videoFormat,
        channelHandle: ch.handle,
        force: "true",
      });

      const { data } = await api.get(`/competitors/videos?${params}`, {
        signal: ctrl.signal,
        timeout: 300_000,
      });

      if (activeChannelRef.current?.handle?.toLowerCase() !== handleKey) return;

      const list = (data.videos || []).filter(
        (v) => String(v.channelHandle || "").toLowerCase() === handleKey,
      );
      const trimmed = list.slice(0, SCRAPE_VIDEO_CAP);

      const scrapedChan = (data.channels || []).find(
        (sc) => sc.handle.toLowerCase() === handleKey,
      );
      const subs = scrapedChan?.subscribers || 0;

      analyticsCacheRef.current.set(scrapeKey, { videos: trimmed, subscribers: subs });
      setVideos(trimmed);

      setChannels((prev) =>
        prev.map((c) => (c.handle.toLowerCase() === handleKey ? { ...c, subscribers: subs } : c)),
      );
      setActiveChannel((prev) => {
        if (!prev || prev.handle.toLowerCase() !== handleKey) return prev;
        if (prev.subscribers === subs) return prev;
        return { ...prev, subscribers: subs };
      });

      if (showToast) {
        toast.dismiss();
        toast.success(
          `@${ch.handle}: ${trimmed.length} videos · ${subs > 0 ? formatCompact(subs) : "—"} subscribers`,
          { duration: 4000 },
        );
      }
    } catch (err) {
      if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      const msg =
        err?.code === "ECONNABORTED"
          ? "Scrape timed out. Try again."
          : err?.response?.data?.message || "Could not fetch channel data";
      toast.error(msg, { duration: 5000 });
    } finally {
      scrapeInFlightRef.current = false;
      if (scrapeAbortRef.current === ctrl) scrapeAbortRef.current = null;
      setRefreshing(false);
    }
  }, [formatOverride]);

  const activeHandle = activeChannel?.handle;
  const activeTypeId = activeChannel?.typeId;
  const channelDefaultFormat = activeChannel?.videoFormat === "short" ? "short" : "long";
  const activeVideoFormat = formatOverride ?? channelDefaultFormat;
  const isShortChannel = activeVideoFormat === "short";
  const usingChannelFormatDefault = formatOverride === null;

  useEffect(() => {
    setFormatOverride(null);
  }, [activeHandle, activeTypeId]);

  useEffect(() => {
    if (!activeHandle || !activeTypeId) return;
    scrapeAbortRef.current?.abort();
    scrapeInFlightRef.current = false;
    applyAnalyticsCache();
  }, [activeHandle, activeTypeId, activeVideoFormat, applyAnalyticsCache]);

  const cancelScrape = useCallback(() => {
    scrapeAbortRef.current?.abort();
    compareAbortRefA.current?.abort();
    compareAbortRefB.current?.abort();
    scrapeInFlightRef.current = false;
    setRefreshing(false);
    setCompareLoadingA(false);
    setCompareLoadingB(false);
    setCompareScrapeChannel(null);
    toast("Scrape cancelled", { duration: 2500 });
  }, []);

  useEffect(() => {
    if (pageTab !== "compare" || channels.length === 0) return;
    if (!compareChannelA) setCompareChannelA(channels[0]);
    if (!compareChannelB && channels.length > 1) {
      setCompareChannelB(channels.find((c) => c.handle !== channels[0]?.handle) || null);
    }
  }, [pageTab, channels, compareChannelA, compareChannelB]);

  const applyCompareCache = useCallback(
    (side, channel) => {
      const setSideVideos = side === "a" ? setCompareVideosA : setCompareVideosB;
      const setLoading = side === "a" ? setCompareLoadingA : setCompareLoadingB;

      if (!channel?.handle || !channel?.typeId) {
        setSideVideos([]);
        setLoading(false);
        return;
      }

      const handleKey = channel.handle.toLowerCase();
      const scrapeKey = `${handleKey}|${channel.typeId}|${compareFormat}`;
      const cached = compareCacheRef.current.get(scrapeKey);

      if (cached) {
        setSideVideos(cached.videos);
        setChannels((prev) =>
          prev.map((c) =>
            c.handle.toLowerCase() === handleKey ? { ...c, subscribers: cached.subscribers } : c,
          ),
        );
        if (side === "a") {
          setCompareChannelA((prev) =>
            prev?.handle?.toLowerCase() === handleKey ? { ...prev, subscribers: cached.subscribers } : prev,
          );
        } else {
          setCompareChannelB((prev) =>
            prev?.handle?.toLowerCase() === handleKey ? { ...prev, subscribers: cached.subscribers } : prev,
          );
        }
      } else {
        setSideVideos([]);
      }
      setLoading(false);
    },
    [compareFormat],
  );

  const loadCompareSide = useCallback(
    async (side, channel, { force = false, showToast = false } = {}) => {
      if (!channel?.handle || !channel?.typeId) return;

      const handleKey = channel.handle.toLowerCase();
      const scrapeKey = `${handleKey}|${channel.typeId}|${compareFormat}`;
      const setLoading = side === "a" ? setCompareLoadingA : setCompareLoadingB;
      const setSideVideos = side === "a" ? setCompareVideosA : setCompareVideosB;

      if (!force) {
        const cached = compareCacheRef.current.get(scrapeKey);
        if (cached) {
          setSideVideos(cached.videos);
          setChannels((prev) =>
            prev.map((c) =>
              c.handle.toLowerCase() === handleKey ? { ...c, subscribers: cached.subscribers } : c,
            ),
          );
          if (side === "a") {
            setCompareChannelA((prev) =>
              prev?.handle?.toLowerCase() === handleKey ? { ...prev, subscribers: cached.subscribers } : prev,
            );
          } else {
            setCompareChannelB((prev) =>
              prev?.handle?.toLowerCase() === handleKey ? { ...prev, subscribers: cached.subscribers } : prev,
            );
          }
          return;
        }
        return;
      }

      const abortRef = side === "a" ? compareAbortRefA : compareAbortRefB;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);

      try {
        const params = new URLSearchParams({
          typeId: channel.typeId,
          videoFormat: compareFormat,
          channelHandle: channel.handle,
        });
        if (force || !compareScrapeDoneRef.current.has(scrapeKey)) params.set("force", "true");

        const { data } = await api.get(`/competitors/videos?${params}`, {
          signal: ctrl.signal,
          timeout: 300_000,
        });

        const list = (data.videos || []).filter(
          (v) => String(v.channelHandle || "").toLowerCase() === handleKey,
        );
        const trimmed = list.slice(0, SCRAPE_VIDEO_CAP);
        const scrapedChan = (data.channels || []).find((sc) => sc.handle.toLowerCase() === handleKey);
        const subs = scrapedChan?.subscribers || 0;

        compareCacheRef.current.set(scrapeKey, { videos: trimmed, subscribers: subs });
        compareScrapeDoneRef.current.add(scrapeKey);
        setSideVideos(trimmed);

        setChannels((prev) =>
          prev.map((c) => (c.handle.toLowerCase() === handleKey ? { ...c, subscribers: subs } : c)),
        );
        if (side === "a") {
          setCompareChannelA((prev) =>
            prev?.handle?.toLowerCase() === handleKey ? { ...prev, subscribers: subs } : prev,
          );
        } else {
          setCompareChannelB((prev) =>
            prev?.handle?.toLowerCase() === handleKey ? { ...prev, subscribers: subs } : prev,
          );
        }

        if (showToast) {
          toast.success(`@${channel.handle}: ${trimmed.length} videos loaded`, { duration: 3500 });
        }
      } catch (err) {
        if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        const msg =
          err?.code === "ECONNABORTED"
            ? "Scrape timed out. Try again."
            : err?.response?.data?.message || "Could not fetch channel data";
        toast.error(msg, { duration: 5000 });
      } finally {
        setLoading(false);
        if (abortRef.current === ctrl) abortRef.current = null;
        setCompareScrapeChannel((prev) => (prev?.handle === channel.handle ? null : prev));
      }
    },
    [compareFormat],
  );

  const compareHandleA = compareChannelA?.handle;
  const compareHandleB = compareChannelB?.handle;
  const compareTypeIdA = compareChannelA?.typeId;
  const compareTypeIdB = compareChannelB?.typeId;

  useEffect(() => {
    if (pageTab !== "compare") return;
    compareAbortRefA.current?.abort();
    compareAbortRefB.current?.abort();
    applyCompareCache("a", compareChannelA);
    applyCompareCache("b", compareChannelB);
  }, [
    pageTab,
    compareHandleA,
    compareTypeIdA,
    compareHandleB,
    compareTypeIdB,
    compareFormat,
    applyCompareCache,
    compareChannelA,
    compareChannelB,
  ]);

  const compareStatsA = useMemo(
    () => computeCompareSampleStats(compareVideosA, COMPARE_SAMPLE_LIMITS),
    [compareVideosA],
  );
  const compareStatsB = useMemo(
    () => computeCompareSampleStats(compareVideosB, COMPARE_SAMPLE_LIMITS),
    [compareVideosB],
  );
  const compareAccentA = PRESET_COLORS[compareChannelA?.color] || PRESET_COLORS.blue;
  const compareAccentB = PRESET_COLORS[compareChannelB?.color] || PRESET_COLORS.violet;
  const compareLoading = compareLoadingA || compareLoadingB;
  const compareReady = compareChannelA && compareChannelB && compareVideosA.length > 0 && compareVideosB.length > 0;

  const compareScrapeChannels = useMemo(() => {
    if (!compareLoading) return [];
    const list = [];
    if (compareChannelA) {
      list.push({
        name: compareChannelA.name,
        handle: compareChannelA.handle,
        loading: compareLoadingA,
        done: !compareLoadingA,
      });
    }
    if (compareChannelB) {
      list.push({
        name: compareChannelB.name,
        handle: compareChannelB.handle,
        loading: compareLoadingB,
        done: !compareLoadingB,
      });
    }
    return list;
  }, [compareLoading, compareChannelA, compareChannelB, compareLoadingA, compareLoadingB]);

  const analyticsScrapeChannels = useMemo(() => {
    if (!refreshing || !activeChannel) return [];
    return [
      {
        name: activeChannel.name,
        handle: activeChannel.handle,
        loading: true,
        done: false,
      },
    ];
  }, [refreshing, activeChannel]);
  const analyticsReady = videos.length > 0;

  const limitedVideos = useMemo(
    () => sortVideosByRecent(videos).slice(0, videoLimit),
    [videos, videoLimit],
  );

  const stats = useMemo(() => computeDashboardStats(limitedVideos), [limitedVideos]);
  const scrapedStats = useMemo(() => computeDashboardStats(videos), [videos]);
  const accent = PRESET_COLORS[activeChannel?.color] || PRESET_COLORS.blue;

  const weeklyUploads = useMemo(
    () => (isShortChannel ? [] : buildWeeklyUploads(limitedVideos, 10)),
    [limitedVideos, isShortChannel],
  );
  const viewsDistribution = useMemo(
    () => (isShortChannel ? [] : buildViewsDistribution(limitedVideos)),
    [limitedVideos, isShortChannel],
  );

  const weeklyUploadsSummary = useMemo(() => {
    if (!weeklyUploads.length) return { uploads: 0, views: 0, weeks: 0 };
    return {
      uploads: weeklyUploads.reduce((s, w) => s + (w.uploads || 0), 0),
      views: weeklyUploads.reduce((s, w) => s + (w.views || 0), 0),
      weeks: weeklyUploads.length,
    };
  }, [weeklyUploads]);

  const viewsDistributionSummary = useMemo(() => {
    const total = viewsDistribution.reduce((s, b) => s + (b.count || 0), 0);
    const topBracket = [...viewsDistribution].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
    return { total, topLabel: topBracket?.label || "—", topCount: topBracket?.count || 0 };
  }, [viewsDistribution]);

  const last30Performance = useMemo(
    () => buildLastUploadedPerformance(limitedVideos, videoLimit),
    [limitedVideos, videoLimit],
  );
  const last30YMax = useMemo(
    () => computeViewsAxisMax(last30Performance.maxViews, last30Performance.avgViews),
    [last30Performance.maxViews, last30Performance.avgViews],
  );
  const top10ByViews = useMemo(() => buildTopVideosByViews(limitedVideos, 10), [limitedVideos]);
  const top10MaxViews = top10ByViews[0]?.views || 1;

  const kpiCards = useMemo(() => {
    const cards = [
      {
        label: "Subscribers",
        value: activeChannel?.subscribers > 0 ? formatCompact(activeChannel.subscribers) : "—",
        sub: "Live from YouTube",
        icon: Users,
        color: "text-violet-500",
      },
      {
        label: isShortChannel ? "Shorts in sample" : "Videos in sample",
        value: `${stats.videoCount} / ${videos.length || SCRAPE_VIDEO_CAP}`,
        sub: `Analyzing newest ${videoLimit} · up to ${SCRAPE_VIDEO_CAP} scraped`,
        icon: Video,
        color: accent.text,
      },
      {
        label: "Views in sample",
        value: formatCompact(stats.totalViews),
        sub: `Avg ${formatCompact(stats.avgViews)} / video · newest ${videoLimit}`,
        icon: Eye,
        color: "text-sky-500",
      },
    ];
    if (!isShortChannel) {
      cards.push({
        label: "All scraped views",
        value: formatCompact(scrapedStats.totalViews),
        sub: `${scrapedStats.videoCount} videos from last analysis`,
        icon: TrendingUp,
        color: "text-emerald-500",
      });
    }
    return cards;
  }, [activeChannel?.subscribers, isShortChannel, stats, scrapedStats, accent.text, videoLimit, videos.length]);

  const rankBadgeClass = (rank) => {
    if (rank === 1) return "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30";
    if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md shadow-slate-400/25";
    if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-700/25";
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600";
  };

  const handleCreateChannel = async () => {
    if (!newChanName.trim() || !newChanHandle.trim() || !newChanCategory) {
      return toast.error("All fields are required");
    }
    const cleanHandle = newChanHandle.trim().replace(/^@/, "");
    setAddingChannel(true);
    try {
      await api.post(`/competitor-types/${newChanCategory}/channels`, {
        handle: cleanHandle,
        name: newChanName.trim(),
        videoFormat: "long",
      });
      writeChannelUiMeta(cleanHandle, { color: newChanColor });
      toast.success("Channel added");
      setNewChanName("");
      setNewChanHandle("");
      setNewChanCategory("");
      await fetchData();
      const { data: typesData } = await api.get("/competitor-types");
      const type = (typesData || []).find((t) => t._id === newChanCategory);
      const added = type?.channels?.find((ch) => ch.handle.toLowerCase() === cleanHandle.toLowerCase());
      if (added) {
        setActiveChannel({
          id: `${newChanCategory}-${added.handle}`,
          name: added.name,
          handle: added.handle,
          typeId: newChanCategory,
          typeName: type.name,
          color: newChanColor,
          subscribers: 0,
          videoFormat: "long",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add channel");
    } finally {
      setAddingChannel(false);
    }
  };

  const handleDeleteChannel = async (channel) => {
    if (!confirm(`Delete "${channel.name}"?`)) return;
    try {
      await api.delete(`/competitor-types/${channel.typeId}/channels/${channel.handle}`);
      toast.success("Channel removed");
      if (activeChannel?.handle === channel.handle) setActiveChannel(null);
      await fetchData();
    } catch {
      toast.error("Failed to delete channel");
    }
  };

  const tooltipStyle = {
    borderRadius: 10,
    fontSize: 11,
    background: "rgb(15 23 42)",
    border: "none",
    color: "#fff",
  };

  return (
    <AdminLayout
      title="YouTube Analytics"
      titleInfo={`Scrapes up to ${SCRAPE_VIDEO_CAP} recent public videos per channel`}
      icon={BarChart3}
      contentFit
    >
      <div className="flex-shrink-0 mb-4">
        <PageTabBar activeTab={pageTab} onChange={setPageTab} />
      </div>

      <div className="flex h-full min-h-0 gap-0 lg:gap-4 overflow-hidden">
        {/* Sidebar — collapsible channel list (desktop, analytics tab only) */}
        {pageTab === "analytics" && (
        <aside
          className={`hidden lg:flex flex-col flex-shrink-0 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50 overflow-hidden transition-[width] duration-300 ease-in-out ${
            channelPanelOpen ? "w-56 xl:w-64" : "w-[3.25rem]"
          }`}
        >
          <div
            className={`flex-shrink-0 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1 ${
              channelPanelOpen ? "p-3 justify-between" : "p-2 flex-col"
            }`}
          >
            {channelPanelOpen && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                Channels
              </span>
            )}
            <div className={`flex items-center gap-0.5 ${channelPanelOpen ? "" : "flex-col"}`}>
              {channelPanelOpen && (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800"
                  title="Manage sources"
                >
                  <Settings size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={toggleChannelPanel}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                title={channelPanelOpen ? "Collapse channel panel" : "Expand channel panel"}
                aria-expanded={channelPanelOpen}
              >
                {channelPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 space-y-1">
            {channels.map((c) => {
              const col = PRESET_COLORS[c.color] || PRESET_COLORS.blue;
              const active = activeChannel?.handle === c.handle;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveChannel(c)}
                  title={channelPanelOpen ? undefined : `${c.name} (@${c.handle})`}
                  className={`w-full text-left rounded-xl transition-all ${
                    channelPanelOpen ? "px-3 py-2.5" : "p-1.5 flex justify-center"
                  } ${
                    active
                      ? "bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-600"
                      : "hover:bg-white/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {channelPanelOpen ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg ${col.bg} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
                        >
                          {c.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">@{c.handle}</p>
                        </div>
                      </div>
                      {c.subscribers > 0 && (
                        <p className="text-[10px] text-slate-500 mt-1 ml-10">{formatCompact(c.subscribers)} subs</p>
                      )}
                    </>
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-lg ${col.bg} text-white text-xs font-bold flex items-center justify-center ${
                        active ? "ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 ring-slate-400" : ""
                      }`}
                    >
                      {c.name.charAt(0)}
                    </div>
                  )}
                </button>
              );
            })}
            {channels.length === 0 && channelPanelOpen && (
              <p className="text-xs text-slate-500 text-center py-6 px-2">Add a channel in settings</p>
            )}
          </div>
          {!channelPanelOpen && (
            <div className="flex-shrink-0 p-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="w-full p-2 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 flex justify-center"
                title="Manage sources"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
        </aside>
        )}

        {/* Main — header, KPIs, and charts scroll together on all breakpoints */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto custom-scrollbar relative isolate">
          {pageTab === "compare" ? (
            <div className="space-y-4 pb-6">
              <header className="buffer-card overflow-hidden flex-shrink-0">
                <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/80">
                  <div className="flex items-center gap-2.5 mb-1">
                    <GitCompareArrows size={18} className="text-blue-500 flex-shrink-0" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Channel Compare</h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Compare performance across sample sizes (10–500 newest uploads) for two channels.
                  </p>
                </div>
                <div className="p-3 sm:p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
                    <CompareChannelSelect
                      label="Channel A"
                      value={compareChannelA}
                      onChange={setCompareChannelA}
                      channels={channels}
                      excludeHandle={compareChannelB?.handle}
                      disabled={compareLoading}
                    />
                    <div className="hidden sm:flex items-end pb-2 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">vs</span>
                    </div>
                    <CompareChannelSelect
                      label="Channel B"
                      value={compareChannelB}
                      onChange={setCompareChannelB}
                      channels={channels}
                      excludeHandle={compareChannelA?.handle}
                      disabled={compareLoading}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Format
                    </span>
                    <div
                      className={`inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${
                        compareLoading ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {[
                        { label: "Long", value: "long" },
                        { label: "Shorts", value: "short" },
                      ].map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          disabled={compareLoading}
                          onClick={() => setCompareFormat(f.value)}
                          className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                            compareFormat === f.value ? SEGMENT_ACTIVE : SEGMENT_IDLE
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex-shrink-0">
                        Sample
                      </span>
                      <div
                        className="inline-flex flex-nowrap flex-shrink-0 rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                        role="group"
                        aria-label="Comparison sample size"
                      >
                        {VIDEO_LIMIT_OPTIONS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCompareSampleLimit(n)}
                            className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 rounded-md text-[10px] sm:text-xs tabular-nums transition-colors whitespace-nowrap ${
                              compareSampleLimit === n ? SEGMENT_ACTIVE : SEGMENT_IDLE
                            }`}
                            aria-pressed={compareSampleLimit === n}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={compareLoading || !compareChannelA || !compareChannelB}
                      onClick={() => {
                        if (compareChannelA) loadCompareSide("a", compareChannelA, { force: true, showToast: false });
                        if (compareChannelB) loadCompareSide("b", compareChannelB, { force: true, showToast: true });
                      }}
                      className="buffer-button-primary inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 h-9 disabled:opacity-50 ml-auto"
                      aria-busy={compareLoading}
                    >
                      {compareLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {compareLoading ? "Refreshing…" : "Refresh both"}
                    </button>
                  </div>
                </div>
              </header>

              {compareLoading && (
                <ScrapeProgressBanner
                  title="Fetching channel comparison data…"
                  statusMessage={scrapeStatusMessage}
                  elapsedSec={scrapeElapsedSec}
                  channels={compareScrapeChannels}
                  onCancel={cancelScrape}
                />
              )}

              {!compareChannelA || !compareChannelB ? (
                <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30">
                  <GitCompareArrows size={40} className="text-slate-400 mb-3" />
                  <p className="font-bold text-slate-800 dark:text-slate-100">Select two channels</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Choose Channel A and Channel B above to see a head-to-head comparison.
                  </p>
                  {channels.length < 2 && (
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                    >
                      Add more channels
                    </button>
                  )}
                </div>
              ) : compareLoading && !compareReady ? (
                <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/60">
                  <Loader2 size={32} className="text-red-500 animate-spin mb-3" />
                  <p className="font-bold text-slate-800 dark:text-slate-100">Loading channel data…</p>
                  <p className="text-sm text-slate-500 mt-1">Scraping up to {SCRAPE_VIDEO_CAP} videos per channel.</p>
                </div>
              ) : (
                <>
                  {!compareReady && !compareLoading && (
                    <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        No cached data for the selected channel{compareFormat === "short" ? " shorts" : ""} format.
                        Click <span className="font-semibold">Refresh both</span> to scrape.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {[compareChannelA, compareChannelB].map((ch, i) => {
                      const accent = i === 0 ? compareAccentA : compareAccentB;
                      const scraped = i === 0 ? compareVideosA.length : compareVideosB.length;
                      return (
                        <div
                          key={ch.id}
                          className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 p-2.5 sm:p-3"
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md ${accent.bg} text-white font-bold flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0`}
                            >
                              {ch.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                                {ch.name}
                              </p>
                              <a
                                href={`https://www.youtube.com/@${ch.handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] sm:text-[10px] text-red-600 dark:text-red-400 font-medium inline-flex items-center gap-0.5 hover:underline truncate max-w-full"
                              >
                                @{ch.handle}
                                <ExternalLink size={8} className="flex-shrink-0 sm:hidden" />
                                <ExternalLink size={9} className="flex-shrink-0 hidden sm:block" />
                              </a>
                            </div>
                          </div>
                          <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <div className="inline-flex items-baseline gap-1 rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-50/95 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
                              <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                                Subscribers
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                                {ch.subscribers > 0 ? formatCompact(ch.subscribers) : "—"}
                              </span>
                            </div>
                            <div className="inline-flex items-baseline gap-1 rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-50/95 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
                              <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                                Scraped
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                                {scraped} videos
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {compareChannelA?.subscribers > 0 && compareChannelB?.subscribers > 0 && (
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Subscriber lead</span>
                      <span className="text-sm font-bold tabular-nums">
                        {compareChannelA.subscribers > compareChannelB.subscribers ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {compareChannelA.name} (+{formatCompact(compareChannelA.subscribers - compareChannelB.subscribers)})
                          </span>
                        ) : compareChannelB.subscribers > compareChannelA.subscribers ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {compareChannelB.name} (+{formatCompact(compareChannelB.subscribers - compareChannelA.subscribers)})
                          </span>
                        ) : (
                          <span className="text-slate-500">Tied</span>
                        )}
                      </span>
                    </div>
                  )}

                  {compareReady &&
                    (() => {
                      const statsA = compareStatsA.find((s) => s.limit === compareSampleLimit);
                      const statsB = compareStatsB.find((s) => s.limit === compareSampleLimit);
                      if (!statsA || !statsB) return null;
                      return (
                        <CompareSampleCard
                          limit={compareSampleLimit}
                          statsA={statsA}
                          statsB={statsB}
                          channelA={compareChannelA}
                          channelB={compareChannelB}
                          accentA={compareAccentA}
                          accentB={compareAccentB}
                        />
                      );
                    })()}

                  {compareReady && (
                    <p className="text-[10px] text-center text-slate-400">
                      Green values indicate the leader for each metric. Based on newest uploads in each sample size.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : !activeChannel ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Youtube size={48} className="text-red-500 mb-4" />
              <p className="font-bold text-slate-800 dark:text-slate-100">No channel selected</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">Add YouTube channels to start analytics.</p>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Configure channels
              </button>
            </div>
          ) : (
            <>
              {/* Channel header — identity + controls */}
              <header className="buffer-card overflow-hidden flex-shrink-0 mb-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/80 min-w-0">
                  <button
                    type="button"
                    onClick={toggleChannelPanel}
                    className="hidden lg:inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    title={channelPanelOpen ? "Collapse channel panel" : "Expand channel panel"}
                  >
                    {channelPanelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                    <span>{channelPanelOpen ? "Hide channels" : "Show channels"}</span>
                  </button>

                  <div className="lg:hidden w-full min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileChannelOpen((o) => !o)}
                      className="w-full flex items-center justify-between gap-2 h-11 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/80"
                      aria-expanded={mobileChannelOpen}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg ${accent.bg} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}
                        >
                          {activeChannel.name.charAt(0)}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeChannel.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{activeChannel.handle}</p>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                          mobileChannelOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileChannelOpen && (
                      <div className="mt-2 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 max-h-52 overflow-y-auto custom-scrollbar space-y-1">
                        {channels.map((c) => {
                          const col = PRESET_COLORS[c.color] || PRESET_COLORS.blue;
                          const active = activeChannel?.handle === c.handle;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setActiveChannel(c);
                                setMobileChannelOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                                active
                                  ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-md ${col.bg} text-white text-[10px] font-bold flex items-center justify-center`}
                                >
                                  {c.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                                  <p className="text-[10px] text-gray-500 truncate">@{c.handle}</p>
                                </div>
                                {c.subscribers > 0 && (
                                  <span className="text-[10px] font-semibold text-gray-500 tabular-nums">
                                    {formatCompact(c.subscribers)}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-11 h-11 rounded-lg ${accent.bg} text-white font-bold flex items-center justify-center text-lg flex-shrink-0`}
                    >
                      {activeChannel.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {activeChannel.name}
                      </h1>
                      <a
                        href={`https://www.youtube.com/@${activeChannel.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-600 dark:text-red-400 font-medium inline-flex items-center gap-1 hover:underline"
                      >
                        @{activeChannel.handle}
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-3 md:p-4 bg-gray-50/60 dark:bg-gray-900/40 min-w-0 overflow-x-auto custom-scrollbar">
                  <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex-shrink-0">
                      Format
                    </span>
                    <div
                      className={`inline-flex flex-shrink-0 rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${
                        refreshing ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {[
                        { label: "Long", value: "long" },
                        { label: "Shorts", value: "short" },
                      ].map((f) => {
                        const isActive = activeVideoFormat === f.value;
                        const isDefault = usingChannelFormatDefault && channelDefaultFormat === f.value;
                        return (
                          <button
                            key={f.value}
                            type="button"
                            disabled={refreshing}
                            onClick={() => setFormatOverride(f.value)}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs transition-colors inline-flex items-center gap-1 ${
                              isActive ? SEGMENT_ACTIVE : SEGMENT_IDLE
                            }`}
                            title={
                              isDefault
                                ? "Channel default (Trending Hub)"
                                : `Scrape ${f.label.toLowerCase()} videos`
                            }
                          >
                            {f.label}
                            {isDefault && (
                              <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400">
                                default
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!usingChannelFormatDefault && (
                      <button
                        type="button"
                        disabled={refreshing}
                        onClick={() => setFormatOverride(null)}
                        className="text-[9px] sm:text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline px-0.5 sm:px-1 flex-shrink-0 whitespace-nowrap"
                        title={`Revert to channel default (${channelDefaultFormat === "short" ? "Shorts" : "Long"})`}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
                    <button
                      type="button"
                      disabled={refreshing}
                      onClick={() => loadVideos({ force: true, showToast: true })}
                      className="buffer-button-primary inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs py-1.5 px-2.5 sm:py-2 sm:px-3.5 h-8 sm:h-9 disabled:opacity-50 whitespace-nowrap"
                      aria-busy={refreshing}
                    >
                      {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {refreshing ? (videos.length === 0 ? "Analyzing…" : "Refreshing…") : videos.length === 0 ? "Analyze" : "Refresh"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      className="p-1.5 sm:p-2 h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center flex-shrink-0"
                      title="Channel settings"
                      aria-label="Channel settings"
                    >
                      <Settings size={14} className="sm:hidden" />
                      <Settings size={16} className="hidden sm:block" />
                    </button>
                  </div>
                </div>
              </header>

              {refreshing && (
                <ScrapeProgressBanner
                  title={videos.length === 0 ? "Analyzing channel…" : "Refreshing channel data…"}
                  statusMessage={scrapeStatusMessage}
                  elapsedSec={scrapeElapsedSec}
                  channels={analyticsScrapeChannels}
                  onCancel={cancelScrape}
                />
              )}

              {/* Sample size — controls KPIs and charts below */}
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/30 px-3 py-2 sm:px-4 sm:py-2.5 min-w-0">
                <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto custom-scrollbar">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Videos
                  </span>
                  <div
                    className="inline-flex flex-nowrap flex-shrink-0 rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    role="group"
                    aria-label="Number of videos to analyze"
                  >
                    {VIDEO_LIMIT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVideoLimit(n)}
                        className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 rounded-md text-[10px] sm:text-xs tabular-nums transition-colors whitespace-nowrap ${
                          videoLimit === n ? SEGMENT_ACTIVE : SEGMENT_IDLE
                        }`}
                        aria-pressed={videoLimit === n}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Newest uploads in sample
                </p>
              </div>

              {/* KPIs — single row, equal-width cards (Users filter pattern) */}
              <div
                className={`flex flex-shrink-0 flex-nowrap items-stretch gap-1 sm:gap-1.5 md:gap-3 w-full min-w-0 py-3 pl-2 md:pl-3 lg:pl-0 overflow-x-auto overflow-y-visible custom-scrollbar ${
                  refreshing ? "opacity-60 pointer-events-none transition-opacity" : ""
                }`}
                role="group"
                aria-label="Channel KPIs"
              >
                {kpiCards.map((k) => (
                  <div
                    key={k.label}
                    className="flex-1 min-w-[8.75rem] sm:min-w-0 basis-0 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 px-2 py-2 sm:px-3 sm:py-3 md:p-4 min-h-[5.25rem] sm:min-h-[5.5rem]"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                        {k.label}
                      </span>
                      <k.icon size={14} className={`${k.color} flex-shrink-0 sm:hidden`} />
                      <k.icon size={16} className={`${k.color} flex-shrink-0 hidden sm:block`} />
                    </div>
                    <p className="text-sm sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
                      {k.value}
                    </p>
                    <p className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className={`pr-1 pb-4 space-y-4 ${refreshing ? "opacity-60 pointer-events-none transition-opacity" : ""}`}>
                {/* First chart: recent uploads (vertical bars — upload # on X, views on Y) */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 shadow-sm">
                  <ChartCard
                    title={`Last ${videoLimit} uploads — performance`}
                    subtitle={
                      last30Performance.count > 0
                        ? `Newest ${videoLimit} in sample · #1 = newest. Orange dashed line = average views.`
                        : "Refresh to load videos"
                    }
                    icon={Clapperboard}
                    className="border-0 shadow-none rounded-none min-h-0"
                    headerExtra={
                      last30Performance.count > 0 ? (
                        <UploadsChartTypeToggle value={uploadsChartType} onChange={setUploadsChartType} />
                      ) : null
                    }
                    stats={
                      last30Performance.count > 0
                        ? [
                            { label: "Total views", value: formatCompact(last30Performance.totalViews) },
                            { label: "Avg views", value: formatCompact(last30Performance.avgViews) },
                            { label: "Videos", value: String(last30Performance.count) },
                          ]
                        : undefined
                    }
                  >
                    {last30Performance.count === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-16">Refresh the channel to compare your latest uploads.</p>
                    ) : (
                      <LastUploadsPerformanceChart
                        chartType={uploadsChartType}
                        items={last30Performance.items}
                        count={last30Performance.count}
                        avgViews={last30Performance.avgViews}
                        yMax={last30YMax}
                        accentHex={accent.hex}
                        tooltipStyle={tooltipStyle}
                      />
                    )}
                  </ChartCard>
                </div>

                {!isShortChannel && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <ChartCard
                        title="Uploads per week"
                        subtitle="Count & views in each week bucket"
                        icon={TrendingUp}
                        stats={[
                          { label: "Uploads", value: String(weeklyUploadsSummary.uploads) },
                          { label: "Views", value: formatCompact(weeklyUploadsSummary.views) },
                          { label: "Weeks", value: String(weeklyUploadsSummary.weeks) },
                        ]}
                      >
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={weeklyUploads} margin={CHART_MARGIN_DUAL_AXIS}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 9 }} width={Y_AXIS_COUNT_WIDTH} tickLine={false} />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 9 }}
                              tickFormatter={formatCompact}
                              width={Y_AXIS_VIEWS_WIDTH}
                              tickLine={false}
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar yAxisId="left" dataKey="uploads" name="Uploads" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="views" name="Views" fill={accent.hex} radius={[4, 4, 0, 0]} opacity={0.7} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard
                        title="Views distribution"
                        subtitle="How many videos fall in each view bracket"
                        icon={BarChart3}
                        stats={[
                          { label: "Videos", value: String(viewsDistributionSummary.total) },
                          { label: "Top bracket", value: viewsDistributionSummary.topLabel },
                          { label: "In bracket", value: String(viewsDistributionSummary.topCount) },
                        ]}
                      >
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={viewsDistribution} margin={CHART_MARGIN_COUNT}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 9 }}
                              width={Y_AXIS_COUNT_WIDTH}
                              tickLine={false}
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" name="Videos" fill="#6366f1" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    </div>
                )}

                {/* Top 10 most viewed */}
                <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/50 overflow-hidden shadow-sm">
                  <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                        <Trophy size={18} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top 10 most viewed</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Top 10 from newest {videoLimit} analyzed · {videos.length} scraped
                        </p>
                      </div>
                    </div>
                    {top10ByViews.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        Leader: {formatCompact(top10MaxViews)} views
                      </span>
                    )}
                  </div>
                  <div className="p-2 space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar">
                    {top10ByViews.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-10">
                        Click Analyze to load videos and see the leaderboard.
                      </p>
                    ) : (
                      top10ByViews.map((v, i) => {
                        const rank = i + 1;
                        const pct = Math.round(((v.views || 0) / top10MaxViews) * 100);
                        return (
                          <a
                            key={v.videoId}
                            href={`https://www.youtube.com/watch?v=${v.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-slate-200/90 dark:hover:border-slate-600/80 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-sm transition-all duration-200"
                          >
                            <div
                              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black tabular-nums ${rankBadgeClass(rank)}`}
                            >
                              {rank}
                            </div>
                            <div className="relative flex-shrink-0 w-[64px] sm:w-[72px] aspect-video rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 ring-1 ring-slate-200/80 dark:ring-slate-700">
                              <img
                                src={v.thumbnail}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                                  <Play size={11} className="ml-0.5" fill="currentColor" />
                                </span>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {v.title}
                              </p>
                              {v.publishedText && (
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{v.publishedText}</p>
                              )}
                              <div className="mt-1 h-1 w-full max-w-[140px] rounded-full bg-slate-200/90 dark:bg-slate-700/80 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: accent.hex }}
                                />
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right pl-0.5">
                              <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white leading-none">
                                {formatCompact(v.views)}
                              </p>
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-0.5">
                                views
                              </p>
                              <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">{pct}% of #1</p>
                            </div>
                          </a>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Channel sources</h3>
              <button type="button" onClick={() => setSettingsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <PlusCircle size={14} /> Add channel
                </h4>
                <input
                  placeholder="Channel name"
                  value={newChanName}
                  onChange={(e) => setNewChanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                />
                <input
                  placeholder="Handle (e.g. @channel)"
                  value={newChanHandle}
                  onChange={(e) => setNewChanHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                />
                <select
                  value={newChanCategory}
                  onChange={(e) => setNewChanCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="">Category</option>
                  {types.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  {Object.keys(PRESET_COLORS).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewChanColor(key)}
                      className={`w-6 h-6 rounded-full ${PRESET_COLORS[key].bg} ${newChanColor === key ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCreateChannel}
                  disabled={addingChannel}
                  className="w-full py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {addingChannel ? "Adding…" : "Add channel"}
                </button>
              </div>
              <div className="space-y-2">
                {channels.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-500">@{c.handle}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingChannelId(editingChannelId === c.id ? null : c.id);
                            setEditColor(c.color);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-700"
                        >
                          <Settings size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteChannel(c)} className="p-2 text-slate-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {editingChannelId === c.id && (
                      <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                        {Object.keys(PRESET_COLORS).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEditColor(key)}
                            className={`w-6 h-6 rounded-full ${PRESET_COLORS[key].bg} ${editColor === key ? "ring-2 ring-slate-400" : ""}`}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            writeChannelUiMeta(c.handle, { color: editColor });
                            setEditingChannelId(null);
                            fetchData();
                            toast.success("Color updated");
                          }}
                          className="text-xs font-bold text-red-600 ml-auto"
                        >
                          Save color
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <AdminLayout title="YouTube Analytics" icon={BarChart3}>
          <div className="p-8 max-w-md mx-auto text-center">
            <p className="text-sm text-red-600 font-semibold">{this.state.error?.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
            >
              Reload
            </button>
          </div>
        </AdminLayout>
      );
    }
    return this.props.children;
  }
}

export default function YouTubeAnalyticsWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <YouTubeAnalytics />
    </ErrorBoundary>
  );
}
