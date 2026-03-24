/**
 * 記事データストア
 *
 * Vercel（サーバーレス）でも SQLite なしですぐ動くように、
 * メモリ上にデータを保持する。
 *
 * ⚠️ サーバーレス環境ではリクエストごとにプロセスが再起動される
 *    可能性があるため、RSS取得した記事はモック記事とマージして保持する。
 *    完全な永続化が必要な場合は DB / KV に差し替え。
 */

import type { Article } from "@/types/article";

// ─── 初期モックデータ（RSS取得前のサンプル） ───
const SEED_ARTICLES: Article[] = [
  { id: "seed01", title: "TikTok、ライブコマース機能「TikTok Shop」日本版を2026年夏に正式ローンチへ", platform: "TikTok", source: "PR TIMES", thumbnail: "https://picsum.photos/seed/tiktok1/400/300", url: "https://example.com/1", publishedAt: "2026-03-24T12:00:00Z", createdAt: "2026-03-24T12:00:00Z" },
  { id: "seed02", title: "Instagram、リール×ライブ配信の新ハイブリッド機能をテスト中", platform: "Instagram", source: "Webメディア", thumbnail: "https://picsum.photos/seed/insta2/400/300", url: "https://example.com/2", publishedAt: "2026-03-24T11:00:00Z", createdAt: "2026-03-24T11:00:00Z" },
  { id: "seed03", title: "Pococha、配信者収益が前年比150%増——国内ライブ配信市場を牽引", platform: "Pococha", source: "PR TIMES", thumbnail: "https://picsum.photos/seed/poco3/400/300", url: "https://example.com/3", publishedAt: "2026-03-24T10:00:00Z", createdAt: "2026-03-24T10:00:00Z" },
  { id: "seed04", title: "REALITY、アバター×AIチャット機能を搭載した次世代ライブ配信を発表", platform: "REALITY", source: "note", thumbnail: "https://picsum.photos/seed/reality4/400/300", url: "https://example.com/4", publishedAt: "2026-03-24T09:00:00Z", createdAt: "2026-03-24T09:00:00Z" },
  { id: "seed05", title: "SHOWROOM、企業向けライブコマースプランを新設——EC連携を強化", platform: "SHOWROOM", source: "PR TIMES", thumbnail: "https://picsum.photos/seed/show5/400/300", url: "https://example.com/5", publishedAt: "2026-03-24T08:00:00Z", createdAt: "2026-03-24T08:00:00Z" },
];

// ─── メモリ上の記事ストア（RSS取得分 + モック） ───
let articles: Article[] = [...SEED_ARTICLES];

// メモリ上のお気に入り
let favoriteIds: Set<string> = new Set();

// ─── RSS記事の追加（upsert） ───

/**
 * RSS取得した記事をストアに追加する。
 * 同じIDの記事が既にある場合はスキップ（重複防止）。
 * 追加後、publishedAt の新しい順にソートする。
 */
export function upsertArticles(
  newArticles: Omit<Article, "createdAt">[]
): number {
  const existingIds = new Set(articles.map((a) => a.id));
  let addedCount = 0;

  for (const article of newArticles) {
    if (existingIds.has(article.id)) continue;

    articles.push({
      ...article,
      createdAt: new Date().toISOString(),
    });
    existingIds.add(article.id);
    addedCount++;
  }

  // 新しい記事を上に（publishedAt降順）
  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // RSS取得後にモック記事（example.com）を除去
  if (addedCount > 0) {
    articles = articles.filter(
      (a) => !a.url.startsWith("https://example.com/")
    );
  }

  console.log(
    `[Store] ${addedCount} 件追加, 合計 ${articles.length} 件`
  );
  return addedCount;
}

// ─── 記事取得 ───

export function getArticles(options?: {
  platform?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): { articles: Article[]; total: number } {
  let filtered = [...articles];

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
  return articles.filter((a) => favoriteIds.has(a.id));
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
