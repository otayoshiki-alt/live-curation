import { NextRequest, NextResponse } from "next/server";
import { getFavorites, getFavoriteIds, addFavorite, removeFavorite } from "@/lib/mock-data";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = getFavorites();
    const ids = getFavoriteIds();
    return NextResponse.json({ articles, ids });
  } catch (error) {
    console.error("[API] GET /api/favorites エラー:", error);
    return NextResponse.json({ error: "お気に入りの取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = body;
    if (!articleId) {
      return NextResponse.json({ error: "articleId は必須です" }, { status: 400 });
    }
    addFavorite(articleId);
    const ids = getFavoriteIds();
    return NextResponse.json({ success: true, ids });
  } catch (error) {
    console.error("[API] POST /api/favorites エラー:", error);
    return NextResponse.json({ error: "お気に入りの追加に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = body;
    if (!articleId) {
      return NextResponse.json({ error: "articleId は必須です" }, { status: 400 });
    }
    removeFavorite(articleId);
    const ids = getFavoriteIds();
    return NextResponse.json({ success: true, ids });
  } catch (error) {
    console.error("[API] DELETE /api/favorites エラー:", error);
    return NextResponse.json({ error: "お気に入りの削除に失敗しました" }, { status: 500 });
  }
}
