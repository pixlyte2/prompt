const https = require('https');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.youtube.com/',
  Origin: 'https://www.youtube.com',
  'Content-Type': 'application/json',
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    }).on('error', reject);
  });
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { ...HEADERS, 'Content-Length': Buffer.byteLength(data) },
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

const CLIENTS = {
  ANDROID: { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 30, hl: 'en', gl: 'US' },
  IOS: { clientName: 'IOS', clientVersion: '19.09.3', deviceModel: 'iPhone14,3', hl: 'en', gl: 'US' },
  TV: { clientName: 'TVHTML5', clientVersion: '7.20250312.14.00', hl: 'en', gl: 'US' },
  WEB_EMBEDDED: { clientName: 'WEB_EMBEDDED_PLAYER', clientVersion: '2.20250201.00.00', hl: 'en', gl: 'US' },
  MWEB: { clientName: 'MWEB', clientVersion: '2.20250201.01.00', hl: 'en', gl: 'US' },
};

async function fetchPlayer(videoId, client, apiKey) {
  return postJson(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    context: { client },
    videoId,
  });
}

function transcriptJson3ToText(raw) {
  let parsed = raw;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { return ''; }
  }
  const events = parsed?.events || [];
  return events
    .flatMap((e) => (e?.segs || []).map((s) => s?.utf8 || ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

async function testClient(videoId, name, client, apiKey) {
  const res = await fetchPlayer(videoId, client, apiKey);
  const tracks = res.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  console.log(`\n${name}: status=${res.status} tracks=${tracks.length}`);
  if (!tracks.length) return;

  const track = tracks.find((t) => t.languageCode === 'ta') || tracks.find((t) => t.kind === 'asr') || tracks[0];
  const baseUrl = track.baseUrl?.replace(/\\u0026/g, '&');
  console.log(`  track ${track.languageCode} kind=${track.kind} exp=xpe=${baseUrl?.includes('exp=xpe')}`);
  if (!baseUrl) return;

  for (const fmt of ['json3', 'vtt', 'srv3']) {
    const url = baseUrl.includes('fmt=')
      ? baseUrl.replace(/fmt=[^&]*/, `fmt=${fmt}`)
      : `${baseUrl}&fmt=${fmt}`;
    const { status, body } = await fetchText(url);
    console.log(`  fmt=${fmt}: status=${status} len=${body.length}`);
    if (body.length > 0) {
      const text = fmt === 'json3' ? transcriptJson3ToText(body) : body.slice(0, 100);
      console.log('  preview:', text);
      return;
    }
  }
}

async function main() {
  const videoId = process.argv[2] || 'dQw4w9WgXcQ';
  const { body: html } = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  console.log('videoId:', videoId, 'apiKey:', apiKey?.slice(0, 15));

  for (const [name, client] of Object.entries(CLIENTS)) {
    await testClient(videoId, name, client, apiKey);
  }
}

main().catch(console.error);
