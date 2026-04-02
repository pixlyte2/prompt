const COMPETITORS = [
  { handle: "PolimerNews", name: "Polimer News" },
  { handle: "Sunnewstamil", name: "Sun News" },
  { handle: "NewsTamil24X7TV", name: "News Tamil 24x7" },
  { handle: "PuthiyaThalaimuraiTV", name: "Puthiya Thalaimurai" },
];

const CACHE_TTL = 15 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cache = { data: null, ts: 0 };

function parseRelativeTime(text) {
  if (!text) return null;
  const now = Date.now();
  const m = text.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const ms = {
    second: 1000,
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
  };
  return new Date(now - n * (ms[unit] || 0)).toISOString();
}

function parseViewCount(text) {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, "").replace(/\s*views?\s*/i, "").trim();
  const m = cleaned.match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return parseInt(cleaned, 10) || 0;
  const num = parseFloat(m[1]);
  const suffix = (m[2] || "").toUpperCase();
  if (suffix === "K") return Math.round(num * 1_000);
  if (suffix === "M") return Math.round(num * 1_000_000);
  if (suffix === "B") return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

const VIDEOS_PER_CHANNEL = 50;

function extractVideos(items, channel) {
  return items
    .map((item) => {
      const v = item?.richItemRenderer?.content?.videoRenderer;
      if (!v) return null;

      const viewText =
        v.viewCountText?.simpleText ||
        v.viewCountText?.runs?.map((r) => r.text).join("") ||
        "";
      const isLive = viewText.toLowerCase().includes("watching");

      return {
        videoId: v.videoId,
        title: v.title?.runs?.[0]?.text || "",
        views: isLive ? 0 : parseViewCount(viewText),
        viewsText: viewText,
        publishedText: v.publishedTimeText?.simpleText || "",
        publishedAt: parseRelativeTime(v.publishedTimeText?.simpleText),
        duration: v.lengthText?.simpleText || "",
        thumbnail:
          v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
          `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        channelName: channel.name,
        channelHandle: channel.handle,
        isLive,
      };
    })
    .filter(Boolean);
}

function getContinuationToken(items) {
  for (const item of items) {
    const token =
      item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand
        ?.token;
    if (token) return token;
  }
  return null;
}

async function fetchContinuation(token, apiKey) {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/json",
        "Accept-Language": "en",
      },
      body: JSON.stringify({
        context: {
          client: { clientName: "WEB", clientVersion: "2.20240101.00.00" },
        },
        continuation: token,
      }),
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const actions = data?.onResponseReceivedActions || [];
  for (const action of actions) {
    const items = action?.appendContinuationItemsAction?.continuationItems;
    if (items) return items;
  }
  return [];
}

async function scrapeChannel(channel) {
  const url = `https://www.youtube.com/@${channel.handle}/videos`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
  });
  if (!res.ok) return [];

  const html = await res.text();
  const match = html.match(/var ytInitialData\s*=\s*(\{.*?\});/s);
  if (!match) return [];

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = apiKeyMatch?.[1] || "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find((t) => t.tabRenderer?.title === "Videos");
  const items =
    videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  let videos = extractVideos(items, channel);

  if (videos.length < VIDEOS_PER_CHANNEL) {
    const token = getContinuationToken(items);
    if (token) {
      try {
        const moreItems = await fetchContinuation(token, apiKey);
        videos = videos.concat(extractVideos(moreItems, channel));
      } catch {
        /* use what we have */
      }
    }
  }

  return videos.slice(0, VIDEOS_PER_CHANNEL);
}

async function fetchAllCompetitors() {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  const results = await Promise.allSettled(
    COMPETITORS.map((ch) => scrapeChannel(ch)),
  );

  const videos = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  cache = { data: videos, ts: Date.now() };
  return videos;
}

exports.getCompetitorVideos = async (req, res) => {
  try {
    const videos = await fetchAllCompetitors();
    res.json({ videos, channels: COMPETITORS, fetchedAt: cache.ts });
  } catch (err) {
    console.error("Competitor scrape error:", err.message);
    res
      .status(502)
      .json({ message: "Could not fetch competitor videos. Try again later." });
  }
};
