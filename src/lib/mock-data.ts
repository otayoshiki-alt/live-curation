/**
 * モックデータ
 *
 * Vercel（サーバーレス）でも SQLite なしですぐ動くように、
 * メモリ上にデータを保持する。
 */

import type { Article } from "@/types/article";

// ─── モックデータ（15件） ───
const ARTICLES: Article[] = [
  { id: "seed01", title: "TikTok、ライブコマース機能「TikTok Shop」日本版を2026年夏に正式ローンチへ", platform: "TikTok", source: "PR TIMES", thumbnail: "https://picsum.photos/seed/tiktok1/400/300", url: "https://example.com/1", publishedAt: "2026-03-24T12:00:00Z", createdAt: "2026-03-24T12:00:00Z" },
  { id: "seed02", title: "Instagram、リール×ライブ配信の新ハイブリッド機能をテスト中", platform: "Instagram", source: "Webメディア", thumbnail: "https://picsum.photos/seed/insta2/400/300", url: "https://example.com/2", publishedAt: "2026-03-24T11:00:00Z", createdAt: "2026-03-24T11:00:00Z" },
  { id: "seed03", title: "Pococha、配信者収益が前年比150%増——国内ライブ配信市場を牽引", platform: "Pococha", source: "PR TIMES", thumbnail: "https://picsum.photos/seed/poco3/400/300", url: "https://example.com/3", publishedAt: "2026-03-24T10:00:00Z", createdAt: "2026-03-24T10:00:00Z" },
  { id: "seed04", title: "REALITY、アバター×AIチャット機能を搭載した次世代ライブ配信を発表", platform: "REALITY", source: "note", thumbnail: "https://picsum.photos/seed/reality4/400/300", url: "https://example.com/4", publishedAt: "2026-03-24T09:00:00Z", createdAt: "2026-03-24T09:00:00Z" },
  { id: "seed05", title: "SHOWROOM、企業向けライブコマースプランを新設——EC連携を強化", platform: "SHOWROOM", source: "PR TIMES", thumbnail: "https://picsum.photos/seed/show5/400/300", url: "https://example.com/5", publishedAt: "2026-03-24T08:00:00Z", createdAt: "2026-03-24T08:00:00Z" },
  { id: "seed06", title: "17LIVE、グローバル配信者数が5000万人を突破——日本が最大市場に", platform: "17LIVE", source: "X", thumbnail: "https://picsum.photos/seed/17live6/400/300", url: "https://example.com/6", publishedAt: "2026-03-24T07:00:00Z", createdAt: "2026-03-24T07:00:00Z" },
  { id: "seed07", title: "TikTokライブで月収100万円超えの配信者が急増中——その秘訣とは", platform: "TikTok", source: "YouTube", thumbnail: "https://picsum.photos/seed/tiktok7/400/300", url: "https://example.com/7", publishedAt: "2026-03-24T06:00:00Z", createdAt: "2026-03-24T06:00:00Z" },
  { id: "seed08", title: "Instagram、ライブ配信中のショッピングタグ機能を全ユーザーに開放", platform: "Instagram", source: "Webメディア", thumbnail: "https://picsum.photos/seed/insta8/400/300", url: "https://example.com/8", publishedAt: "2026-03-24T04:00:00Z", createdAt: "2026-03-24T04:00:00Z" },
  { id: "seed09", title: "Pococha主催の大型イベント「Pococha LIVE FES 2026」開催決定", platform: "Pococha", source: "公式ブログ", thumbnail: "https://picsum.photos/seed/poco9/400/300", url: "https://example.com/9", publishedAt: "2026-03-24T02:00:00Z", createdAt: "2026-03-24T02:00:00Z" },
  { id: "seed10", title: "REALITY×VTuber事務所コラボ——新たなバーチャルライブ配信の形", platform: "REALITY", source: "note", thumbnail: "https://picsum.photos/seed/reality10/400/300", url: "https://example.com/10", publishedAt: "2026-03-23T22:00:00Z", createdAt: "2026-03-23T22:00:00Z" },
  { id: "seed11", title: "SHOWROOMオーディション発の新アイドルグループがデビュー決定", platform: "SHOWROOM", source: "X", thumbnail: "https://picsum.photos/seed/show11/400/300", url: "https://example.com/11", publishedAt: "2026-03-23T20:00:00Z", createdAt: "2026-03-23T20:00:00Z" },
  { id: "seed12", title: "Mildom、ゲーム実況特化のライブコマース機能を追加——ゲーミングデバイスを販売", platform: "Mildom", source: "PR TIMES", thumbnail: "https://picsum.photos/seed/mildom12/400/300", url: "https://example.com/12", publishedAt: "2026-03-23T18:00:00Z", createdAt: "2026-03-23T18:00:00Z" },
  { id: "seed13", title: "TikTok LIVE、投げ銭ランキング機能をリニューアル——透明性を強化", platform: "TikTok", source: "Webメディア", thumbnail: "https://picsum.photos/seed/tiktok13/400/300", url: "https://example.com/13", publishedAt: "2026-03-23T12:00:00Z", createdAt: "2026-03-23T12:00:00Z" },
  { id: "seed14", title: "BIGO LIVEが日本語AIリアルタイム翻訳機能を実装——海外配信者との交流が容易に", platform: "BIGO LIVE", source: "YouTube", thumbnail: "https://picsum.photos/seed/bigo14/400/300", url: "https://example.com/14", publishedAt: "2026-03-23T12:00:00Z", createdAt: "2026-03-23T12:00:00Z" },
  { id: "seed15", title: "ライブコマース市場規模、2026年に国内1兆円突破の見込み——各プラットフォーム比較", platform: "Instagram", source: "note", thumbnail: "https://picsum.photos/seed/market15/400/300", url: "https://example.com/15", publishedAt: "2026-03-22T12:00:00Z", createdAt: "2026-03-22T12:00:00Z" },
];

// メモリ上のお気に入り
let favoriteIds: Set<string> = new Set();

// ─── 記事 ───

export function getArticles(options?: {
  platform?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): { articles: Article[]; total: number } {
  let filtered = [...ARTICLES];
  if (options?.platform && options.platform !== "すべて") {
    filtered = filtered.filter((a) => a.platform === options.platform);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.platform.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q)
    );
  }
  const total = filtered.length;
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  filtered = filtered.slice(offset, offset + limit);
  return { articles: filtered, total };
}

// ─── お気に入り ───

export function getFavorites(): Article[] {
  return ARTICLES.filter((a) => favoriteIds.has(a.id));
}

export function getFavoriteIds(): string[] {
  return [...favoriteIds];
}

export function addFavorite(articleId: string): void {
  favoriteIds.add(articleId);
}

export function removeFavorite(articleId: string): void {
  favoriteIds.delete(articleId);
}
