const https = require('https');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.youtube.com/',
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

async function main() {
  const videoId = process.argv[2] || 'dQw4w9WgXcQ';
  const html = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);

  const markers = [
    'transcriptSegmentRenderer',
    'initialSegments',
    'getTranscriptEndpoint',
    'engagement-panel-searchable-transcript',
    'captionTracks',
  ];
  for (const m of markers) {
    console.log(m, 'count:', (html.match(new RegExp(m, 'g')) || []).length);
  }

  const segIdx = html.indexOf('transcriptSegmentRenderer');
  if (segIdx >= 0) console.log('segment context:', html.slice(segIdx, segIdx + 400));

  const ytInitialData = html.match(/var ytInitialData = ({.+?});<\/script>/s)?.[1]
    || html.match(/ytInitialData\s*=\s*({.+?});/s)?.[1];
  if (ytInitialData) {
    try {
      const data = JSON.parse(ytInitialData);
      const panels = data?.engagementPanels || [];
      console.log('engagementPanels:', panels.length);
      const transcriptPanel = panels.find((p) => JSON.stringify(p).includes('transcript'));
      if (transcriptPanel) {
        console.log('transcript panel keys:', Object.keys(transcriptPanel));
        console.log('panel snippet:', JSON.stringify(transcriptPanel).slice(0, 500));
      }
    } catch (e) {
      console.log('parse ytInitialData failed:', e.message);
    }
  } else {
    console.log('no ytInitialData');
  }
}

main().catch(console.error);
