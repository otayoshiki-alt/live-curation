import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[Cron] RSS取得を開始します...");
    const articles = await fetchAllFeeds();
    console.log(`[Cron] ${articles.length} 件の記事を取得しました`);

    return NextResponse.json({
      success: true,
      message: `${articles.length} 件の記事を取得しました`,
      count: articles.length,
    });
  } catch (error) {
    console.error("[Cron] エラー:", error);
    return NextResponse.json(
      { error: "RSS取得に失敗しました", details: String(error) },
      { status: 500 }
    );
  }
}
