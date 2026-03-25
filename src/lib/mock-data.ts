/**
 * 記事データストア（Vercel KV 永続化版）
 *
 * Upstash Redis (Vercel KV) を使って記事とお気に入りを永続化。
 * KV が利用できない場合はインメモリにフォールバック。
 */

import { kv } from "@vercel/kv";
import type { Article } from "@/types/article";

// ─── KV キー定義 ───
const KV_ARTICLES_KEY = "articles";
const KV_FAVORITES_KEY = "favorites";

// ─── フォールバック用インメモリストア ───
let memoryArticles: Article[] = [];
let memoryFavoriteIds: string[] = [];

// ─── KV が利用可能かチェック ───
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ─── RSS記事の追加（upsert） ───
export async function upsertArticles(
  newArticles: Omit<Article, "createdAt">[]
): Promise<number> {
  try {
    if (!isKVAvailable()) {
      return upsertArticlesMemory(newArticles);
    }

    // KV から既存記事を取得
    let existing: Article[] = (await kv.get<Article[]>(KV_ARTICLES_KEY)) || [];

    const existingIds = new Set(existing.map((a) => a.id));
    let addedCount = 0;

    for (const article of newArticles) {
      if (existingIds.has(article.id)) continue;
      existing.push({
        ...article,
        createdAt: new Date().toISOString(),
      });
      existingIds.add(article.id);
      addedCount++;
    }

    // publishedAt 降順ソート
    existing.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // RSS取得後にモック記事を除去
    if (addedCount > 0) {
      existing = existing.filter(
        (a) => !a.url.startsWith("https://example.com/")
      );
    }

    // KV に保存
    await kv.set(KV_ARTICLES_KEY, existing);

    console.log(`[Store/KV] ${addedCount} 件追加, 合計 ${existing.length} 件`);
    return addedCount;
  } catch (error) {
    console.error("[Store/KV] upsertArticles エラー:", error);
    return upsertArticlesMemory(newArticles);
  }
}

// ─── 記事取得 ───
export async function getArticles(options?: {
  platform?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ articles: Article[]; total: number }> {
  try {
    let articles: Article[];

    if (isKVAvailable()) {
      articles = (await kv.get<Article[]>(KV_ARTICLES_KEY)) || [];
    } else {
      articles = [...memoryArticles];
    }

    // フィルタリング
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
  } catch (error) {
    console.error("[Store/KV] getArticles エラー:", error);
    return { articles: [], total: 0 };
  }
}

// ─── お気に入り ───
export async function getFavorites(): Promise<Article[]> {
  try {
    const ids = await getFavoriteIds();
    if (ids.length === 0) return [];

    let articles: Article[];
    if (isKVAvailable()) {
      articles = (await kv.get<Article[]>(KV_ARTICLES_KEY)) || [];
    } else {
      articles = [...memoryArticles];
    }

    const idSet = new Set(ids);
    return articles.filter((a) => idSet.has(a.id));
  } catch (error) {
    console.error("[Store/KV] getFavorites エラー:", error);
    return [];
  }
}

export async function getFavoriteIds(): Promise<string[]> {
  try {
    if (isKVAvailable()) {
      return (await kv.get<string[]>(KV_FAVORITES_KEY)) || [];
    }
    return [...memoryFavoriteIds];
  } catch (error) {
    console.error("[Store/KV] getFavoriteIds エラー:", error);
    return [];
  }
}

export async function addFavorite(articleId: string): Promise<void> {
  try {
    if (isKVAvailable()) {
      const ids = (await kv.get<string[]>(KV_FAVORITES_KEY)) || [];
      if (!ids.includes(articleId)) {
        ids.push(articleId);
        await kv.set(KV_FAVORITES_KEY, ids);
      }
    } else {
      if (!memoryFavoriteIds.includes(articleId)) {
        memoryFavoriteIds.push(articleId);
      }
    }
  } catch (error) {
    console.error("[Store/KV] addFavorite エラー:", error);
  }
}

export async function removeFavorite(articleId: string): Promise<void> {
  try {
    if (isKVAvailable()) {
      const ids = (await kv.get<string[]>(KV_FAVORITES_KEY)) || [];
      const filtered = ids.filter((id) => id !== articleId);
      await kv.set(KV_FAVORITES_KEY, filtered);
    } else {
      memoryFavoriteIds = memoryFavoriteIds.filter((id) => id !== articleId);
    }
  } catch (error) {
    console.error("[Store/KV] removeFavorite エラー:", error);
  }
}

// ─── インメモリフォールバック ───
function upsertArticlesMemory(
  newArticles: Omit<Article, "createdAt">[]
): number {
  const existingIds = new Set(memoryArticles.map((a) => a.id));
  let addedCount = 0;

  for (const article of newArticles) {
    if (existingIds.has(article.id)) continue;
    memoryArticles.push({
      ...article,
      createdAt: new Date().toISOString(),
    });
    existingIds.add(article.id);
    addedCount++;
  }

  memoryArticles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  if (addedCount > 0) {
    memoryArticles = memoryArticles.filter(
      (a) => !a.url.startsWith("https://example.com/")
    );
  }

  console.log(
    `[Store/Memory] ${addedCount} 件追加, 合計 ${memoryArticles.length} 件`
  );
  return addedCount;
}

