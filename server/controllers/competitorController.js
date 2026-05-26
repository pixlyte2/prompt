const CompetitorType = require("../models/CompetitorType");

const CACHE_TTL = 15 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const cacheMap = new Map();

const DEFAULT_SEED = {
  name: "News",
  videosPerChannel: 200,
  channels: [
    { handle: "PolimerNews", name: "Polimer News" },
    { handle: "Sunnewstamil", name: "Sun News" },
    { handle: "NewsTamil24X7TV", name: "News Tamil 24x7" },
    { handle: "PuthiyaThalaimuraiTV", name: "Puthiya Thalaimurai" },
  ],
};

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

function parseSubscriberCount(text) {
  if (!text) return 0;
  const cleaned = text.replace(/subscribers/i, "").trim();
  const m = cleaned.match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return parseInt(cleaned, 10) || 0;
  const num = parseFloat(m[1]);
  const suffix = (m[2] || "").toUpperCase();
  if (suffix === "K") return Math.round(num * 1_000);
  if (suffix === "M") return Math.round(num * 1_000_000);
  if (suffix === "B") return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

function parseDuration(text) {
  if (!text || text.toLowerCase().includes("short") || text.toLowerCase().includes("live")) return 0;
  const parts = text.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

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

function extractVideos(items, channel, videoFormat) {
  return items
    .map((item) => {
      const v = item?.richItemRenderer?.content?.videoRenderer || item?.richItemRenderer?.content?.reelItemRenderer;
      const s = item?.richItemRenderer?.content?.shortsLockupViewModel;
      const l = item?.richItemRenderer?.content?.lockupViewModel;

      if (!v && !s && !l) return null;

      if (l) {
        const videoId = l.contentId;
        if (!videoId) return null;

        const metadataModel = l.metadata?.lockupMetadataViewModel;
        const title = metadataModel?.title?.content || "";
        
        const metadataParts = metadataModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts || [];
        const viewText = metadataParts[0]?.text?.content || "";
        const publishedText = metadataParts[1]?.text?.content || "";
        const isLive = viewText.toLowerCase().includes("watching") || viewText.toLowerCase().includes("live");

        const overlays = l.contentImage?.thumbnailViewModel?.overlays || [];
        const bottomOverlay = overlays.find(o => o.thumbnailBottomOverlayViewModel)?.thumbnailBottomOverlayViewModel;
        const durationText = bottomOverlay?.badges?.[0]?.thumbnailBadgeViewModel?.text || "";

        return {
          videoId,
          title,
          views: isLive ? 0 : parseViewCount(viewText),
          viewsText: viewText,
          publishedText: publishedText,
          publishedAt: parseRelativeTime(publishedText),
          duration: durationText,
          thumbnail:
            l.contentImage?.thumbnailViewModel?.image?.sources?.slice(-1)[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          channelName: channel.name,
          channelHandle: channel.handle,
          isLive,
          videoFormat: videoFormat || "long",
        };
      }

      if (s) {
        const videoId = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
        if (!videoId) return null;

        const title = s.overlayMetadata?.primaryText?.content || "";
        const viewText = s.overlayMetadata?.secondaryText?.content || "";
        const viewParts = viewText.toLowerCase().includes("watching");

        return {
          videoId,
          title,
          views: viewParts ? 0 : parseViewCount(viewText),
          viewsText: viewText,
          publishedText: "",
          publishedAt: null,
          duration: "Short",
          thumbnail:
            s.thumbnailViewModel?.thumbnailViewModel?.image?.sources?.slice(-1)[0]?.url ||
            s.onTap?.innertubeCommand?.reelWatchEndpoint?.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          channelName: channel.name,
          channelHandle: channel.handle,
          isLive: viewParts,
          videoFormat: videoFormat || "short",
        };
      }

      const title = v.title?.runs?.[0]?.text || v.headline?.simpleText || "";
      const viewText =
        v.viewCountText?.simpleText ||
        v.viewCountText?.runs?.map((r) => r.text).join("") ||
        "";
      const isLive = viewText.toLowerCase().includes("watching");

      return {
        videoId: v.videoId,
        title: title,
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
        videoFormat: videoFormat || "long",
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

async function scrapeChannel(channel, maxVideos, videoFormat = "long") {
  const endpoint = videoFormat === "short" ? "shorts" : "videos";
  const url = `https://www.youtube.com/@${channel.handle}/${endpoint}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
  });
  if (!res.ok) return { videos: [], subscribers: 0, handle: channel.handle };

  const html = await res.text();
  const match = html.match(/var ytInitialData\s*=\s*(\{.*?\});/s);
  if (!match) return { videos: [], subscribers: 0, handle: channel.handle };

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return { videos: [], subscribers: 0, handle: channel.handle };
  }

  // Parse subscriber count
  let subscribers = 0;
  const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
  if (header) {
    let subText = "";
    if (header.subscriberCountText?.simpleText) {
      subText = header.subscriberCountText.simpleText;
    } else if (header.contentMetadata?.metadataRows) {
      const parts = header.contentMetadata.metadataRows[0]?.metadataParts || [];
      const part = parts.find(p => p.text?.content?.toLowerCase().includes("subscriber"));
      if (part) {
        subText = part.text.content;
      }
    }
    if (subText) {
      subscribers = parseSubscriberCount(subText);
    }
  }

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = apiKeyMatch?.[1];

  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const tabName = videoFormat === "short" ? "Shorts" : "Videos";
  
  // Find the requested tab by exact title or fallback to the one already selected (since we navigated specifically to /shorts or /videos)
  let activeTab = tabs.find((t) => t.tabRenderer?.title === tabName);
  if (!activeTab || !activeTab.tabRenderer?.content) {
    activeTab = tabs.find((t) => t.tabRenderer?.selected);
  }

  const items = activeTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  let videos = extractVideos(items, channel, videoFormat);

  // Filter for 'Long' format: only videos less than 9 minutes (540 seconds)
  if (videoFormat === "long") {
    videos = videos.filter((v) => {
      const sec = parseDuration(v.duration);
      return sec > 0 && sec < 540;
    });
  }

  if (videos.length === 0 && videoFormat !== "long") {
    return scrapeChannel(channel, maxVideos, "long");
  }

  let contToken = apiKey ? getContinuationToken(items) : null;

  while (videos.length < maxVideos && contToken) {
    try {
      const moreItems = await fetchContinuation(contToken, apiKey);
      let newVideos = extractVideos(moreItems, channel, videoFormat);
      if (newVideos.length === 0) break;

      if (videoFormat === "long") {
        newVideos = newVideos.filter((v) => {
          const sec = parseDuration(v.duration);
          return sec > 0 && sec < 540;
        });
      }

      videos = videos.concat(newVideos);
      contToken = getContinuationToken(moreItems);
    } catch {
      break;
    }
  }

  return { videos: videos.slice(0, maxVideos), subscribers, handle: channel.handle };
}

async function seedDefaultType() {
  const count = await CompetitorType.countDocuments();
  if (count === 0) {
    await CompetitorType.create(DEFAULT_SEED);
  }
}

async function fetchVideosForType(typeId, videoFormat) {
  const cacheKey = videoFormat ? `${typeId}_${videoFormat}` : typeId;
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;

  const type = await CompetitorType.findById(typeId).lean();
  if (!type) return null;

  const maxVideos = type.videosPerChannel || 30;

  const promises = type.channels.flatMap((ch) => {
    if (videoFormat === "all") {
      return [
        scrapeChannel(ch, maxVideos, "long"),
        scrapeChannel(ch, maxVideos, "short")
      ];
    }
    const formatToScrape = (videoFormat === "long" || videoFormat === "short")
      ? videoFormat
      : (ch.videoFormat || "long");
    return [scrapeChannel(ch, maxVideos, formatToScrape)];
  });

  const results = await Promise.allSettled(promises);

  const videos = [];
  const subsMap = {};

  results.forEach((r) => {
    if (r.status === "fulfilled" && r.value) {
      const { videos: chanVideos, subscribers, handle } = r.value;
      if (chanVideos) {
        videos.push(...chanVideos);
      }
      if (subscribers && handle) {
        const lowerH = handle.toLowerCase();
        subsMap[lowerH] = Math.max(subsMap[lowerH] || 0, subscribers);
      }
    }
  });

  const channelsWithSubs = type.channels.map((ch) => ({
    ...ch,
    subscribers: subsMap[ch.handle.toLowerCase()] || 0,
  }));

  const entry = { videos, channels: channelsWithSubs, ts: Date.now() };
  cacheMap.set(cacheKey, entry);
  return entry;
}

exports.clearCache = (typeId) => {
  if (typeId) {
    for (const key of cacheMap.keys()) {
      if (key === typeId || key.startsWith(`${typeId}_`)) {
        cacheMap.delete(key);
      }
    }
  } else {
    cacheMap.clear();
  }
};

exports.getCompetitorVideos = async (req, res) => {
  try {
    await seedDefaultType();

    const { typeId, force, videoFormat } = req.query;
    if (!typeId) {
      return res.status(400).json({ message: "typeId query parameter is required" });
    }

    if (force === "true") {
      exports.clearCache(typeId);
    }

    const result = await fetchVideosForType(typeId, videoFormat);
    if (!result) {
      return res.status(404).json({ message: "Competitor type not found" });
    }

    res.json({
      videos: result.videos,
      channels: result.channels,
      fetchedAt: result.ts,
    });
  } catch (err) {
    console.error("Competitor scrape error:", err.message);
    res
      .status(502)
      .json({ message: "Could not fetch competitor videos. Try again later. " });
  }
};
