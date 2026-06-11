const https = require('https');

const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';

function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': ANDROID_UA, ...headers } }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    }).on('error', reject);
  });
}

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'User-Agent': ANDROID_UA,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
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

function withCaptionFmt(baseUrl, fmt) {
  const stripped = baseUrl.replace(/\\u0026/g, '&').replace(/([?&])fmt=[^&]*/g, '$1').replace(/[?&]$/, '');
  const joiner = stripped.includes('?') ? '&' : '?';
  return `${stripped}${joiner}fmt=${fmt}`;
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

const ANDROID_CLIENTS = [
  { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30 },
  { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 30 },
  { clientName: 'ANDROID', clientVersion: '20.49.39', androidSdkVersion: 34 },
  { clientName: 'IOS', clientVersion: '20.10.38', deviceModel: 'iPhone16,2' },
  { clientName: 'TVHTML5', clientVersion: '7.20250312.14.00' },
];

async function tryClient(videoId, client, apiKey, lang) {
  const urls = [
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    'https://www.youtube.com/youtubei/v1/player',
  ];
  for (const url of urls) {
    const res = await postJson(url, {
      context: { client: { ...client, hl: 'en', gl: 'US' } },
      videoId,
    });
    const tracks = res.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    const status = res.body?.playabilityStatus?.status;
    console.log(`  ${client.clientName} ${client.clientVersion} url=${url.includes('key=') ? 'with-key' : 'no-key'}: http=${res.status} playability=${status} tracks=${tracks.length}`);
    if (!tracks.length) {
      if (res.status !== 200) console.log('    err:', JSON.stringify(res.body?.error || res.body?.playabilityStatus).slice(0, 150));
      continue;
    }

    const track = tracks.find((t) => t.languageCode === lang)
      || tracks.find((t) => t.kind === 'asr')
      || tracks[0];
    const baseUrl = track.baseUrl?.replace(/\\u0026/g, '&');
    console.log(`    picked ${track.languageCode} kind=${track.kind} exp=xpe=${baseUrl?.includes('exp=xpe')}`);

    for (const fmt of ['json3', 'vtt', 'srv3']) {
      const capUrl = withCaptionFmt(baseUrl, fmt);
      const cap = await fetchText(capUrl);
      const text = fmt === 'json3' ? transcriptJson3ToText(cap.body) : cap.body.slice(0, 80);
      console.log(`    fmt=${fmt}: status=${cap.status} len=${cap.body.length} textLen=${text?.length || 0}`);
      if (cap.body.length > 0) {
        console.log('    SAMPLE:', (typeof text === 'string' ? text : '').slice(0, 120));
        return true;
      }
    }
  }
  return false;
}

async function main() {
  const videoId = process.argv[2] || 'dQw4w9WgXcQ';
  const lang = process.argv[3] || 'en';

  const { body: html } = await fetchText(`https://www.youtube.com/watch?v=${videoId}`, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  console.log('videoId:', videoId, 'lang:', lang, 'apiKey:', apiKey?.slice(0, 15));

  for (const client of ANDROID_CLIENTS) {
    const ok = await tryClient(videoId, client, apiKey, lang);
    if (ok) return;
  }
  console.log('all clients failed');
}

main().catch(console.error);
