const fs = require('fs');

async function scrapeChannel(handle, endpoint) {
  const url = `https://www.youtube.com/@${handle}/${endpoint}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "en" },
  });
  if (!res.ok) { console.log('not ok'); return; }

  const html = await res.text();
  const match = html.match(/var ytInitialData\s*=\s*(\{.*?\});/s);
  if (!match) { console.log('no match'); return; }

  let data = JSON.parse(match[1]);
  fs.writeFileSync('shorts-data.json', JSON.stringify(data, null, 2));
  console.log('wrote to shorts-data.json');
}

scrapeChannel('MrBeast', 'shorts');
