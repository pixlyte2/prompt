/** @typedef {{ videoId: string, title: string, views: number, publishedText?: string, duration?: string, videoFormat?: string, thumbnail?: string }} ScrapedVideo */

export const SCRAPE_VIDEO_CAP = 500;

export function getDaysAgo(publishedText) {
  if (!publishedText || typeof publishedText !== "string") return 365;
  const cleaned = publishedText.replace(/^Streamed\s+/i, "").replace(/^Premiered\s+/i, "");
  const m = cleaned.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!m) return 365;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("second") || unit.startsWith("minute") || unit.startsWith("hour")) return 0;
  if (unit.startsWith("day")) return n;
  if (unit.startsWith("week")) return n * 7;
  if (unit.startsWith("month")) return n * 30;
  if (unit.startsWith("year")) return n * 365;
  return 365;
}

export function formatCompact(n) {
  if (n == null || Number.isNaN(n)) return "0";
  const v = Number(n);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString("en-US");
}

/** Y-axis ceiling from peak views — tight scale so max bar sits near the top (not padded to 80K when peak is 63K). */
export function computeViewsAxisMax(peakViews, extraPeak = 0) {
  const peak = Math.max(Number(peakViews) || 0, Number(extraPeak) || 0, 1);
  const padded = peak * 1.06;
  if (padded >= 1_000_000) return Math.ceil(padded / 50_000) * 50_000;
  if (padded >= 100_000) return Math.ceil(padded / 10_000) * 10_000;
  if (padded >= 10_000) return Math.ceil(padded / 2_000) * 2_000;
  if (padded >= 1_000) return Math.ceil(padded / 200) * 200;
  if (padded >= 100) return Math.ceil(padded / 20) * 20;
  return Math.ceil(padded);
}

export function computeDashboardStats(videos) {
  const list = videos || [];
  const videoCount = list.length;
  const totalViews = list.reduce((acc, v) => acc + (v.views || 0), 0);
  const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
  const uploads30d = list.filter((v) => getDaysAgo(v.publishedText) <= 30).length;
  const uploads7d = list.filter((v) => getDaysAgo(v.publishedText) <= 7).length;
  const views30d = list
    .filter((v) => getDaysAgo(v.publishedText) <= 30)
    .reduce((s, v) => s + (v.views || 0), 0);
  const views7d = list
    .filter((v) => getDaysAgo(v.publishedText) <= 7)
    .reduce((s, v) => s + (v.views || 0), 0);
  return { videoCount, totalViews, avgViews, uploads30d, uploads7d, views30d, views7d };
}

/** Daily timeline: views and upload counts by publish day in the selected range. */
export function buildDailyTimeline(videos, dateRange) {
  const pointsCount = dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 28;

  const timeline = Array.from({ length: pointsCount }, (_, i) => {
    const day = pointsCount - 1 - i;
    const date = new Date();
    date.setDate(date.getDate() - day);
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dayIndex: day,
      views: 0,
      uploads: 0,
    };
  });

  (videos || []).forEach((v) => {
    const daysAgo = getDaysAgo(v.publishedText);
    if (daysAgo >= pointsCount) return;
    const point = timeline.find((p) => p.dayIndex === daysAgo);
    if (point) {
      point.views += v.views || 0;
      point.uploads += 1;
    }
  });

  return timeline;
}

/**
 * One point per scraped video (newest → oldest), for area chart — no dates on X axis.
 */
export function buildVideoViewsSeries(videos) {
  return sortVideosByRecent(videos).map((v, i) => ({
    index: i + 1,
    views: v.views || 0,
    title: v.title || v.videoId || "",
    videoId: v.videoId,
  }));
}

/** Weekly upload counts (last N weeks) */
export function buildWeeklyUploads(videos, weeks = 12) {
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const endDay = i * 7;
    const startDay = endDay + 7;
    return {
      label: i === 0 ? "This week" : `${i}w ago`,
      weekIndex: i,
      startDay,
      endDay,
      uploads: 0,
      views: 0,
    };
  });

  (videos || []).forEach((v) => {
    const d = getDaysAgo(v.publishedText);
    const bucket = buckets.find((b) => d >= b.endDay && d < b.startDay);
    if (bucket) {
      bucket.uploads += 1;
      bucket.views += v.views || 0;
    }
  });

  return [...buckets].reverse();
}

/** View count distribution buckets */
export function buildViewsDistribution(videos) {
  const buckets = [
    { label: "<10K", min: 0, max: 10_000, count: 0 },
    { label: "10K–100K", min: 10_000, max: 100_000, count: 0 },
    { label: "100K–1M", min: 100_000, max: 1_000_000, count: 0 },
    { label: "1M+", min: 1_000_000, max: Infinity, count: 0 },
  ];
  (videos || []).forEach((v) => {
    const views = v.views || 0;
    const b = buckets.find((x) => views >= x.min && views < x.max);
    if (b) b.count += 1;
  });
  return buckets;
}

export function sortVideosByRecent(videos) {
  return [...(videos || [])].sort((a, b) => getDaysAgo(a.publishedText) - getDaysAgo(b.publishedText));
}

/** Highest view counts first (for leaderboard). */
export function buildTopVideosByViews(videos, limit = 10) {
  return [...(videos || [])]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
}

/** Newest uploads first, with view performance metrics (default: last 30). */
export function buildLastUploadedPerformance(videos, limit = 30) {
  const list = sortVideosByRecent(videos).slice(0, limit);
  const maxViews = Math.max(1, ...list.map((v) => v.views || 0));
  const totalViews = list.reduce((s, v) => s + (v.views || 0), 0);
  const items = list.map((v, i) => ({
    videoId: v.videoId,
    title: v.title || "",
    thumbnail: v.thumbnail,
    publishedText: v.publishedText || "",
    views: v.views || 0,
    uploadOrder: i + 1,
    chartLabel: `#${i + 1}`,
    pct: Math.round(((v.views || 0) / maxViews) * 100),
  }));
  return {
    items,
    maxViews,
    totalViews,
    avgViews: list.length > 0 ? Math.round(totalViews / list.length) : 0,
    count: list.length,
  };
}
