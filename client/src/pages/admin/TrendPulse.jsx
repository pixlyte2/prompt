import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Flame,
  Clock,
  Search,
  X,
  MapPin,
  ArrowDownWideNarrow,
  Filter,
  Youtube,
  Sparkles,
  Copy,
  MessageSquare,
  BarChart3,
  Loader2,
  Lightbulb,
  Hash,
  Type,
  FileText,
  Eye,
  Play,
  Users,
  Radio,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { renderMarkdown } from "../../utils/markdown";

const REGIONS = [
  { value: "IN", label: "All India", short: "India" },
  { value: "IN-TN", label: "Tamil Nadu", short: "TN" },
];

const SORT_OPTIONS = [
  { value: "trending", label: "Most searched" },
  { value: "latest", label: "Latest first" },
];

const SOURCE_TYPES = [
  { value: "all", label: "All" },
  { value: "news", label: "News" },
  { value: "sports", label: "Sports" },
  { value: "tech", label: "Tech" },
  { value: "entertainment", label: "Entertainment" },
  { value: "business", label: "Business" },
];

const SOURCE_MAP = {
  sports: [
    "espn", "cricbuzz", "sportskeeda", "wisden", "espncricinfo", "ndtv sports",
    "mykhel", "cricket", "ipl", "khel", "yahoo sports", "tennis",
  ],
  tech: [
    "91mobiles", "ndtv profit", "gadgets", "techcrunch", "tech", "wired",
    "the verge", "digit", "gizmodo", "sportskeeda tech",
  ],
  entertainment: [
    "bollywood", "filmi", "pinkvilla", "ndtv movies", "cinema",
    "youtube", "netflix", "disney", "hotstar", "amazon prime",
  ],
  business: [
    "moneycontrol", "yahoo finance", "cnbc", "reuters", "mint",
    "economic times", "business", "outlook business", "fortune",
  ],
};

const IDEA_PROMPTS = {
  titles: (topic, news) =>
    `You are a YouTube content strategist for a Tamil creator. The trending topic is: "${topic}"\n\nRelated headlines:\n${news}\n\nGenerate 8 catchy, click-worthy YouTube video title ideas for this topic. Write the titles fully in Tamil (use Tamil script). Include a mix of styles: informational, opinion/reaction, explainer, listicle, and shorts-friendly. Format as a numbered list. Keep titles under 80 characters each.`,
  description: (topic, news) =>
    `You are a YouTube SEO expert for a Tamil creator. Trending topic: "${topic}"\n\nRelated headlines:\n${news}\n\nWrite a YouTube video description (300-400 words) optimized for this topic. Include:\n1. A strong hook in the first 2 lines\n2. Key points the video covers\n3. Relevant timestamps placeholder\n4. Call to action\n5. 15 relevant hashtags at the end\n\nWrite the description in Tamil. Use English only for technical terms, brand names, or hashtags where necessary.`,
  tags: (topic, news) =>
    `You are a YouTube SEO specialist. Trending topic in India: "${topic}"\n\nRelated headlines:\n${news}\n\nGenerate 30 YouTube tags/keywords for this topic. Include:\n- Primary keywords (exact match)\n- Long-tail keywords\n- Tamil keywords (in Tamil script)\n- Related trending terms\n- Common misspellings people search\n\nFormat: one tag per line, most important first. No # symbol.`,
  script: (topic, news) =>
    `You are a Tamil YouTube scriptwriter. Trending topic: "${topic}"\n\nRelated headlines:\n${news}\n\nWrite a short YouTube video script outline (for a 8-10 minute video) covering this trending topic. Include:\n1. Hook (first 30 seconds) — grab attention immediately\n2. Intro — context and why this matters\n3. Main content — 3-4 key points with talking points\n4. Personal opinion/take\n5. CTA and outro\n\nWrite the entire script in Tamil (Tamil script). Use English only for technical terms or brand names. Add [B-ROLL], [GRAPHIC], [CUT] notes for editing.`,
};

const IDEA_TABS = [
  { key: "titles", label: "Titles", icon: Type },
  { key: "description", label: "Description", icon: FileText },
  { key: "tags", label: "Tags", icon: Hash },
  { key: "script", label: "Script", icon: Lightbulb },
];

function classifySourceType(sources) {
  const lower = sources.map((s) => s.toLowerCase());
  const types = new Set();
  for (const [type, keywords] of Object.entries(SOURCE_MAP)) {
    if (lower.some((src) => keywords.some((kw) => src.includes(kw)))) {
      types.add(type);
    }
  }
  if (types.size === 0) types.add("news");
  return [...types];
}

function timeAgoShort(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TrafficBadge({ traffic }) {
  if (!traffic) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
      <Flame size={10} />
      {traffic}+
    </span>
  );
}

function TrendCard({ trend, index, onSelect, isSelected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(trend)}
      className={`w-full text-left rounded-xl border p-3 transition-all group ${
        isSelected
          ? "border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            index < 3
              ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm"
              : index < 6
              ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {trend.title}
            </h3>
            <TrafficBadge traffic={trend.traffic} />
          </div>
          {trend.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 leading-relaxed">
              {trend.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 inline-flex items-center gap-1">
              <Clock size={9} /> {timeAgoShort(trend.pubDate)}
            </span>
            {trend.sources?.slice(0, 2).map((src) => (
              <span
                key={src}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 truncate max-w-[6rem]"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
        {trend.picture && (
          <img
            src={trend.picture}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-700"
            loading="lazy"
          />
        )}
      </div>
    </button>
  );
}

function QuickAction({ icon: Icon, label, onClick, href, color = "gray" }) {
  const cls = {
    gray: "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
    red: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20",
    blue: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/20",
    purple: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/20",
  };
  const base = `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors bg-white dark:bg-gray-800 shadow-sm ${cls[color]}`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
        <Icon size={13} /> {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base}>
      <Icon size={13} /> {label}
    </button>
  );
}

function CreatorIdeas({ trend }) {
  const { isDark } = useDarkMode();
  const [activeTab, setActiveTab] = useState("titles");
  const [results, setResults] = useState({});
  const [generating, setGenerating] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setResults({});
    setActiveTab("titles");
  }, [trend?.id]);

  const generate = useCallback(
    async (tab) => {
      if (generating) return;

      const storedKey = localStorage.getItem("GEMINI_API_KEY_ENC");
      if (!storedKey) {
        toast.error("Add your Gemini API key in AI Chat → Settings");
        return;
      }

      let apiKey;
      try {
        const { decryptData } = await import("../../utils/encryption");
        apiKey = await decryptData(storedKey);
        if (!apiKey) throw new Error("decrypt");
      } catch {
        toast.error("Could not read API key. Re-save it in Settings.");
        return;
      }

      const newsContext = trend.news
        .map((n) => `- ${n.title} (${n.source})`)
        .join("\n");
      const prompt = IDEA_PROMPTS[tab](trend.title, newsContext || "No specific headlines available.");

      setGenerating(tab);
      setActiveTab(tab);

      try {
        const client = axios.create({
          baseURL: import.meta.env.VITE_API_URL,
          timeout: 120000,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const res = await client.post("/ai/assistant", {
          message: prompt,
          history: [],
          aiModel: "gemini-2.5-flash",
          apiKey,
        });
        setResults((prev) => ({ ...prev, [tab]: res.data?.response ?? "" }));
        setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 100);
      } catch (err) {
        toast.error(err.response?.data?.message || "Generation failed");
      } finally {
        setGenerating(null);
      }
    },
    [trend, generating],
  );

  const copyResult = (tab) => {
    const text = results[tab];
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="flex-shrink-0 px-4 sm:px-5 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Creator Toolkit
          </h3>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {IDEA_TABS.map(({ key, label, icon: Icon }) => {
            const hasResult = !!results[key];
            const isGenerating = generating === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => (hasResult ? setActiveTab(key) : generate(key))}
                disabled={!!generating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap disabled:opacity-60 ${
                  activeTab === key && hasResult
                    ? "bg-purple-600 text-white shadow-sm"
                    : hasResult
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                }`}
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                {label}
                {!hasResult && !isGenerating && (
                  <Sparkles size={9} className="text-purple-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 pb-4">
        {generating && !results[activeTab] ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Loader2 size={24} className="animate-spin text-purple-500 mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Generating {IDEA_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}…
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Analyzing "{trend.title}" for your channel
            </p>
          </div>
        ) : results[activeTab] ? (
          <div>
            <div className="flex items-center justify-end gap-2 mb-2">
              <button
                type="button"
                onClick={() => copyResult(activeTab)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Copy size={11} /> Copy
              </button>
              <button
                type="button"
                onClick={() => generate(activeTab)}
                disabled={!!generating}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            </div>
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(results[activeTab], isDark) }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles size={24} className="text-purple-400/60 mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Generate content ideas for your YouTube channel
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[16rem]">
              Click any tab above to generate AI-powered titles, descriptions, tags, or scripts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ trend, onUseInChat }) {
  if (!trend) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <TrendingUp size={28} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Select a trend to see details
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Click any topic on the left
        </p>
      </div>
    );
  }

  const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(trend.title)}`;
  const gtExplore = `https://trends.google.com/trends/explore?q=${encodeURIComponent(trend.title)}&geo=IN`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Topic header */}
      <div className="flex-shrink-0 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          {trend.picture && (
            <img
              src={trend.picture}
              alt=""
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-700"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {trend.title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <TrafficBadge traffic={trend.traffic} />
              <span className="text-xs text-gray-400 dark:text-gray-500 inline-flex items-center gap-1">
                <Clock size={11} /> {timeAgoShort(trend.pubDate)}
              </span>
            </div>
            {/* Quick actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <QuickAction icon={Youtube} label="YouTube" href={ytSearch} color="red" />
              <QuickAction icon={BarChart3} label="Trends" href={gtExplore} color="blue" />
              <QuickAction icon={MessageSquare} label="AI Chat" onClick={() => onUseInChat(trend)} color="purple" />
              <QuickAction
                icon={Copy}
                label="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(trend.title);
                  toast.success("Copied topic");
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed content: news + creator toolkit */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Related news — compact */}
        {trend.news.length > 0 && (
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-5 py-3 max-h-[180px] overflow-y-auto">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Related News
            </h3>
            <div className="space-y-1.5">
              {trend.news.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
                >
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1 flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {article.source}
                  </span>
                  <ExternalLink size={11} className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-blue-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Creator Toolkit */}
        <CreatorIdeas trend={trend} />
      </div>
    </div>
  );
}

function ChipButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Competitor Watch ────────────────────────────────────────── */

const COMP_PERIODS = [
  { value: "24h", label: "Last 24h", ms: 86_400_000 },
  { value: "7d", label: "Last 7 days", ms: 604_800_000 },
  { value: "all", label: "All", ms: Infinity },
];

const COMP_VIEW_FILTERS = [
  { value: 0, label: "All views" },
  { value: 25_000, label: "25K+" },
  { value: 50_000, label: "50K+" },
  { value: 100_000, label: "1 Lakh+" },
  { value: 500_000, label: "5 Lakh+" },
  { value: 1_000_000, label: "10 Lakh+" },
];

const COMP_SORTS = [
  { value: "views", label: "Most viewed" },
  { value: "latest", label: "Latest" },
];

function parsePublishedAgo(text) {
  if (!text) return Infinity;
  const cleaned = text.replace(/^Streamed\s+/i, "").replace(/^Premiered\s+/i, "");
  const m = cleaned.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!m) return Infinity;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const multipliers = {
    second: 1000,
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
  };
  return n * (multipliers[unit] || Infinity);
}

function formatViews(n) {
  if (n == null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function CompetitorVideoCard({ video }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
    >
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
        <img
          src={video.thumbnail}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-medium text-white">
            {video.duration}
          </span>
        )}
        {video.isLive && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-red-600 text-[10px] font-bold text-white inline-flex items-center gap-1">
            <Radio size={9} /> LIVE
          </span>
        )}
      </div>
      <div className="flex-1 p-3">
        <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {video.title}
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-600 dark:text-gray-300 truncate max-w-[8rem]">
            {video.channelName}
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="inline-flex items-center gap-0.5">
            <Eye size={9} /> {video.viewsText || formatViews(video.views)}
          </span>
          {video.publishedText && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="inline-flex items-center gap-0.5">
                <Clock size={9} /> {video.publishedText}
              </span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

function CompetitorWatch() {
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("24h");
  const [compSort, setCompSort] = useState("views");
  const [activeChannel, setActiveChannel] = useState("all");
  const [compSearch, setCompSearch] = useState("");
  const [minViews, setMinViews] = useState(25_000);

  const fetchVideos = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/competitors/videos");
      setVideos(data.videos || []);
      setChannels(data.channels || []);
    } catch {
      toast.error("Could not load competitor videos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const filtered = useMemo(() => {
    const periodMs = COMP_PERIODS.find((p) => p.value === period)?.ms || Infinity;
    let list = [...videos];

    if (periodMs !== Infinity) {
      list = list.filter((v) => {
        const agoMs = parsePublishedAgo(v.publishedText);
        return agoMs <= periodMs;
      });
    }

    if (activeChannel !== "all") {
      list = list.filter((v) => v.channelHandle === activeChannel);
    }

    if (minViews > 0) {
      list = list.filter((v) => (v.views || 0) >= minViews);
    }

    if (compSearch.trim()) {
      const q = compSearch.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }

    if (compSort === "views") {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      list.sort((a, b) => parsePublishedAgo(a.publishedText) - parsePublishedAgo(b.publishedText));
    }

    return list;
  }, [videos, period, activeChannel, compSearch, compSort, minViews]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-red-200 dark:border-red-800 border-t-red-600 dark:border-t-red-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Scanning competitor channels…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-2">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          {COMP_PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                period === p.value
                  ? "bg-red-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Clock size={10} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={compSearch}
            onChange={(e) => setCompSearch(e.target.value)}
            placeholder="Search videos…"
            className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 dark:focus:border-red-600 transition-colors"
          />
          {compSearch && (
            <button
              type="button"
              onClick={() => setCompSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 shadow-sm">
          <ArrowDownWideNarrow size={13} className="text-gray-400 dark:text-gray-500" />
          <select
            value={compSort}
            onChange={(e) => setCompSort(e.target.value)}
            className="text-[11px] font-medium bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            {COMP_SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline tabular-nums">
            {filtered.length} video{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => fetchVideos(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Channel chips + View filter */}
      <div className="flex-shrink-0 flex items-center gap-3 overflow-x-auto pb-0.5">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Users size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <ChipButton active={activeChannel === "all"} onClick={() => setActiveChannel("all")}>
            All Channels
          </ChipButton>
          {channels.map((ch) => (
            <ChipButton
              key={ch.handle}
              active={activeChannel === ch.handle}
              onClick={() => setActiveChannel(ch.handle)}
            >
              {ch.name}
            </ChipButton>
          ))}
        </div>
        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Eye size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          {COMP_VIEW_FILTERS.map((vf) => (
            <ChipButton key={vf.value} active={minViews === vf.value} onClick={() => setMinViews(vf.value)}>
              {vf.label}
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Play size={24} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No videos found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Try changing the time period or channel filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((video) => (
              <CompetitorVideoCard key={`${video.channelHandle}-${video.videoId}`} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */

const PAGE_TABS = [
  { key: "competitors", label: "Competitor Watch", icon: Youtube },
  { key: "trends", label: "Trending Topics", icon: TrendingUp },
];

export default function TrendPulse() {
  const navigate = useNavigate();
  const [activePageTab, setActivePageTab] = useState("competitors");
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("IN");
  const [sort, setSort] = useState("trending");
  const [sourceType, setSourceType] = useState("all");

  const fetchTrends = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const { data } = await api.get(`/trends?geo=${region}`);
        setTrends(data.trends || []);
        if (!silent && data.trends?.length) setSelected(data.trends[0]);
      } catch {
        toast.error("Could not load trending topics");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [region],
  );

  useEffect(() => {
    setSelected(null);
    fetchTrends();
  }, [fetchTrends]);

  const useInAIChat = useCallback(
    (trend) => {
      const newsContext = trend.news.map((n) => `• ${n.title}`).join("\n");
      navigate("/admin/ai-chat", {
        state: {
          sourceText: `Trending topic: ${trend.title}\nSearch volume: ${trend.traffic}+ searches\n\nRelated headlines:\n${newsContext}`,
        },
      });
    },
    [navigate],
  );

  const processed = useMemo(() => {
    let list = [...trends];

    if (sourceType !== "all") {
      list = list.filter((t) => {
        const types = classifySourceType(t.sources || []);
        return types.includes(sourceType);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.sources?.some((s) => s.toLowerCase().includes(q)),
      );
    }

    if (sort === "trending") {
      list.sort((a, b) => b.trafficNum - a.trafficNum);
    } else {
      list.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    }

    return list;
  }, [trends, search, sort, sourceType]);

  const activeRegion = REGIONS.find((r) => r.value === region);

  return (
    <AdminLayout title="TrendPulse" titleInfo="Trending topics & competitor analysis" icon={TrendingUp} contentFit>
      <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-[1600px] mx-auto gap-2">
        {/* ── Page Tabs ── */}
        <div className="flex-shrink-0 flex items-center border-b border-gray-200 dark:border-gray-700">
          {PAGE_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActivePageTab(key)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all relative ${
                activePageTab === key
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={15} />
              {label}
              {activePageTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {activePageTab === "trends" ? (
          <>
            {/* ── Toolbar row 1 ── */}
            <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
                {REGIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRegion(r.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      region === r.value
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <MapPin size={11} />
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search topics…"
                  className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 shadow-sm">
                <ArrowDownWideNarrow size={13} className="text-gray-400 dark:text-gray-500" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-[11px] font-medium bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live · {activeRegion?.short}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline tabular-nums">
                  {processed.length} topic{processed.length !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => fetchTrends(true)}
                  disabled={loading || refreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* ── Toolbar row 2: source chips ── */}
            <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <Filter size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              {SOURCE_TYPES.map((t) => (
                <ChipButton key={t.value} active={sourceType === t.value} onClick={() => setSourceType(t.value)}>
                  {t.label}
                </ChipButton>
              ))}
            </div>

            {/* ── Main ── */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading trends…</p>
                </div>
              </div>
            ) : trends.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <TrendingUp size={28} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No trends available</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try refreshing in a moment</p>
                <button
                  type="button"
                  onClick={() => fetchTrends()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
                {/* Left: trend list */}
                <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                    {processed.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Search size={20} className="text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No topics match your filters</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setSourceType("all");
                          }}
                          className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      processed.map((trend, idx) => (
                        <TrendCard
                          key={trend.id}
                          trend={trend}
                          index={idx}
                          onSelect={setSelected}
                          isSelected={selected?.id === trend.id}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Right: detail + creator toolkit */}
                <div className="hidden lg:flex flex-1 min-h-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
                  <DetailPanel trend={selected} onUseInChat={useInAIChat} />
                </div>
              </div>
            )}
          </>
        ) : (
          <CompetitorWatch />
        )}
      </div>
    </AdminLayout>
  );
}
