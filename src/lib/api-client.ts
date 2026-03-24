/**
 * フロントエンド用 APIクライアント
 */

import type { Article, ArticlesResponse } from "@/types/article";

const BASE = "/api";

// ─── 記事 ───

export async function fetchArticles(params?: {
  platform?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ArticlesResponse> {
  const query = new URLSearchParams();
  if (params?.platform) query.set("platform", params.platform);
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const res = await fetch(`${BASE}/articles?${query.toString()}`);
  if (!res.ok) throw new Error("記事の取得に失敗しました");
  return res.json();
}

// ─── お気に入り ───

export async function fetchFavorites(): Promise<{
  articles: Article[];
  ids: string[];
}> {
  const res = await fetch(`${BASE}/favorites`);
  if (!res.ok) throw new Error("お気に入りの取得に失敗しました");
  return res.json();
}

export async function addFavoriteApi(
  articleId: string
): Promise<{ ids: string[] }> {
  const res = await fetch(`${BASE}/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId }),
  });
  if (!res.ok) throw new Error("お気に入りの追加に失敗しました");
  return res.json();
}

export async function removeFavoriteApi(
  articleId: string
): Promise<{ ids: string[] }> {
  const res = await fetch(`${BASE}/favorites`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId }),
  });
  if (!res.ok) throw new Error("お気に入りの削除に失敗しました");
  return res.json();
}

// ─── Cron（RSS取得） ───

export async function triggerRssFetch(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const res = await fetch(`${BASE}/cron`);
  if (!res.ok) throw new Error("RSS取得に失敗しました");
  return res.json();
}
