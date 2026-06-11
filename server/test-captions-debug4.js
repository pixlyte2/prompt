/**
 * Debug phase 4: Test InnerTube with alternative clients for IWis_8XcUxY
 */

const https = require('https');

const VIDEO_ID = 'IWis_8XcUxY';

const WATCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8',
  'Origin': 'https://www.youtube.com',
  'Referer': 'https://www.youtube.com/',
};

function fetchText(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
        ...extraHeaders,
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout POST')); });
    req.write(data);
    req.end();
  });
}

function encodeVarint(n) {
  const bytes = []; let num = n;
  while (num > 0x7f) { bytes.push((num & 0x7f) | 0x80); num >>>= 7; }
  bytes.push(num); return Buffer.from(bytes);
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
function buildTranscriptParams(videoId, languageCode, kind = '') {
  const innerWithPanel = Buffer.concat([
    encodeProtobufString(1, kind || ''),
    encodeProtobufString(2, languageCode),
    encodeProtobufString(3, ''),
  ]).toString('base64');
  return Buffer.concat([
    encodeProtobufString(1, videoId),
    encodeProtobufString(2, innerWithPanel),
    encodeProtobufVarint(3, 1),
    encodeProtobufString(5, 'engagement-panel-searchable-transcript-search-panel'),
    encodeProtobufVarint(6, 1),
    encodeProtobufVarint(7, 1),
    encodeProtobufVarint(8, 1),
  ]).toString('base64');
}

function extractTranscriptText(response) {
  const segments = response?.actions?.[0]?.updateEngagementPanelAction?.content
    ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
    ?.transcriptSegmentListRenderer?.initialSegments;
  if (!segments?.length) return '';
  return segments
    .map(seg => seg?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text
      || seg?.transcriptSegmentRenderer?.snippet?.simpleText)
    .filter(Boolean).join(' ').trim();
}

function extractJsonArrayAfterMarker(html, marker) {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  let start = idx + marker.length;
  while (start < html.length && /\s/.test(html[start])) start++;
  if (html[start] !== '[') return null;
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (escaped) { escaped = false; continue; }
    if (inString) { if (ch === '\\') escaped = true; else if (ch === '"') inString = false; continue; }
    if (ch === '"') { inString = true; continue; }
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) { try { return JSON.parse(html.slice(start, i+1)); } catch { return null; } } }
  }
  return null;
}

async function run() {
  console.log(`\n=== Alt-client InnerTube test for ${VIDEO_ID} ===\n`);

  // Get watch page meta
  const { body: watchHtml } = await fetchText(`https://www.youtube.com/watch?v=${VIDEO_ID}`, WATCH_HEADERS);
  const visitorData = watchHtml.match(/"visitorData":"([^"]+)"/)?.[1] || null;
  const apiKey = watchHtml.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1] || null;
  const watchTranscriptParams = watchHtml.match(/"getTranscriptEndpoint":\{"params":"([^"]+)"/)?.[1] || null;
  const captionTracks = extractJsonArrayAfterMarker(watchHtml, '"captionTracks":');
  console.log(`visitorData: ${visitorData ? 'yes' : 'no'}, apiKey: ${apiKey ? 'yes' : 'no'}, watchTranscriptParams: ${watchTranscriptParams ? 'yes' : 'no'}`);
  console.log(`captionTracks: ${captionTracks?.length || 0}`);

  const asr_params = buildTranscriptParams(VIDEO_ID, 'ta', 'asr');
  const no_kind_params = buildTranscriptParams(VIDEO_ID, 'ta', '');
  const keyQuery = apiKey ? `?key=${apiKey}&prettyPrint=false` : '?prettyPrint=false';

  const clientDefs = [
    {
      name: 'WEB_newer',
      client: { clientName: 'WEB', clientVersion: '2.20250601.00.00', hl: 'en', gl: 'US' },
    },
    {
      name: 'MWEB',
      client: { clientName: 'MWEB', clientVersion: '2.20250601.01.00', hl: 'en', gl: 'US' },
    },
    {
      name: 'WEB_EMBEDDED_PLAYER',
      client: { clientName: 'WEB_EMBEDDED_PLAYER', clientVersion: '2.20250601.00.00', hl: 'en', gl: 'US' },
    },
    {
      name: 'TVHTML5',
      client: { clientName: 'TVHTML5', clientVersion: '7.20250601.00.00', hl: 'en', gl: 'US' },
    },
  ];

  for (const { name, client } of clientDefs) {
    for (const [pname, params] of [['asr', asr_params], ['nokind', no_kind_params], ['watchpage', watchTranscriptParams].filter(([,p]) => p)]) {
      if (!params) continue;
      try {
        const res = await postJson(
          `https://www.youtube.com/youtubei/v1/get_transcript${keyQuery}`,
          {
            context: { client: { ...client, visitorData: visitorData || undefined } },
            params,
            externalVideoId: VIDEO_ID,
          },
          visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {}
        );
        const text = res.status === 200 ? extractTranscriptText(res.body) : '';
        const status = res.status;
        const err = res.body?.error?.message || '';
        console.log(`[${name}/${pname}] ${status} ${text ? '>>> SUCCESS '+text.length+'chars' : (err || 'empty/fail')}`);
        if (text) { console.log(`  First 150: ${text.slice(0, 150)}`); break; }
      } catch (e) {
        console.log(`[${name}/${pname}] ERROR: ${e.message}`);
      }
    }
  }

  // Also check if video is actually available from this server / region
  console.log('\n--- Checking video availability ---');
  try {
    const { body: oembedBody, status: oembedStatus } = await fetchText(
      `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+VIDEO_ID)}&format=json`,
      WATCH_HEADERS
    );
    console.log(`oEmbed status: ${oembedStatus}`);
    if (oembedStatus === 200) {
      try { const o = JSON.parse(oembedBody); console.log(`Title: "${o.title}" by "${o.author_name}"`); }
      catch { console.log('Could not parse oEmbed JSON'); }
    }
  } catch (e) {
    console.log('oEmbed error:', e.message);
  }

  // Check if it's actually a captions issue vs video issue by looking at the watch page playability
  const iprMatch = watchHtml.match(/"playabilityStatus":\{"status":"([^"]+)"/);
  console.log(`playabilityStatus: ${iprMatch?.[1] || 'not found'}`);
  const captionNeedsPoToken = (captionTracks?.[0]?.baseUrl || '').includes('exp=xpe');
  console.log(`Caption URL needs PO token (exp=xpe): ${captionNeedsPoToken}`);

  console.log('\n=== Done ===\n');
  process.exit(0);
}

setTimeout(() => { console.log('\n[TIMEOUT]'); process.exit(1); }, 75000);
run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
