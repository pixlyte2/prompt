const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { XMLParser } = require('fast-xml-parser');
const { getSubtitles } = require('youtube-captions-scraper');
const ytdl = require('@distube/ytdl-core');
const { protect } = require('../middleware/authMiddleware');

const YT_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8',
  Origin: 'https://www.youtube.com',
  Referer: 'https://www.youtube.com/',
};

// Caption fetches must NOT send Origin — server-side Origin with a signed URL
// causes YouTube to reject the request with an empty body or HTML error page.
const CAPTION_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://www.youtube.com/',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

const INNERTUBE_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20250201.00.00',
  hl: 'en',
  gl: 'US',
};

let poTokenCache = null;
let poTokenCacheAt = 0;
const PO_TOKEN_TTL_MS = 30 * 60 * 1000;

const CAPTION_LANG_FALLBACKS = ['ta', 'hi', 'en'];

function isAutoCaptionLang(lang) {
  return !lang || lang === 'auto';
}

// Fetch a URL and return parsed JSON — no extra deps needed
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: YT_FETCH_HEADERS }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { reject(new Error('Invalid JSON from ' + url)); }
      });
    }).on('error', reject);
  });
}

function fetchText(url, extraHeaders = {}, _redirects = 0) {
  return new Promise((resolve, reject) => {
    if (_redirects > 5) return reject(new Error('Too many redirects: ' + url));
    https.get(url, { headers: { ...YT_FETCH_HEADERS, ...extraHeaders } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(fetchText(res.headers.location, extraHeaders, _redirects + 1));
      }
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    }).on('error', reject);
  });
}

// Fetch with explicitly provided headers only (no YT_FETCH_HEADERS merging).
// Properly resolves relative redirect URLs and handles HTTP→HTTPS hops.
function fetchTextWithHeaders(url, headers, _redirects = 0) {
  return new Promise((resolve, reject) => {
    if (_redirects > 5) return reject(new Error('Too many redirects: ' + url));

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return reject(new Error('Invalid URL: ' + url));
    }

    const transport = parsedUrl.protocol === 'http:' ? http : https;
    transport.get(url, { headers }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        let next;
        try { next = new URL(res.headers.location, url).href; }
        catch { next = res.headers.location; }
        return resolve(fetchTextWithHeaders(next, headers, _redirects + 1));
      }
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    }).on('error', reject);
  });
}

function postJson(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        ...YT_FETCH_HEADERS,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...extraHeaders,
      },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function transcriptXmlToText(xml) {
  if (!xml || typeof xml !== 'string') return '';
  const parsed = xmlParser.parse(xml);

  // Plain transcript format: <transcript><text>...</text></transcript>
  const transcriptNodes = parsed?.transcript?.text;
  if (transcriptNodes) {
    const list = Array.isArray(transcriptNodes) ? transcriptNodes : [transcriptNodes];
    const text = list
      .map((node) => {
        if (typeof node === 'string') return decodeHtmlEntities(node);
        if (node && typeof node === 'object') {
          return decodeHtmlEntities(node['#text'] || node.text || '');
        }
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) return text;
  }

  // srv3/timedtext format: <timedtext><body><p>...</p></body></timedtext>
  const pNodes = parsed?.timedtext?.body?.p;
  if (pNodes) {
    const list = Array.isArray(pNodes) ? pNodes : [pNodes];
    const text = list
      .map((node) => {
        if (typeof node === 'string') return decodeHtmlEntities(node);
        if (node && typeof node === 'object') {
          // <p> may contain <s> children or direct #text
          const segs = node.s
            ? (Array.isArray(node.s) ? node.s : [node.s]).map((s) =>
                typeof s === 'string' ? s : (s?.['#text'] || '')
              )
            : [];
          const direct = node['#text'] || '';
          return decodeHtmlEntities(segs.join('') || direct);
        }
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) return text;
  }

  return '';
}

function transcriptJson3ToText(raw) {
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return '';
    }
  }
  const events = parsed?.events || [];
  if (!Array.isArray(events)) return '';
  return events
    .flatMap((event) => (event?.segs || []).map((seg) => seg?.utf8 || ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function transcriptVttToText(vtt) {
  if (!vtt || typeof vtt !== 'string') return '';
  return vtt
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('WEBVTT') && !/^\d+$/.test(line.trim()) && !/^\d{2}:\d{2}/.test(line.trim()))
    .map((line) => decodeHtmlEntities(line.replace(/<[^>]+>/g, '').trim()))
    .filter(Boolean)
    .join(' ')
    .trim();
}

function encodeVarint(n) {
  const bytes = [];
  let num = n;
  while (num > 0x7f) {
    bytes.push((num & 0x7f) | 0x80);
    num >>>= 7;
  }
  bytes.push(num);
  return Buffer.from(bytes);
}

function encodeProtobufString(fieldNum, value) {
  const str = Buffer.from(String(value), 'utf8');
  const tag = encodeVarint((fieldNum << 3) | 2);
  const len = encodeVarint(str.length);
  return Buffer.concat([tag, len, str]);
}

function encodeProtobufVarint(fieldNum, value) {
  const tag = encodeVarint((fieldNum << 3) | 0);
  const val = encodeVarint(value);
  return Buffer.concat([tag, val]);
}

function getBase64Protobuf({ param1, param2 }) {
  return Buffer.concat([
    encodeProtobufString(1, param1),
    encodeProtobufString(2, param2),
  ]).toString('base64');
}

function buildTranscriptParams(videoId, languageCode, kind = '') {
  const innerProto = getBase64Protobuf({ param1: kind || '', param2: languageCode });
  const innerWithPanel = Buffer.concat([
    encodeProtobufString(1, kind || ''),
    encodeProtobufString(2, languageCode),
    encodeProtobufString(3, ''),
  ]).toString('base64');

  const full = Buffer.concat([
    encodeProtobufString(1, videoId),
    encodeProtobufString(2, innerWithPanel),
    encodeProtobufVarint(3, 1),
    encodeProtobufString(5, 'engagement-panel-searchable-transcript-search-panel'),
    encodeProtobufVarint(6, 1),
    encodeProtobufVarint(7, 1),
    encodeProtobufVarint(8, 1),
  ]).toString('base64');

  return full;
}

function captionUrlNeedsPoToken(url) {
  return String(url || '').includes('exp=xpe');
}

function appendPoTokenToUrl(url, poToken) {
  if (!poToken || url.includes('pot=')) return url;
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}c=WEB&potc=1&pot=${encodeURIComponent(poToken)}`;
}

async function resolvePoToken(visitorData) {
  if (process.env.YOUTUBE_PO_TOKEN) return process.env.YOUTUBE_PO_TOKEN;
  if (poTokenCache && Date.now() - poTokenCacheAt < PO_TOKEN_TTL_MS) return poTokenCache;

  try {
    const { createTask } = require('youtube-po-token-generator/lib/task');
    const timeoutMs = 15000;
    const task = await Promise.race([
      createTask(visitorData),
      new Promise((_, reject) => setTimeout(() => reject(new Error('po token timeout')), timeoutMs)),
    ]);
    const result = await Promise.race([
      task.start(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('po token timeout')), timeoutMs)),
    ]);
    if (result?.poToken) {
      poTokenCache = result.poToken;
      poTokenCacheAt = Date.now();
      return result.poToken;
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[captions] PO token generation skipped:', e.message);
    }
  }
  return null;
}

function extractWatchPageMeta(html) {
  if (!html) return {};
  return {
    visitorData: html.match(/"visitorData":"([^"]+)"/)?.[1] || null,
    innertubeApiKey: html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1] || null,
    transcriptParams: html.match(/"getTranscriptEndpoint":\{"params":"([^"]+)"/)?.[1] || null,
  };
}

function extractTranscriptFromInnerTubeResponse(response) {
  const segments = response?.actions?.[0]?.updateEngagementPanelAction?.content
    ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
    ?.transcriptSegmentListRenderer?.initialSegments;

  if (!segments?.length) return '';

  return segments
    .map((seg) => seg?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text
      || seg?.transcriptSegmentRenderer?.snippet?.simpleText)
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function fetchTranscriptViaInnerTube(videoId, { params, visitorData, apiKey, track }) {
  const transcriptParams = params
    || (track ? buildTranscriptParams(videoId, track.languageCode, isAsrTrack(track) ? 'asr' : '') : null);

  if (!transcriptParams) return '';

  const keyQuery = apiKey ? `?key=${apiKey}&prettyPrint=false` : '?prettyPrint=false';
  const res = await postJson(`https://www.youtube.com/youtubei/v1/get_transcript${keyQuery}`, {
    context: {
      client: {
        ...INNERTUBE_CLIENT,
        visitorData: visitorData || undefined,
      },
    },
    params: transcriptParams,
    externalVideoId: videoId,
  }, visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {});

  if (res.status !== 200 || res.body?.error) return '';
  return extractTranscriptFromInnerTubeResponse(res.body);
}

function withCaptionFmt(baseUrl, fmt) {
  // Remove existing fmt= without leaving dangling ?& or && separators
  let url = baseUrl.replace(/[?&]fmt=[^&]*/g, '');
  url = url.replace(/\?&/g, '?').replace(/&&+/g, '&').replace(/[?&]$/, '');
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}fmt=${fmt}`;
}

function getTrackLanguages(tracks) {
  return [...new Set(
    (tracks || [])
      .map((t) => t.languageCode)
      .filter(Boolean)
  )];
}

function getTrackLabel(track) {
  const name = track?.name?.simpleText || track?.name;
  return typeof name === 'string' ? name : '';
}

function isAsrTrack(track) {
  if (!track) return false;
  if (track.kind === 'asr') return true;
  const vssId = String(track.vssId || '');
  if (vssId.startsWith('a.') || vssId.startsWith('.a.')) return true;
  if (/auto[- ]?generated/i.test(getTrackLabel(track))) return true;
  return false;
}

function trackType(track) {
  return isAsrTrack(track) ? 'auto-generated' : 'manual';
}

function pickTrackByLang(tracks, lang) {
  const manual = tracks.find((t) => t.vssId === `.${lang}` && !isAsrTrack(t));
  if (manual?.baseUrl) return { track: manual, type: 'manual', language: lang };

  const auto = tracks.find(
    (t) => (
      t.vssId === `a.${lang}`
      || t.vssId === `.a.${lang}`
      || (isAsrTrack(t) && t.languageCode === lang)
    )
  );
  if (auto?.baseUrl) return { track: auto, type: 'auto-generated', language: lang };

  const byCode = tracks.find((t) => t.languageCode === lang && t.baseUrl);
  if (byCode) {
    return {
      track: byCode,
      type: trackType(byCode),
      language: lang,
    };
  }
  return null;
}

function pickCaptionTrack(tracks, preferredLang, defaultTrackIndex = null) {
  if (!tracks?.length) return null;

  if (isAutoCaptionLang(preferredLang)) {
    if (
      defaultTrackIndex != null
      && tracks[defaultTrackIndex]?.baseUrl
    ) {
      const track = tracks[defaultTrackIndex];
      return {
        track,
        type: trackType(track),
        language: track.languageCode || 'auto',
      };
    }

    for (const lang of CAPTION_LANG_FALLBACKS) {
      const picked = pickTrackByLang(tracks, lang);
      if (picked) return picked;
    }

    const first = tracks.find((t) => t.baseUrl);
    if (first) {
      return {
        track: first,
        type: trackType(first),
        language: first.languageCode || 'auto',
      };
    }

    return null;
  }

  const langOrder = [
    preferredLang,
    ...CAPTION_LANG_FALLBACKS.filter((l) => l !== preferredLang),
  ];

  for (const lang of langOrder) {
    const picked = pickTrackByLang(tracks, lang);
    if (picked) return picked;
  }

  const fallback = tracks.find((t) => t.baseUrl);
  if (!fallback) return null;
  return {
    track: fallback,
    type: trackType(fallback),
    language: fallback.languageCode || preferredLang,
  };
}

function extractJsonArrayAfterMarker(html, marker) {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;

  let start = idx + marker.length;
  while (start < html.length && /\s/.test(html[start])) start += 1;
  if (html[start] !== '[') return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractCaptionTracksFromHtml(html) {
  if (!html || !html.includes('captionTracks')) return null;

  const markers = [
    '"captionTracks":',
    '\\"captionTracks\\":',
  ];

  for (const marker of markers) {
    const tracks = extractJsonArrayAfterMarker(html, marker);
    if (Array.isArray(tracks) && tracks.length) return tracks;
  }
  return null;
}

function mergeCaptionTracks(...trackLists) {
  const merged = [];
  const seen = new Set();

  for (const list of trackLists) {
    for (const track of list || []) {
      if (!track?.baseUrl) continue;
      const key = `${track.vssId || ''}|${track.languageCode || ''}|${track.baseUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(track);
    }
  }
  return merged.length ? merged : null;
}

function logCaptionTracksDev(context, tracks) {
  if (process.env.NODE_ENV !== 'development') return;
  const summary = (tracks || []).map((t) => ({
    languageCode: t.languageCode,
    vssId: t.vssId,
    kind: t.kind,
    name: getTrackLabel(t),
    hasBaseUrl: Boolean(t.baseUrl),
  }));
  console.log(`[captions] ${context}:`, summary);
}

const CLIENT_PROFILES = [
  {
    name: 'ios',
    clientName: 'IOS',
    clientVersion: '20.10.4',
    clientNameHeader: '5',
    userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    context: {
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      platform: 'MOBILE',
      osName: 'iOS',
      osVersion: '18.3.2.22D82',
    },
  },
  {
    name: 'android_vr',
    clientName: 'ANDROID_VR',
    clientVersion: '1.62.20',
    clientNameHeader: '28',
    userAgent: 'com.google.android.apps.youtube.vr.oculus/1.62.20 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    context: {
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      platform: 'MOBILE',
      osName: 'Android',
      osVersion: '12L',
      androidSdkVersion: 32,
    },
  },
  {
    name: 'mweb',
    clientName: 'MWEB',
    clientVersion: '2.20251209.01.00',
    clientNameHeader: '2',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    context: {
      platform: 'MOBILE',
      osName: 'iOS',
      osVersion: '17.5.1',
    },
  },
];

async function fetchPlayerWithClient(videoId, client) {
  const body = {
    context: {
      client: {
        clientName: client.clientName,
        clientVersion: client.clientVersion,
        hl: 'en',
        gl: 'US',
        ...client.context,
      },
      user: { lockedSafetyMode: false },
      request: { useSsl: true },
    },
    videoId: videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  };

  const url = 'https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'User-Agent': client.userAgent,
      'X-YouTube-Client-Name': client.clientNameHeader,
      'X-YouTube-Client-Version': client.clientVersion,
      Origin: 'https://www.youtube.com',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`InnerTube /player failed (${client.name}): ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function pickCaptionTrackForClient(tracks, preferredLang) {
  if (!tracks || tracks.length === 0) return null;

  const isAuto = !preferredLang || preferredLang === 'auto';
  
  if (!isAuto) {
    const manualMatch = tracks.find((t) => t.languageCode === preferredLang && !isAsrTrack(t));
    if (manualMatch) return manualMatch;

    const autoMatch = tracks.find((t) => t.languageCode === preferredLang && isAsrTrack(t));
    if (autoMatch) return autoMatch;
  }

  for (const fallback of CAPTION_LANG_FALLBACKS) {
    const match = tracks.find((t) => t.languageCode === fallback && !isAsrTrack(t));
    if (match) return match;
  }

  for (const fallback of CAPTION_LANG_FALLBACKS) {
    const match = tracks.find((t) => t.languageCode === fallback && isAsrTrack(t));
    if (match) return match;
  }

  const anyManual = tracks.find((t) => !isAsrTrack(t));
  if (anyManual) return anyManual;

  const anyAuto = tracks.find((t) => isAsrTrack(t));
  if (anyAuto) return anyAuto;

  return tracks[0];
}

async function resolveVideoCaptions(videoId, preferredLang) {
  let playerData = null;
  const failures = [];

  for (const client of CLIENT_PROFILES) {
    try {
      const data = await fetchPlayerWithClient(videoId, client);
      const status = data.playabilityStatus?.status;
      if (status && status !== 'OK') {
        failures.push(`${client.name}: ${status} - ${data.playabilityStatus?.reason || ''}`);
        continue;
      }
      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (tracks && tracks.length > 0) {
        playerData = data;
        break;
      }
      failures.push(`${client.name}: OK but no caption tracks`);
    } catch (err) {
      failures.push(`${client.name}: ${err.message}`);
    }
  }

  if (!playerData) {
    return {
      error: {
        status: 404,
        code: 'NO_CAPTIONS',
        message: `This video has no captions or subtitles. Attempts: ${failures.join('; ')}`,
        availableLanguages: [],
      },
    };
  }

  const tracks = playerData.captions.playerCaptionsTracklistRenderer.captionTracks;
  const availableLanguages = [...new Set(tracks.map((t) => t.languageCode).filter(Boolean))];

  const track = pickCaptionTrackForClient(tracks, preferredLang);
  if (!track || !track.baseUrl) {
    return {
      error: {
        status: 404,
        code: 'NO_CAPTIONS',
        message: 'No matching caption track found',
        availableLanguages,
      },
    };
  }

  let url = track.baseUrl.replace(/&fmt=[^&]+/, '');
  url += '&fmt=json3';

  const decodedUrl = url.replace(/\\u0026/g, '&').replace(/\\u003d/gi, '=');

  let text = '';
  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': CLIENT_PROFILES[0].userAgent,
      },
    });
    if (response.ok) {
      const rawText = await response.text();
      text = transcriptJson3ToText(rawText);
    }
  } catch (err) {
    console.error('[captions] json3 fetch failed:', err.message);
  }

  if (!text) {
    try {
      const rawBaseUrl = track.baseUrl.replace(/\\u0026/g, '&').replace(/\\u003d/gi, '=');
      const response = await fetch(rawBaseUrl, {
        headers: {
          'User-Agent': CLIENT_PROFILES[0].userAgent,
        },
      });
      if (response.ok) {
        const body = await response.text();
        if (body.trim().toLowerCase().startsWith('<?xml') || body.trim().toLowerCase().startsWith('<transcript')) {
          text = transcriptXmlToText(body);
        } else if (body.includes('WEBVTT')) {
          text = transcriptVttToText(body);
        } else {
          text = transcriptJson3ToText(body);
        }
      }
    } catch (err) {
      console.error('[captions] raw fallback fetch failed:', err.message);
    }
  }

  if (!text) {
    return {
      error: {
        status: 404,
        code: 'NO_CAPTIONS',
        message: 'Failed to download caption content',
        availableLanguages,
      },
    };
  }

  return {
    captions: text,
    type: isAsrTrack(track) ? 'auto-generated' : 'manual',
    language: track.languageCode || preferredLang,
    availableLanguages,
  };
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
      return res.status(400).json({ message: 'Video ID is required', code: 'INVALID_REQUEST' });
    }

    if (!VIDEO_ID_REGEX.test(videoId)) {
      return res.status(400).json({ message: 'Invalid video ID format', code: 'INVALID_VIDEO_ID' });
    }

    const requestedLanguage = typeof lang === 'string' && lang.trim() ? lang.trim() : 'auto';
    const result = await resolveVideoCaptions(videoId, requestedLanguage);

    if (result.error) {
      return res.status(result.error.status).json({
        message: result.error.message,
        code: result.error.code,
        availableLanguages: result.error.availableLanguages || [],
      });
    }

    return res.json({
      captions: result.captions,
      type: result.type,
      language: result.language,
      requestedLanguage,
      availableLanguages: result.availableLanguages || [],
      fallbackUsed: !isAutoCaptionLang(requestedLanguage) && result.language !== requestedLanguage,
    });
  } catch (error) {
    console.error('YouTube captions API error:', error);
    res.status(500).json({
      message: 'Failed to fetch captions',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
