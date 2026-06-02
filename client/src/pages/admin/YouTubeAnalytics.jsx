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
  Activity,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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
  buildDailyTimeline,
  buildVideoViewsSeries,
  buildTopVideosByViews,
  buildWeeklyUploads,
  buildViewsDistribution,
  buildLastUploadedPerformance,
  sortVideosByRecent,
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

function ChartCard({ title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 shadow-sm flex flex-col min-h-[260px] ${className}`}
    >
      <div className="px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-slate-400" />}
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[200px] p-3 pt-2">{children}</div>
    </div>
  );
}

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
  const [dateRange, setDateRange] = useState("28d");
  /** null = use channel config from Trending Hub; otherwise manual long/short scrape */
  const [formatOverride, setFormatOverride] = useState(null);
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

  const stats = useMemo(() => computeDashboardStats(videos), [videos]);
  const accent = PRESET_COLORS[activeChannel?.color] || PRESET_COLORS.blue;

  const dailyTimeline = useMemo(
    () => (isShortChannel ? [] : buildDailyTimeline(videos, dateRange)),
    [videos, dateRange, isShortChannel],
  );

  const videoViewsSeries = useMemo(
    () => (isShortChannel ? [] : buildVideoViewsSeries(videos)),
    [videos, isShortChannel],
  );
  const weeklyUploads = useMemo(
    () => (isShortChannel ? [] : buildWeeklyUploads(videos, 10)),
    [videos, isShortChannel],
  );
  const viewsDistribution = useMemo(
    () => (isShortChannel ? [] : buildViewsDistribution(videos)),
    [videos, isShortChannel],
  );
  const last30Performance = useMemo(() => buildLastUploadedPerformance(videos, 30), [videos]);
  const top10ByViews = useMemo(() => buildTopVideosByViews(videos, 10), [videos]);
  const top10MaxViews = top10ByViews[0]?.views || 1;
  const recentVideos = useMemo(() => sortVideosByRecent(videos).slice(0, 25), [videos]);

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
        label: isShortChannel ? "Shorts loaded" : "Videos loaded",
        value: `${stats.videoCount} / ${SCRAPE_VIDEO_CAP}`,
        sub: "Most recent public uploads",
        icon: Video,
        color: accent.text,
      },
      {
        label: "Total views (loaded)",
        value: formatCompact(stats.totalViews),
        sub: `Avg ${formatCompact(stats.avgViews)} / video`,
        icon: Eye,
        color: "text-sky-500",
      },
    ];
    if (!isShortChannel) {
      cards.push({
        label: "Last 30 days",
        value: formatCompact(stats.views30d),
        sub: `${stats.uploads30d} uploads · ${formatCompact(stats.views7d)} views (7d)`,
        icon: TrendingUp,
        color: "text-emerald-500",
      });
    }
    return cards;
  }, [activeChannel?.subscribers, isShortChannel, stats, accent.text]);

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

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
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
              {/* Header toolbar */}
              <header className="flex-shrink-0 flex flex-wrap items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={toggleChannelPanel}
                  className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  title={channelPanelOpen ? "Collapse channel panel" : "Expand channel panel"}
                >
                  {channelPanelOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
                  {channelPanelOpen ? "Hide channels" : "Channels"}
                </button>

                {/* Mobile — collapsible channel picker */}
                <div className="lg:hidden w-full basis-full">
                  <button
                    type="button"
                    onClick={() => setMobileChannelOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
                    aria-expanded={mobileChannelOpen}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg ${accent.bg} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}
                      >
                        {activeChannel.name.charAt(0)}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{activeChannel.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">@{activeChannel.handle}</p>
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                        mobileChannelOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileChannelOpen && (
                    <div className="mt-2 p-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/90 max-h-52 overflow-y-auto custom-scrollbar space-y-1 shadow-inner">
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
                                ? "bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-600 shadow-sm"
                                : "hover:bg-white/80 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-md ${col.bg} text-white text-[10px] font-bold flex items-center justify-center`}
                              >
                                {c.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">@{c.handle}</p>
                              </div>
                              {c.subscribers > 0 && (
                                <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
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
                  <div className={`w-11 h-11 rounded-xl ${accent.bg} text-white font-bold flex items-center justify-center text-lg shadow-md`}>
                    {activeChannel.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{activeChannel.name}</h1>
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

                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <span
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50"
                    title="Default from Trending Hub → channel source"
                  >
                    Config: {channelDefaultFormat === "short" ? "Shorts" : "Long"}
                  </span>
                  <div
                    className={`inline-flex rounded-lg p-0.5 border ${
                      refreshing ? "opacity-50 pointer-events-none" : ""
                    } bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700`}
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
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1 ${
                            isActive
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                          }`}
                          title={
                            isDefault
                              ? "Using channel default (Trending Hub)"
                              : `Scrape ${f.label.toLowerCase()} videos`
                          }
                        >
                          {f.label}
                          {isDefault && (
                            <span className="text-[9px] font-bold uppercase text-sky-600 dark:text-sky-400">
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
                      className="px-2 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline-offset-2 hover:underline"
                      title={`Revert to channel default (${channelDefaultFormat === "short" ? "Shorts" : "Long"})`}
                    >
                      Use default
                    </button>
                  )}
                  {!isShortChannel && (
                    <>
                      {[
                        { label: "7d", value: "7d" },
                        { label: "28d", value: "28d" },
                        { label: "90d", value: "90d" },
                      ].map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setDateRange(r.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                            dateRange === r.value
                              ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                              : "text-slate-500"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </>
                  )}
                  <button
                    type="button"
                    disabled={refreshing}
                    onClick={() => loadVideos({ force: true, showToast: true })}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Channel settings"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </header>

              {/* KPIs */}
              <div
                className={`flex-shrink-0 grid gap-3 py-3 ${
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

              {/* Charts scroll area */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4 space-y-4">
                {/* First chart: last 30 uploads (vertical bars — upload # on X, views on Y) */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 overflow-hidden shadow-sm">
                  <ChartCard
                    title="Last 30 uploads — performance"
                    subtitle={
                      last30Performance.count > 0
                        ? "Upload #1 = newest. Orange dashed line = average views."
                        : "Refresh to load videos"
                    }
                    icon={Clapperboard}
                    className="border-0 shadow-none rounded-none min-h-0"
                  >
                    {last30Performance.count === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-16">Refresh the channel to compare your latest uploads.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={last30Performance.items}
                          margin={{ top: 28, right: 8, left: -8, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
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
                              if (n === 1 || n === last30Performance.count || n % 5 === 0) return label;
                              return "";
                            }}
                          />
                          <YAxis tick={{ fontSize: 9 }} tickFormatter={formatCompact} width={48} tickLine={false} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(value) => [formatCompact(value), "Views"]}
                            labelFormatter={(_, payload) => {
                              const row = payload?.[0]?.payload;
                              return row?.title ? row.title.slice(0, 80) : "";
                            }}
                          />
                          <ReferenceLine
                            y={last30Performance.avgViews}
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            label={{
                              value: `Avg ${formatCompact(last30Performance.avgViews)} views`,
                              position: "insideTopRight",
                              fill: "#d97706",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          />
                          <Bar dataKey="views" fill={accent.hex} radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                  {last30Performance.count > 0 && (
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                      {last30Performance.items.map((v) => (
                        <a
                          key={v.videoId}
                          href={`https://www.youtube.com/watch?v=${v.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 sm:gap-4 px-4 py-2.5 hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black tabular-nums ${
                              v.uploadOrder <= 3
                                ? "bg-sky-500 text-white shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {v.uploadOrder}
                          </span>
                          <img
                            src={v.thumbnail}
                            alt=""
                            className="w-14 h-8 rounded-md object-cover flex-shrink-0 bg-slate-200 ring-1 ring-slate-200/80 dark:ring-slate-700"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400">
                              {v.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{v.publishedText || "—"}</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                              {formatCompact(v.views)}
                            </p>
                            <p className="text-[9px] font-semibold uppercase text-slate-500">views</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {!isShortChannel && (
                  <ChartCard
                    title="Daily views"
                    subtitle="Sum of views on videos published each day (scraped data)"
                    icon={Activity}
                  >
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={dailyTimeline}>
                        <defs>
                          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={accent.hex} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={accent.hex} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 9 }} tickFormatter={formatCompact} width={42} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCompact(v), "Views"]} />
                        <Area type="monotone" dataKey="views" stroke={accent.hex} fill="url(#viewsGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {!isShortChannel && (
                  <>
                    <ChartCard
                      title="Views per video"
                      subtitle={`Each point is one video (1–${videoViewsSeries.length || 0}, newest → oldest) — hover for title`}
                      icon={BarChart3}
                    >
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={videoViewsSeries} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                          <defs>
                            <linearGradient id="videoViewsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={accent.hex} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={accent.hex} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                          <XAxis
                            dataKey="index"
                            tick={{ fontSize: 8 }}
                            tickLine={false}
                            interval="preserveStartEnd"
                            tickFormatter={(idx) => {
                              const n = Number(idx);
                              const last = videoViewsSeries.length;
                              if (n === 1 || n === last || n % 50 === 0) return String(n);
                              return "";
                            }}
                            label={{ value: "Video #", position: "insideBottom", offset: -2, fontSize: 9, fill: "#94a3b8" }}
                          />
                          <YAxis tick={{ fontSize: 9 }} tickFormatter={formatCompact} width={48} tickLine={false} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            labelFormatter={(_, payload) => {
                              const row = payload?.[0]?.payload;
                              return row ? `#${row.index}` : "";
                            }}
                            formatter={(value, _name, item) => [
                              formatCompact(value),
                              item?.payload?.title
                                ? item.payload.title.length > 60
                                  ? `${item.payload.title.slice(0, 58)}…`
                                  : item.payload.title
                                : "Views",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke={accent.hex}
                            fill="url(#videoViewsGrad)"
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={videoViewsSeries.length < 120}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <ChartCard title="Uploads per week" subtitle="Count & views in each week bucket" icon={TrendingUp}>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={weeklyUploads}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickFormatter={formatCompact} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar yAxisId="left" dataKey="uploads" name="Uploads" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="views" name="Views" fill={accent.hex} radius={[4, 4, 0, 0]} opacity={0.7} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Views distribution" subtitle="How many videos fall in each view bracket" icon={BarChart3}>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={viewsDistribution}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" name="Videos" fill="#6366f1" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    </div>
                  </>
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
                          From your last scrape · {stats.videoCount} videos loaded
                        </p>
                      </div>
                    </div>
                    {top10ByViews.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        Leader: {formatCompact(top10MaxViews)} views
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 space-y-2">
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
                            className="group flex items-center gap-3 sm:gap-4 p-3 rounded-xl border border-transparent hover:border-slate-200/90 dark:hover:border-slate-600/80 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md transition-all duration-200"
                          >
                            <div
                              className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-black tabular-nums ${rankBadgeClass(rank)}`}
                            >
                              {rank}
                            </div>
                            <div className="relative flex-shrink-0 w-[88px] sm:w-[104px] aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 ring-1 ring-slate-200/80 dark:ring-slate-700">
                              <img
                                src={v.thumbnail}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                                  <Play size={14} className="ml-0.5" fill="currentColor" />
                                </span>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {v.title}
                              </p>
                              {v.publishedText && (
                                <p className="text-[10px] text-slate-500 mt-1 truncate">{v.publishedText}</p>
                              )}
                              <div className="mt-2 h-1.5 w-full max-w-[200px] rounded-full bg-slate-200/90 dark:bg-slate-700/80 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: accent.hex }}
                                />
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right pl-1">
                              <p className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white leading-none">
                                {formatCompact(v.views)}
                              </p>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">
                                views
                              </p>
                              <p className="text-[9px] text-slate-400 mt-1 hidden sm:block">{pct}% of #1</p>
                            </div>
                          </a>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* Video table */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Recent uploads</h3>
                    <p className="text-[10px] text-slate-500">Newest first · up to {SCRAPE_VIDEO_CAP} from scrape</p>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 z-10">
                        <tr className="text-[10px] font-bold uppercase text-slate-500 text-left">
                          <th className="py-2.5 pl-4">Video</th>
                          <th className="py-2.5 text-right">Views</th>
                          <th className="py-2.5 pr-4 text-right">Published</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentVideos.map((v) => (
                          <tr key={v.videoId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                            <td className="py-2 pl-4 pr-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={v.thumbnail}
                                  alt=""
                                  className="w-16 h-9 rounded-md object-cover flex-shrink-0 bg-slate-200"
                                />
                                <a
                                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 hover:text-red-600"
                                >
                                  {v.title}
                                </a>
                              </div>
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                              {formatCompact(v.views)}
                            </td>
                            <td className="py-2 pr-4 text-right text-slate-500">{v.publishedText || "—"}</td>
                          </tr>
                        ))}
                        {recentVideos.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-12 text-center text-slate-400">
                              Click Refresh to load up to {SCRAPE_VIDEO_CAP} videos
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
