const ytdl = require('@distube/ytdl-core');
const https = require('https');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.youtube.com/',
  Origin: 'https://www.youtube.com',
  'Content-Type': 'application/json',
  Accept: '*/*',
};

function fetchText(url, headers = HEADERS) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw }));
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
      headers: { ...HEADERS, ...extraHeaders, 'Content-Length': Buffer.byteLength(data) },
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

function extractFromHtml(html) {
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1]
    || html.match(/INNERTUBE_API_KEY\\":\\"([^\\]+)/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1]
    || html.match(/INNERTUBE_CLIENT_VERSION\\":\\"([^\\]+)/)?.[1];
  const visitorData = html.match(/"VISITOR_DATA":"([^"]+)"/)?.[1]
    || html.match(/VISITOR_DATA\\":\\"([^\\]+)/)?.[1];
  const transcriptParams = html.match(/"getTranscriptEndpoint":\{"params":"([^"]+)"/)?.[1];
  return { apiKey, clientVersion, visitorData, transcriptParams };
}

function extractTranscriptText(response) {
  const segments = response?.actions?.[0]?.updateEngagementPanelAction?.content
    ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
    ?.transcriptSegmentListRenderer?.initialSegments;
  if (!segments?.length) return null;
  return segments
    .map((seg) => seg?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text
      || seg?.transcriptSegmentRenderer?.snippet?.simpleText || '')
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function test(videoId) {
  console.log('\n===', videoId, '===');
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const { body: html } = await fetchText(watchUrl);
  const meta = extractFromHtml(html);
  console.log('apiKey:', meta.apiKey?.slice(0, 12), 'clientVersion:', meta.clientVersion, 'visitor:', !!meta.visitorData);

  const info = await ytdl.getBasicInfo(watchUrl);
  const tracks = info?.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  const track = tracks.find((t) => t.languageCode === 'ta') || tracks.find((t) => t.kind === 'asr') || tracks[0];
  console.log('picked track:', track?.languageCode, track?.kind, track?.vssId);

  if (track?.baseUrl) {
    const rawUrl = track.baseUrl.replace(/\\u0026/g, '&');
    console.log('raw baseUrl (no fmt change):', (await fetchText(rawUrl)).body.length);
    console.log('raw + fmt=json3:', (await fetchText(`${rawUrl}&fmt=json3`)).body.length);
    console.log('raw + fmt=vtt:', (await fetchText(`${rawUrl}&fmt=vtt`)).body.length);
  }

  if (meta.transcriptParams && meta.apiKey) {
    const ctx = {
      client: {
        clientName: 'WEB',
        clientVersion: meta.clientVersion || '2.20250201.00.00',
        hl: 'en',
        gl: 'US',
        visitorData: meta.visitorData,
      },
      user: {},
      request: { useSsl: true },
    };
    const res = await postJson(
      `https://www.youtube.com/youtubei/v1/get_transcript?key=${meta.apiKey}`,
      { context: ctx, params: meta.transcriptParams },
    );
    const text = extractTranscriptText(res.body);
    console.log('get_transcript (page params + api key):', res.status, 'len=', text?.length || 0, text?.slice(0, 80));
    if (res.status !== 200) console.log('  body:', JSON.stringify(res.body).slice(0, 250));
  }

  // MWEB client
  if (meta.apiKey) {
    const res = await postJson(
      `https://www.youtube.com/youtubei/v1/get_transcript?key=${meta.apiKey}`,
      {
        context: {
          client: {
            clientName: 'MWEB',
            clientVersion: '2.20250201.01.00',
            hl: 'en',
            gl: 'US',
          },
        },
        params: meta.transcriptParams,
        externalVideoId: videoId,
      },
    );
    const text = extractTranscriptText(res.body);
    console.log('MWEB get_transcript:', res.status, 'len=', text?.length || 0);
  }
}

test(process.argv[2] || 'dQw4w9WgXcQ').catch(console.error);
