/** @typedef {{ videoId: string, title: string, views: number, publishedText?: string, publishedAt?: string | null, duration?: string, videoFormat?: string, thumbnail?: string }} ScrapedVideo */

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

/** Long-form upload (Videos tab) — not a Short/reel row. Matches server scrape filters. */
export function isLongFormVideo(video) {
  if (!video) return false;
  if (video.videoFormat === "short") return false;
  if (String(video.duration || "").toLowerCase() === "short") return false;
  return true;
}

/** Absolute publish date for tooltips; prefers ISO `publishedAt`, else approximates from relative text. */
export function formatVideoPublishedDate(publishedAt, publishedText) {
  if (publishedAt) {
    const d = new Date(publishedAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  if (!publishedText) return null;
  const daysAgo = getDaysAgo(publishedText);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  const items = list.map((v, i) => {
    const isLongVideo = isLongFormVideo(v);
    return {
      videoId: v.videoId,
      title: v.title || "",
      thumbnail: v.thumbnail,
      publishedText: v.publishedText || "",
      publishedAt: v.publishedAt || null,
      isLongVideo,
      publishedDateLabel: isLongVideo
        ? formatVideoPublishedDate(v.publishedAt, v.publishedText)
        : null,
      views: v.views || 0,
      uploadOrder: i + 1,
      chartLabel: `#${i + 1}`,
      pct: Math.round(((v.views || 0) / maxViews) * 100),
    };
  });
  return {
    items,
    maxViews,
    totalViews,
    avgViews: list.length > 0 ? Math.round(totalViews / list.length) : 0,
    count: list.length,
  };
}

/** Head-to-head upload performance for channel compare (paired by upload order, #1 = newest). */
export function buildCompareUploadsPerformance(videosA, videosB, limit = 30) {
  const listA = sortVideosByRecent(videosA).slice(0, limit);
  const listB = sortVideosByRecent(videosB).slice(0, limit);
  const count = Math.max(listA.length, listB.length);

  const totalA = listA.reduce((s, v) => s + (v.views || 0), 0);
  const totalB = listB.reduce((s, v) => s + (v.views || 0), 0);
  const avgA = listA.length > 0 ? Math.round(totalA / listA.length) : 0;
  const avgB = listB.length > 0 ? Math.round(totalB / listB.length) : 0;

  const maxViews = Math.max(
    1,
    ...listA.map((v) => v.views || 0),
    ...listB.map((v) => v.views || 0),
  );

  const items = Array.from({ length: count }, (_, i) => ({
    chartLabel: `#${i + 1}`,
    uploadOrder: i + 1,
    viewsA: listA[i] != null ? listA[i].views || 0 : null,
    viewsB: listB[i] != null ? listB[i].views || 0 : null,
  }));

  return { items, maxViews, totalA, totalB, avgA, avgB, count };
}

export const COMPARE_SAMPLE_LIMITS = [10, 50, 100, 200, 500];

export function computeMedianViews(videos) {
  const views = (videos || []).map((v) => v.views || 0).sort((a, b) => a - b);
  if (views.length === 0) return 0;
  const mid = Math.floor(views.length / 2);
  if (views.length % 2 === 0) return Math.round((views[mid - 1] + views[mid]) / 2);
  return views[mid];
}

/** Per-sample-size stats for channel comparison (client-side from scraped videos). */
export function computeCompareSampleStats(videos, limits = COMPARE_SAMPLE_LIMITS) {
  const sorted = sortVideosByRecent(videos);
  const scrapedCount = sorted.length;

  return limits.map((limit) => {
    const sample = sorted.slice(0, limit);
    const stats = computeDashboardStats(sample);
    const topVideo = buildTopVideosByViews(sample, 1)[0];
    return {
      limit,
      videoCount: stats.videoCount,
      totalViews: stats.totalViews,
      avgViews: stats.avgViews,
      bestVideoViews: topVideo?.views || 0,
      medianViews: computeMedianViews(sample),
      scrapedCount,
    };
  });
}
