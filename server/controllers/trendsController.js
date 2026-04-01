const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const TRENDS_BASE = "https://trends.google.com/trending/rss";
const ALLOWED_GEO = ["IN", "IN-TN"];
const CACHE_TTL = 10 * 60 * 1000;

const cacheMap = {};

async function fetchTrendsRSS(geo) {
  const now = Date.now();
  const cached = cacheMap[geo];
  if (cached && now - cached.ts < CACHE_TTL) return cached.data;

  const res = await fetch(`${TRENDS_BASE}?geo=${geo}`);
  if (!res.ok) throw new Error(`Google Trends returned ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);

  const items = parsed?.rss?.channel?.item || [];

  const trends = (Array.isArray(items) ? items : [items]).map((item, idx) => {
    const title = item.title || "";
    const traffic = item["ht:approx_traffic"] || "";
    const pubDate = item.pubDate || "";
    const description = (item["ht:news_item_title"] || item.description || "")
      .replace(/<[^>]*>/g, "")
      .trim();

    let newsItems = item["ht:news_item"];
    if (newsItems && !Array.isArray(newsItems)) newsItems = [newsItems];
    const news = (newsItems || []).map((n) => ({
      title: (n["ht:news_item_title"] || "").replace(/<[^>]*>/g, "").trim(),
      url: n["ht:news_item_url"] || "",
      source: n["ht:news_item_source"] || "",
      picture: n["ht:news_item_picture"] || "",
    }));

    const sources = [...new Set(news.map((n) => n.source).filter(Boolean))];

    const picture = item["ht:picture"] || news[0]?.picture || "";

    return {
      id: idx + 1,
      title,
      traffic: traffic.replace(/\+/g, ""),
      trafficNum: parseInt(traffic.replace(/[^0-9]/g, ""), 10) || 0,
      pubDate,
      description,
      picture,
      sources,
      news: news.slice(0, 5),
    };
  });

  cacheMap[geo] = { data: trends, ts: now };
  return trends;
}

exports.getTrends = async (req, res) => {
  try {
    const geo = ALLOWED_GEO.includes(req.query.geo) ? req.query.geo : "IN";
    const trends = await fetchTrendsRSS(geo);
    res.json({ trends, geo });
  } catch (err) {
    console.error("Trends fetch error:", err.message);
    res.status(502).json({ message: "Could not fetch trending topics. Try again later." });
  }
};
