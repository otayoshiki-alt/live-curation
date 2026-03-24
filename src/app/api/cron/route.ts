/**
 * GET /api/cron
 *
 * RSSフィードを取得し、メモリストアに保存する。
 *
 * 使い方:
 * 1. 手動実行: フロントの🔄ボタン or ブラウザで /api/cron にアクセス
 * 2. 定期実行: Vercel Cron Jobs で自動実行（vercel.json で設定済み）
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { upsertArticles } from "@/lib/mock-data";

// Next.js App Router: キャッシュを無効化して毎回実行する
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ── 本番環境での認証チェック（オプション） ──
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[Cron] RSS取得を開始します...");

    // ── RSSフィードを全て取得 ──
    const fetchedArticles = await fetchAllFeeds();

    console.log(`[Cron] ${fetchedArticles.length} 件の記事をRSSから取得`);

    // ── メモリストアに保存 ──
    const addedCount = upsertArticles(fetchedArticles);

    const message = `${fetchedArticles.length} 件取得、${addedCount} 件を新規追加しました`;
    console.log(`[Cron] ${message}`);

    return NextResponse.json({
      success: true,
      message,
      fetched: fetchedArticles.length,
      added: addedCount,
    });
  } catch (error) {
    console.error("[Cron] エラー:", error);
    return NextResponse.json(
      { error: "RSS取得に失敗しました", details: String(error) },
      { status: 500 }
    );
  }
}
