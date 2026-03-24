import Parser from "rss-parser";
import crypto from "crypto";
import type { Article } from "@/types/article";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "LiveCuration/1.0" },
});

export interface FeedConfig {
  url: string;
  platform: string;
  source: string;
}

export const FEED_CONFIGS: FeedConfig[] = [
  { url: "https://prtimes.jp/searchrss?keyword=TikTok+%E3%83%A9%E3%82%A4%E3%83%96", platform: "TikTok", source: "PR TIMES" },
  { url: "https://prtimes.jp/searchrss?keyword=Instagram+%E3%83%A9%E3%82%A4%E3%83%96", platform: "Instagram", source: "PR TIMES" },
  { url: "https://prtimes.jp/searchrss?keyword=Pococha", platform: "Pococha", source: "PR TIMES" },
  { url: "https://prtimes.jp/searchrss?keyword=REALITY+%E3%83%A9%E3%82%A4%E3%83%96%E9%85%8D%E4%BF%A1", platform: "REALITY", source: "PR TIMES" },
  { url: "https://prtimes.jp/searchrss?keyword=SHOWROOM+%E3%83%A9%E3%82%A4%E3%83%96", platform: "SHOWROOM", source: "PR TIMES" },
  { url: "https://prtimes.jp/searchrss?keyword=17LIVE", platform: "17LIVE", source: "PR TIMES" },
  { url: "https://prtimes.jp/searchrss?keyword=%E3%83%A9%E3%82%A4%E3%83%96%E3%82%B3%E3%83%9E%E3%83%BC%E3%82%B9", platform: "TikTok", source: "PR TIMES" },
  { url: "https://note.com/topic/livestreaming/rss", platform: "Pococha", source: "note" },
];

export async function fetchFeed(config: FeedConfig): Promise<Omit<Article, "createdAt">[]> {
  try {
    const feed = await parser.parseURL(config.url);
    const articles: Omit<Article, "createdAt">[] = [];
    for (const item of feed.items || []) {
      if (!item.title || !item.link) continue;
      const detectedPlatform = detectPlatform(item.title) || config.platform;
      const id = crypto.createHash("md5").update(item.link).digest("hex").substring(0, 12);
      const thumbnail = extractThumbnail(item);
      articles.push({
        id, title: item.title.trim(), url: item.link,
        platform: detectedPlatform, source: config.source,
        thumbnail, publishedAt: item.isoDate || new Date().toISOString(),
      });
    }
    return articles;
  } catch (error) {
    console.error(`[RSS] フィード取得失敗: ${config.url}`, error);
    return [];
  }
}

export async function fetchAllFeeds(): Promise<Omit<Article, "createdAt">[]> {
  const results = await Promise.allSettled(FEED_CONFIGS.map((c) => fetchFeed(c)));
  const allArticles: Omit<Article, "createdAt">[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") allArticles.push(...result.value);
  }
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => { if (seen.has(a.url)) return false; seen.add(a.url); return true; });
  console.log(`[RSS] ${unique.length} 件の記事を取得しました`);
  return unique;
}

function detectPlatform(title: string): string | null {
  const lower = title.toLowerCase();
  const keywords: [string, string][] = [
    ["tiktok", "TikTok"], ["ティックトック", "TikTok"],
    ["instagram", "Instagram"], ["インスタグラム", "Instagram"], ["インスタ", "Instagram"],
    ["pococha", "Pococha"], ["ポコチャ", "Pococha"],
    ["reality", "REALITY"], ["showroom", "SHOWROOM"],
    ["17live", "17LIVE"], ["イチナナ", "17LIVE"],
    ["mildom", "Mildom"], ["ミルダム", "Mildom"], ["bigo", "BIGO LIVE"],
  ];
  for (const [kw, p] of keywords) { if (lower.includes(kw.toLowerCase())) return p; }
  return null;
}

function extractThumbnail(item: Parser.Item & Record<string, unknown>): string | null {
  if (item.enclosure?.url) return item.enclosure.url;
  const content = (item["content:encoded"] as string) || item.content || item.contentSnippet || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  const media = item["media:thumbnail"] || item["media:content"];
  if (media && typeof media === "object" && "$" in (media as Record<string, unknown>)) {
    return ((media as Record<string, Record<string, string>>)["$"])?.url || null;
  }
  return null;
}
