const ytdl = require('@distube/ytdl-core');
const https = require('https');
const { generate } = require('youtube-po-token-generator');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.youtube.com/',
  Origin: 'https://www.youtube.com',
  'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8',
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

async function test(videoId, preferredLang) {
  console.log('\n===', videoId, preferredLang || 'auto', '===');
  const { poToken } = await generate();
  console.log('poToken generated, len=', poToken?.length);

  const info = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${videoId}`);
  const tracks = info?.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  console.log('tracks:', tracks.map((t) => ({ lang: t.languageCode, kind: t.kind, vssId: t.vssId })));

  const track = tracks.find((t) => t.languageCode === preferredLang)
    || tracks.find((t) => t.kind === 'asr')
    || tracks[0];
  if (!track?.baseUrl) {
    console.log('no track');
    return;
  }

  const baseUrl = track.baseUrl.replace(/\\u0026/g, '&');
  console.log('exp=xpe:', baseUrl.includes('exp=xpe'));

  for (const fmt of ['json3', 'vtt', 'srv3']) {
    const url = appendPotParams(withCaptionFmt(baseUrl, fmt), poToken);
    const { status, body } = await fetchText(url);
    const text = fmt === 'json3' ? transcriptJson3ToText(body) : body.slice(0, 80);
    console.log(`fmt=${fmt}: status=${status} len=${body.length} textLen=${text?.length || 0}`);
    if (body.length > 0) {
      console.log('sample:', (typeof text === 'string' ? text : '').slice(0, 120));
      return;
    }
  }
}

const videoId = process.argv[2] || 'dQw4w9WgXcQ';
const lang = process.argv[3] || 'en';
test(videoId, lang).catch(console.error);
