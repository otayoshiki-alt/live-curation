/**
 * RSS フィード取得・パース
 *
 * Google News RSS を使って各プラットフォーム関連のニュースを取得し、
 * 統一フォーマットの Article に変換する。
 */

import Parser from "rss-parser";
import crypto from "crypto";
import type { Article } from "@/types/article";

const parser = new Parser({
    timeout: 15000,
    headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; LiveCuration/1.0; +https://live-curation.vercel.app)",
    },
});

// ─── RSSフィード定義 ───

export interface FeedConfig {
    url: string;
    platform: string;
    source: string;
}

/**
 * Google News RSS を使ったフィード一覧
 * フォーマット: https://news.google.com/rss/search?q=QUERY&hl=ja&gl=JP&ceid=JP:ja
 */
export const FEED_CONFIGS: FeedConfig[] = [
  {
        url: "https://news.google.com/rss/search?q=TikTok+%E3%83%A9%E3%82%A4%E3%83%96&hl=ja&gl=JP&ceid=JP:ja",
        platform: "TikTok",
        source: "RSS",
  },
  {
        url: "https://news.google.com/rss/search?q=Instagram+%E3%83%A9%E3%82%A4%E3%83%96%E9%85%8D%E4%BF%A1&hl=ja&gl=JP&ceid=JP:ja",
        platform: "Instagram",
        source: "RSS",
  },
  {
        url: "https://news.google.com/rss/search?q=Pococha&hl=ja&gl=JP&ceid=JP:ja",
        platform: "Pococha",
        source: "RSS",
  },
  {
        url: "https://news.google.com/rss/search?q=REALITY+%E3%83%A9%E3%82%A4%E3%83%96%E9%85%8D%E4%BF%A1&hl=ja&gl=JP&ceid=JP:ja",
        platform: "REALITY",
        source: "RSS",
  },
  {
        url: "https://news.google.com/rss/search?q=SHOWROOM+%E3%83%A9%E3%82%A4%E3%83%96&hl=ja&gl=JP&ceid=JP:ja",
        platform: "SHOWROOM",
        source: "RSS",
  },
  {
        url: "https://news.google.com/rss/search?q=%E3%83%A9%E3%82%A4%E3%83%96%E3%82%B3%E3%83%9E%E3%83%BC%E3%82%B9+%E6%97%A5%E6%9C%AC&hl=ja&gl=JP&ceid=JP:ja",
        platform: "TikTok",
        source: "RSS",
  },
  {
        url: "https://news.google.com/rss/search?q=17LIVE+OR+%E3%82%A4%E3%83%81%E3%83%8A%E3%83%8A&hl=ja&gl=JP&ceid=JP:ja",
        platform: "17LIVE",
        source: "RSS",
  },
  {
        url: "https://news.google.com/rss/search?q=%E3%83%A9%E3%82%A4%E3%83%96%E9%85%8D%E4%BF%A1+%E3%82%A2%E3%83%97%E3%83%AA&hl=ja&gl=JP&ceid=JP:ja",
        platform: "Pococha",
        source: "RSS",
  },
  ];

/**
 * 単一のRSSフィードを取得してArticle配列に変換
 */
export async function fetchFeed(
    config: FeedConfig
  ): Promise<Omit<Article, "createdAt">[]> {
    try {
          const feed = await parser.parseURL(config.url);
          const articles: Omit<Article, "createdAt">[] = [];

      for (const item of feed.items || []) {
              if (!item.title || !item.link) continue;

            // ── タイトルからプラットフォームを自動判定 ──
            const detectedPlatform = detectPlatform(item.title) || config.platform;

            // ── IDはURLのハッシュで一意にする ──
            const id = crypto
                .createHash("md5")
                .update(item.link)
                .digest("hex")
                .substring(0, 12);

            // ── サムネイル抽出 ──
            const thumbnail = extractThumbnail(item);

            // ── ソース名を抽出（Google Newsの場合、source が含まれる） ──
            const sourceName = (item as Record<string, unknown>).source
                ? String((item as Record<string, unknown>).source)
                      : config.source;

            articles.push({
                      id,
                      title: item.title.trim(),
                      url: item.link,
                      platform: detectedPlatform,
                      source: sourceName,
                      thumbnail,
                      publishedAt: item.isoDate || new Date().toISOString(),
            });
      }

      return articles;
    } catch (error) {
          console.error(`[RSS] フィード取得失敗: ${config.url}`, error);
          return [];
    }
}

/**
 * 全フィードを一括取得
 */
export async function fetchAllFeeds(): Promise<Omit<Article, "createdAt">[]> {
    const results = await Promise.allSettled(
          FEED_CONFIGS.map((config) => fetchFeed(config))
        );

  const allArticles: Omit<Article, "createdAt">[] = [];

  for (const result of results) {
        if (result.status === "fulfilled") {
                allArticles.push(...result.value);
        }
  }

  // URL重複を除去
  const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
          if (seen.has(a.url)) return false;
          seen.add(a.url);
          return true;
    });

  console.log(`[RSS] ${unique.length} 件の記事を取得しました`);
    return unique;
}

// ─── ヘルパー関数 ───

/** タイトルからプラットフォームを自動判定 */
function detectPlatform(title: string): string | null {
    const lower = title.toLowerCase();
    const platformKeywords: [string, string][] = [
          ["tiktok", "TikTok"],
          ["ティックトック", "TikTok"],
          ["instagram", "Instagram"],
          ["インスタグラム", "Instagram"],
          ["インスタ", "Instagram"],
          ["pococha", "Pococha"],
          ["ポコチャ", "Pococha"],
          ["reality", "REALITY"],
          ["showroom", "SHOWROOM"],
          ["17live", "17LIVE"],
          ["イチナナ", "17LIVE"],
          ["mildom", "Mildom"],
          ["ミルダム", "Mildom"],
          ["bigo", "BIGO LIVE"],
        ];

  for (const [keyword, platform] of platformKeywords) {
        if (lower.includes(keyword.toLowerCase())) {
                return platform;
        }
  }

  return null;
}

/** RSSアイテムからサムネイルURLを抽出 */
function extractThumbnail(
    item: Parser.Item & Record<string, unknown>
  ): string | null {
    // enclosure
  if (item.enclosure?.url) {
        return item.enclosure.url;
  }

  // content:encoded や description 内の <img> タグ
  const content =
        (item["content:encoded"] as string) ||
        item.content ||
        item.contentSnippet ||
        "";
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
          return imgMatch[1];
    }

  // media:thumbnail / media:content
  const media = item["media:thumbnail"] || item["media:content"];
    if (
          media &&
          typeof media === "object" &&
          "$" in (media as Record<string, unknown>)
        ) {
          return (
                  (media as Record<string, Record<string, string>>)["$"]?.url || null
                );
    }

  return null;
}
