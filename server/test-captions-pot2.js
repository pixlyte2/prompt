const ytdl = require('@distube/ytdl-core');
const https = require('https');
const { createTask } = require('youtube-po-token-generator/lib/task');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.youtube.com/',
  Origin: 'https://www.youtube.com',
};

function fetchText(url, extra = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { ...HEADERS, ...extra } }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    }).on('error', reject);
  });
}

function postJson(url, body, extra = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { ...HEADERS, ...extra, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
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

function decodeVisitorId(visitorData) {
  try {
    const padded = visitorData.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const match = decoded.match(/[\w-]{21,}/);
    return match?.[0] || visitorData;
  } catch {
    return visitorData;
  }
}

function withCaptionFmt(baseUrl, fmt) {
  const stripped = baseUrl.replace(/([?&])fmt=[^&]*/g, '$1').replace(/[?&]$/, '');
  const joiner = stripped.includes('?') ? '&' : '?';
  return `${stripped}${joiner}fmt=${fmt}`;
}

function appendPotParams(url, poToken) {
  const u = new URL(url);
  u.searchParams.set('c', 'WEB');
  u.searchParams.set('potc', '1');
  u.searchParams.set('pot', poToken);
  return u.toString();
}

function transcriptJson3ToText(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return (parsed?.events || [])
      .flatMap((e) => (e?.segs || []).map((s) => s?.utf8 || ''))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  } catch { return ''; }
}

function extractTranscriptText(response) {
  const segments = response?.actions?.[0]?.updateEngagementPanelAction?.content
    ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
    ?.transcriptSegmentListRenderer?.initialSegments;
  if (!segments?.length) return '';
  return segments
    .map((s) => s?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text
      || s?.transcriptSegmentRenderer?.snippet?.simpleText || '')
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function main() {
  const videoId = process.argv[2] || 'dQw4w9WgXcQ';
  const lang = process.argv[3] || 'ta';

  const { body: html } = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  const visitorData = html.match(/"VISITOR_DATA":"([^"]+)"/)?.[1];
  const transcriptParams = html.match(/"getTranscriptEndpoint":\{"params":"([^"]+)"/)?.[1];

  console.log('visitorData:', !!visitorData, 'apiKey:', !!apiKey);

  const task = await createTask(visitorData);
  const { poToken } = await Promise.race([
    task.start(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('poToken timeout')), 60000)),
  ]);
  console.log('poToken len:', poToken?.length);

  const innertubeHeaders = {
    'X-Goog-Visitor-Id': decodeVisitorId(visitorData),
    'X-Youtube-Client-Name': '1',
    'X-Youtube-Client-Version': clientVersion,
  };

  const ctx = {
    client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US', visitorData },
    user: { lockedSafetyMode: false },
    request: { useSsl: true },
  };

  if (transcriptParams) {
    const res = await postJson(
      `https://www.youtube.com/youtubei/v1/get_transcript?key=${apiKey}`,
      { context: ctx, params: transcriptParams },
      innertubeHeaders,
    );
    const text = extractTranscriptText(res.body);
    console.log('get_transcript:', res.status, 'textLen=', text.length, text.slice(0, 80));
  }

  const info = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${videoId}`);
  const tracks = info?.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  const track = tracks.find((t) => t.languageCode === lang) || tracks.find((t) => t.kind === 'asr') || tracks[0];
  const baseUrl = track?.baseUrl?.replace(/\\u0026/g, '&');
  console.log('track:', track?.languageCode, track?.kind, 'exp=xpe:', baseUrl?.includes('exp=xpe'));

  if (baseUrl) {
    const url = appendPotParams(withCaptionFmt(baseUrl, 'json3'), poToken);
    const { status, body } = await fetchText(url);
    const text = transcriptJson3ToText(body);
    console.log('timedtext+pot:', status, 'bodyLen=', body.length, 'textLen=', text.length, text.slice(0, 80));
  }
}

main().catch((e) => { console.error('ERR:', e.message); process.exit(1); });
