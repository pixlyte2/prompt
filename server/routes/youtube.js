const express = require('express');
const router = express.Router();
const https = require('https');
const { getSubtitles } = require('youtube-captions-scraper');
const ytdl = require('@distube/ytdl-core');
const { protect } = require('../middleware/authMiddleware');

// Fetch a URL and return parsed JSON — no extra deps needed
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { reject(new Error('Invalid JSON from ' + url)); }
      });
    }).on('error', reject);
  });
}

// Build a best-effort payload from YouTube oEmbed + noembed data
async function fetchViaOembed(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  // oEmbed gives title, author_name, thumbnail_url, html
  const oembed = await fetchJson(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
  if (oembed.status !== 200) throw new Error('oEmbed failed: ' + oembed.status);
  const o = oembed.body;

  // Build thumbnail bundle from known YouTube CDN patterns
  const thumbs = [
    { url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 },
    { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,     width: 480,  height: 360 },
    { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,     width: 320,  height: 180 },
    { url: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,     width: 640,  height: 480 },
  ];
  const thumbBundle = buildThumbnailBundle(thumbs);

  return {
    videoId,
    title: o.title || null,
    description: null,
    shortDescription: null,
    lengthSeconds: null,
    lengthFormatted: null,
    viewCount: null,
    viewCountCompact: null,
    likeCount: null,
    likeCountCompact: null,
    commentCount: null,
    commentCountCompact: null,
    publishedRaw: null,
    publishedAtFormatted: null,
    isLive: false,
    isUpcoming: false,
    isPrivate: false,
    isUnlisted: false,
    isFamilySafe: null,
    isRemixContent: null,
    category: null,
    tags: [],
    defaultLanguage: null,
    defaultAudioLanguage: null,
    channel: {
      id: null,
      name: o.author_name || null,
      userId: null,
      url: o.author_url || null,
    },
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    embedHtml: o.html || null,
    thumbnails: thumbBundle,
    _source: 'oembed',
  };
}

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function extractVideoIdFromInput(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  // Direct video ID
  if (VIDEO_ID_REGEX.test(trimmed)) return trimmed;
  
  // Try ytdl-core first
  try {
    if (ytdl.validateURL(trimmed)) {
      return ytdl.getVideoID(trimmed);
    }
  } catch (e) {
    console.log('ytdl validation failed:', e.message);
  }
  
  // Enhanced regex patterns for various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/([a-zA-Z0-9_-]{11})(?:[?&]|$)/
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && VIDEO_ID_REGEX.test(match[1])) {
      return match[1];
    }
  }
  
  return null;
}

function formatYyyymmdd(ymd) {
  if (!ymd || String(ymd).length !== 8) return ymd;
  const s = String(ymd);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function formatDurationSec(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }
  return `${m}:${String(r).padStart(2, '0')}`;
}

function formatCompactNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function buildThumbnailBundle(thumbnails) {
  const list = (thumbnails || [])
    .filter((t) => t && t.url)
    .map((t) => ({
      url: t.url,
      width: t.width != null ? Number(t.width) : null,
      height: t.height != null ? Number(t.height) : null
    }))
    .sort((a, b) => (b.width || 0) - (a.width || 0));

  if (list.length === 0) {
    return { all: [], highDefinition: null, standardDefinition: null, largest: null };
  }
  const largest = list[0];
  const highDefinition = list.find((t) => t.width && t.width >= 1280) || largest;
  const le640 = list.filter((t) => t.width && t.width <= 640);
  const standardDefinition = le640.length
    ? le640.sort((a, b) => (b.width || 0) - (a.width || 0))[0]
    : list[list.length - 1];

  return { all: list, highDefinition, standardDefinition, largest };
}

function mapVideoInspectPayload(info) {
  const d = info.videoDetails || {};
  const videoId = d.videoId;
  const thumbs = buildThumbnailBundle(d.thumbnails);
  const description = d.description || d.shortDescription || '';
  const keywords = Array.isArray(d.keywords) ? d.keywords : [];

  return {
    videoId,
    title: d.title || null,
    description: description || null,
    shortDescription: d.shortDescription != null ? d.shortDescription : null,
    lengthSeconds: d.lengthSeconds != null ? Number(d.lengthSeconds) : null,
    lengthFormatted: d.lengthSeconds != null ? formatDurationSec(d.lengthSeconds) : null,
    viewCount: d.viewCount != null ? String(d.viewCount) : null,
    viewCountCompact: formatCompactNumber(d.viewCount),
    likeCount: d.likeCount != null ? String(d.likeCount) : null,
    likeCountCompact: formatCompactNumber(d.likeCount),
    dislikeCount: d.dislikeCount != null ? String(d.dislikeCount) : null,
    commentCount: d.commentCount != null ? String(d.commentCount) : null,
    commentCountCompact: formatCompactNumber(d.commentCount),
    publishedRaw: d.publishDate || d.uploadDate || null,
    publishedAtFormatted: d.publishDate ? formatYyyymmdd(d.publishDate) : d.uploadDate ? formatYyyymmdd(d.uploadDate) : null,
    isLive: Boolean(d.isLive),
    isUpcoming: Boolean(d.isUpcoming),
    isPrivate: Boolean(d.isPrivate),
    isUnlisted: Boolean(d.isUnlisted),
    isFamilySafe: d.isFamilySafe,
    isRemixContent: d.isRemixContent,
    category: d.category || null,
    tags: keywords,
    defaultLanguage: d.defaultLanguage != null ? d.defaultLanguage : null,
    defaultAudioLanguage: d.defaultAudioLanguage != null ? d.defaultAudioLanguage : null,
    channel: {
      id: d.channelId != null ? d.channelId : null,
      name: typeof d.author === 'object' && d.author !== null
        ? (d.author.name || d.ownerChannelName || null)
        : (d.author != null ? String(d.author) : (d.ownerChannelName != null ? d.ownerChannelName : null)),
      userId: typeof d.author === 'object' && d.author !== null
        ? (d.author.user || d.author.id || null)
        : (d.authorId != null ? d.authorId : null),
      url: typeof d.author === 'object' && d.author !== null
        ? (d.author.channel_url || d.author.user_url || (d.channelId ? `https://www.youtube.com/channel/${d.channelId}` : null))
        : (d.channelId ? `https://www.youtube.com/channel/${d.channelId}` : null)
    },
    watchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
    embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
    embedHtml: videoId
      ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
      : null,
    thumbnails: thumbs
  };
}

/**
 * Lightweight in-memory cache for /inspect responses.
 * Avoids hammering YouTube (and re-running ytdl-core's signature decode,
 * which writes *-player-script.js files to CWD) when the same video is
 * inspected multiple times in quick succession.
 */
const INSPECT_CACHE_TTL_MS = 5 * 60 * 1000;
const INSPECT_CACHE_MAX = 200;
const inspectCache = new Map();
const inspectInflight = new Map();

function readInspectCache(key) {
  const entry = inspectCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > INSPECT_CACHE_TTL_MS) {
    inspectCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeInspectCache(key, value) {
  inspectCache.set(key, { at: Date.now(), value });
  if (inspectCache.size > INSPECT_CACHE_MAX) {
    const oldest = inspectCache.keys().next().value;
    if (oldest !== undefined) inspectCache.delete(oldest);
  }
}

// Deep inspection of a single public video (metadata only)
router.post('/inspect', protect, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ message: 'YouTube URL is required' });
    }
    const videoId = extractVideoIdFromInput(url);
    if (!videoId) {
      return res.status(400).json({ message: 'Could not read a valid YouTube video ID from that URL' });
    }

    const cached = readInspectCache(videoId);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Validate URL first
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ message: 'Invalid YouTube URL format' });
    }

    // De-duplicate concurrent requests for the same video
    let infoPromise = inspectInflight.get(videoId);
    if (!infoPromise) {
      // Try basic info first, then full info if needed
      infoPromise = (async () => {
        try {
          // First try getBasicInfo which is more reliable
          const basicInfo = await ytdl.getBasicInfo(videoUrl);
          
          // If basic info works, try to get full info for additional metadata
          try {
            const fullInfo = await ytdl.getInfo(videoUrl);
            return fullInfo;
          } catch (fullInfoError) {
            console.log('Full info failed, using basic info:', fullInfoError.message);
            return basicInfo;
          }
        } catch (basicInfoError) {
          // If basic info fails, throw the error
          throw basicInfoError;
        }
      })().finally(() => {
        inspectInflight.delete(videoId);
      });
      inspectInflight.set(videoId, infoPromise);
    }

    let info;
    try {
      info = await infoPromise;
    } catch (e) {
      console.error('ytdl.getInfo error for videoId:', videoId, e.message);
      const msg = e && e.message ? e.message : '';

      // On cloud/Vercel ytdl often gets bot-blocked — fall back to oEmbed
      try {
        console.log('Falling back to oEmbed for videoId:', videoId);
        const fallback = await fetchViaOembed(videoId);
        writeInspectCache(videoId, fallback);
        return res.json({ ...fallback, cached: false });
      } catch (oembedErr) {
        console.error('oEmbed fallback also failed:', oembedErr.message);
      }

      if (/private|sign in|login/i.test(msg)) {
        return res.status(403).json({ message: 'This video is private or requires sign-in' });
      }
      if (/age|restricted|mature/i.test(msg)) {
        return res.status(403).json({ message: 'This video is age-restricted and cannot be loaded' });
      }
      if (/unavailable|not.*available|removed|deleted/i.test(msg)) {
        return res.status(404).json({ message: 'Video is unavailable in this region or has been removed' });
      }
      if (/blocked|copyright/i.test(msg)) {
        return res.status(403).json({ message: 'Video is blocked due to copyright restrictions' });
      }
      if (/quota|rate.*limit/i.test(msg)) {
        return res.status(429).json({ message: 'Rate limit exceeded. Please try again later' });
      }
      if (/network|timeout|connect/i.test(msg)) {
        return res.status(503).json({ message: 'Network error. Please check your connection and try again' });
      }

      const errorMsg = process.env.NODE_ENV === 'development'
        ? `Video not found: ${msg}`
        : 'Video not found or could not be loaded';
      return res.status(404).json({ message: errorMsg });
    }

    const payload = mapVideoInspectPayload(info);
    writeInspectCache(videoId, payload);
    return res.json({ ...payload, cached: false });
  } catch (error) {
    console.error('YouTube inspect error:', error);
    return res.status(500).json({
      message: 'Failed to load video details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get YouTube video captions
router.post('/captions', protect, async (req, res) => {
  try {
    const { videoId, lang } = req.body || {};

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    if (!VIDEO_ID_REGEX.test(videoId)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }

    const language = typeof lang === 'string' && lang.trim() ? lang.trim() : 'en';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      const info = await ytdl.getBasicInfo(videoUrl);
      if (!info) {
        return res.status(404).json({ message: 'Video not found' });
      }
    } catch (error) {
      console.error('Video info error:', error);
      return res.status(404).json({ message: 'Video not found or is private/restricted' });
    }

    try {
      const captions = await getSubtitles({ videoID: videoId, lang: language });

      if (!captions || captions.length === 0) {
        try {
          const autoCaptions = await getSubtitles({ videoID: videoId, lang: language, auto: true });

          if (!autoCaptions || autoCaptions.length === 0) {
            return res.status(404).json({ message: 'No captions available for this video' });
          }

          const captionText = autoCaptions.map((caption) => caption.text).join(' ');
          return res.json({
            captions: captionText,
            type: 'auto-generated',
            language
          });
        } catch (autoError) {
          console.error('Auto captions error:', autoError);
          return res.status(404).json({ message: 'No captions available for this video' });
        }
      }

      const captionText = captions.map((caption) => caption.text).join(' ');
      return res.json({
        captions: captionText,
        type: 'manual',
        language
      });
    } catch (captionError) {
      console.error('Caption fetch error:', captionError);

      if (captionError.message?.includes('private')) {
        return res.status(403).json({ message: 'Video is private or restricted' });
      }
      if (captionError.message?.includes('not found')) {
        return res.status(404).json({ message: 'Video not found' });
      }
      return res.status(404).json({ message: 'No captions available for this video' });
    }
  } catch (error) {
    console.error('YouTube captions API error:', error);
    res.status(500).json({
      message: 'Failed to fetch captions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
