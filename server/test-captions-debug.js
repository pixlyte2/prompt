const ytdl = require('@distube/ytdl-core');
const https = require('https');
const { getSubtitles } = require('youtube-captions-scraper');

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

function getBase64Protobuf({ param1, param2 }) {
  return Buffer.concat([
    encodeProtobufString(1, param1),
    encodeProtobufString(2, param2),
  ]).toString('base64');
}

function buildTranscriptParams(videoId, languageCode, kind = '') {
  const innerProto = getBase64Protobuf({ param1: kind || '', param2: languageCode });
  return getBase64Protobuf({ param1: videoId, param2: innerProto });
}

function extractTranscriptText(response) {
  const segments = response?.actions?.[0]?.updateEngagementPanelAction?.content
    ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
    ?.transcriptSegmentListRenderer?.initialSegments
    || response?.actions?.[0]?.updateEngagementPanelAction?.content
      ?.transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups;

  if (!segments?.length) return null;
  const texts = [];
  for (const seg of segments) {
    const snippet = seg?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text
      || seg?.transcriptSegmentRenderer?.snippet?.simpleText
      || seg?.cue?.simpleCueGroupRenderer?.cues?.[0]?.simpleCueRenderer?.text?.simpleText;
    if (snippet) texts.push(snippet);
  }
  return texts.join(' ').trim();
}

function withCaptionFmt(baseUrl, fmt) {
  const url = baseUrl.replace(/([?&])fmt=[^&]*/g, '$1').replace(/[?&]$/, '');
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}fmt=${fmt}`;
}

async function test(videoId) {
  console.log('\n===', videoId, '===');
  const { body: html } = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);
  const m = html.match(/"getTranscriptEndpoint":\{"params":"([^"]+)"/);
  const defaultParams = m?.[1];
  console.log('default params found:', Boolean(defaultParams));

  const info = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${videoId}`);
  const tracks = info?.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  console.log('tracks:', tracks.map((t) => ({ lang: t.languageCode, kind: t.kind, vssId: t.vssId })));

  for (const track of tracks.slice(0, 4)) {
    const baseUrl = track.baseUrl?.replace(/\\u0026/g, '&');
    if (!baseUrl) continue;
    for (const fmt of ['json3', 'vtt', 'srv3']) {
      const url = withCaptionFmt(baseUrl, fmt);
      const { status, body } = await fetchText(url);
      console.log(`baseUrl ${track.languageCode} fmt=${fmt}: status=${status} len=${body.length}`);
      if (body.length > 0) {
        console.log('  preview:', body.slice(0, 120));
        break;
      }
    }
  }

  if (defaultParams) {
    const res = await postJson('https://www.youtube.com/youtubei/v1/get_transcript?prettyPrint=false', {
      context: { client: { clientName: 'WEB', clientVersion: '2.20250201.00.00', hl: 'en', gl: 'US' } },
      params: defaultParams,
    });
    const text = extractTranscriptText(res.body);
    console.log('watch-page params InnerTube:', res.status, 'textLen=', text?.length || 0, text?.slice(0, 80));
  }

  for (const track of tracks.slice(0, 3)) {
    const kind = track.kind === 'asr' ? 'asr' : '';
    const params = buildTranscriptParams(videoId, track.languageCode, kind);
    const res = await postJson('https://www.youtube.com/youtubei/v1/get_transcript?prettyPrint=false', {
      context: { client: { clientName: 'WEB', clientVersion: '2.20250201.00.00', hl: 'en', gl: 'US' } },
      params,
    });
    const text = extractTranscriptText(res.body);
    console.log(`built params ${track.languageCode} ${kind || 'manual'}:`, res.status, 'textLen=', text?.length || 0);
    if (res.status !== 200) console.log('  err:', JSON.stringify(res.body).slice(0, 200));
  }

  try {
    const lang = tracks[0]?.languageCode || 'en';
    const lines = await getSubtitles({ videoID: videoId, lang });
    console.log(`scraper ${lang}:`, lines?.length, 'lines, sample:', lines?.[0]?.text?.slice(0, 60));
  } catch (e) {
    console.log('scraper failed:', e.message);
  }
}

const ids = process.argv.slice(2);
if (!ids.length) ids.push('dQw4w9WgXcQ');
Promise.all(ids.map(test)).catch(console.error);
