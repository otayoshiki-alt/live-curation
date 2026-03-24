import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = getArticles({ platform, search, limit, offset });

    return NextResponse.json({
      articles: result.articles,
      total: result.total,
      platform: platform || "すべて",
    });
  } catch (error) {
    console.error("[API] /api/articles エラー:", error);
    return NextResponse.json(
      { error: "記事の取得に失敗しました" },
      { status: 500 }
    );
  }
}
