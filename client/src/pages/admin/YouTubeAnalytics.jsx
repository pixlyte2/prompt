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
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(value) => [formatCompact(value), "Views"]}
        labelFormatter={(_, payload) => {
          const row = payload?.[0]?.payload;
          return row?.title ? row.title.slice(0, 80) : "";
        }}
      />
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

function ScrapeOverlay({ open, channel, statusMessage, elapsedSec, onCancel }) {
  if (!open || !channel) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-8 text-center">
        <div className="relative mx-auto mb-4 h-12 w-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-[3px] border-red-500 border-t-transparent animate-spin" />
          <Youtube size={18} className="absolute inset-0 m-auto text-red-500" />
        </div>
        <p className="font-bold text-slate-900 dark:text-white">Scraping channel</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{channel.name}</p>
        <p className="text-xs text-slate-500">@{channel.handle}</p>
        <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 min-h-[2rem]">{statusMessage}</p>
        <p className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Clock size={10} /> {elapsedSec}s · up to {SCRAPE_VIDEO_CAP} videos
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function YouTubeAnalytics() {
  const [types, setTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scrapeStatusMessage, setScrapeStatusMessage] = useState(SCRAPE_STATUS_STEPS[0]);
  const [scrapeElapsedSec, setScrapeElapsedSec] = useState(0);
  const scrapeAbortRef = useRef(null);
  const scrapeInFlightRef = useRef(false);
  const activeChannelRef = useRef(null);
  const initialScrapeDoneRef = useRef(new Set());
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
    if (!refreshing) {
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
  }, [refreshing]);

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

  const loadVideos = useCallback(async ({ force = false, showToast = false } = {}) => {
    const ch = activeChannelRef.current;
    if (!ch?.handle || !ch?.typeId) return;
    if (scrapeInFlightRef.current) return;

    const handleKey = ch.handle.toLowerCase();
    const channelDefault = ch.videoFormat === "short" ? "short" : "long";
    const videoFormat = formatOverride ?? channelDefault;
    const scrapeKey = `${handleKey}|${ch.typeId}|${videoFormat}`;
    const needsFreshScrape = force || !initialScrapeDoneRef.current.has(scrapeKey);

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
      });
      if (needsFreshScrape) params.set("force", "true");

      const { data } = await api.get(`/competitors/videos?${params}`, {
        signal: ctrl.signal,
        timeout: 300_000,
      });

      if (activeChannelRef.current?.handle?.toLowerCase() !== handleKey) return;

      const list = (data.videos || []).filter(
        (v) => String(v.channelHandle || "").toLowerCase() === handleKey,
      );
      setVideos(list.slice(0, SCRAPE_VIDEO_CAP));

      const scrapedChan = (data.channels || []).find(
        (sc) => sc.handle.toLowerCase() === handleKey,
      );
      const subs = scrapedChan?.subscribers || 0;

      setChannels((prev) =>
        prev.map((c) => (c.handle.toLowerCase() === handleKey ? { ...c, subscribers: subs } : c)),
      );
      setActiveChannel((prev) => {
        if (!prev || prev.handle.toLowerCase() !== handleKey) return prev;
        if (prev.subscribers === subs) return prev;
        return { ...prev, subscribers: subs };
      });

      initialScrapeDoneRef.current.add(scrapeKey);

      if (showToast) {
        toast.dismiss();
        toast.success(
          `@${ch.handle}: ${list.length} videos · ${subs > 0 ? formatCompact(subs) : "—"} subscribers`,
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
    loadVideos({ force: false, showToast: false });
  }, [activeHandle, activeTypeId, activeVideoFormat, loadVideos]);

  const cancelScrape = useCallback(() => {
    scrapeAbortRef.current?.abort();
    scrapeInFlightRef.current = false;
    setRefreshing(false);
    toast("Scrape cancelled", { duration: 2500 });
  }, []);

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
        sub: `${scrapedStats.videoCount} videos from last refresh`,
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
      <ScrapeOverlay
        open={refreshing}
        channel={activeChannel}
        statusMessage={scrapeStatusMessage}
        elapsedSec={scrapeElapsedSec}
        onCancel={cancelScrape}
      />

      <div className="flex h-full min-h-0 gap-0 lg:gap-4 overflow-hidden">
        {/* Sidebar — collapsible channel list (desktop) */}
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

        {/* Main — header, KPIs, and charts scroll together on all breakpoints */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
          {!activeChannel ? (
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

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50/60 dark:bg-gray-900/40 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-full sm:w-auto sm:mr-0.5">
                      Format
                    </span>
                    <div
                      className={`inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${
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
                            className={`px-3 py-1.5 rounded-md text-xs transition-colors inline-flex items-center gap-1 ${
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
                        className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline px-1"
                        title={`Revert to channel default (${channelDefaultFormat === "short" ? "Shorts" : "Long"})`}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-full sm:w-auto sm:mr-0.5">
                      Videos
                    </span>
                    <div
                      className="inline-flex flex-wrap rounded-lg p-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      role="group"
                      aria-label="Number of videos to analyze"
                    >
                      {VIDEO_LIMIT_OPTIONS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setVideoLimit(n)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs tabular-nums transition-colors ${
                            videoLimit === n ? SEGMENT_ACTIVE : SEGMENT_IDLE
                          }`}
                          aria-pressed={videoLimit === n}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto flex-shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={refreshing}
                      onClick={() => loadVideos({ force: true, showToast: true })}
                      className="buffer-button-primary inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 h-9 disabled:opacity-50"
                    >
                      {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      className="p-2 h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center flex-shrink-0"
                      title="Channel settings"
                      aria-label="Channel settings"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              </header>

              {/* KPIs */}
              <div
                className={`grid gap-3 py-3 ${
                  isShortChannel ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"
                }`}
              >
                {kpiCards.map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k.label}</span>
                      <k.icon size={16} className={k.color} />
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{k.value}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="pr-1 pb-4 space-y-4">
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
                        Refresh the channel to load videos and see the leaderboard.
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
