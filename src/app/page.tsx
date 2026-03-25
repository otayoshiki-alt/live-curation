"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Search,
  Heart,
  Clock,
  X,
  FileText,
  Youtube,
  Globe,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  fetchArticles,
  fetchFavorites,
  addFavoriteApi,
  removeFavoriteApi,
  triggerRssFetch,
} from "@/lib/api-client";
import type { Article } from "@/types/article";

// ─── 定数 ───
const PAGE_SIZE = 50;

type TabName =
  | "お気に入り"
  | "すべて"
  | "TikTok"
  | "Instagram"
  | "Pococha"
  | "REALITY"
  | "SHOWROOM"
  | "その他アプリ";

const TABS: TabName[] = [
  "お気に入り",
  "すべて",
  "TikTok",
  "Instagram",
  "Pococha",
  "REALITY",
  "SHOWROOM",
  "その他アプリ",
];

const MAIN_PLATFORMS = ["TikTok", "Instagram", "Pococha", "REALITY", "SHOWROOM"];

const PLATFORM_COLORS: Record<string, string> = {
  TikTok: "bg-gray-900 text-white",
  Pococha: "bg-blue-500 text-white",
  REALITY: "bg-yellow-400 text-gray-900",
  SHOWROOM: "bg-red-500 text-white",
  "17LIVE": "bg-teal-500 text-white",
  Mildom: "bg-indigo-500 text-white",
  "BIGO LIVE": "bg-cyan-500 text-white",
};

// ─── ソースバッジ ───
function SourceBadge({ source }: { source: string }) {
  const configs: Record<string, { icon: typeof FileText; label: string; color: string }> = {
    X: { icon: MessageCircle, label: "X", color: "text-gray-800 bg-gray-100" },
    YouTube: { icon: Youtube, label: "YouTube", color: "text-red-600 bg-red-50" },
    note: { icon: FileText, label: "note", color: "text-green-700 bg-green-50" },
    "PR TIMES": { icon: ExternalLink, label: "PR TIMES", color: "text-blue-700 bg-blue-50" },
    Webメディア: { icon: Globe, label: "Web", color: "text-purple-700 bg-purple-50" },
    公式ブログ: { icon: FileText, label: "公式", color: "text-orange-700 bg-orange-50" },
    RSS: { icon: Globe, label: "RSS", color: "text-amber-700 bg-amber-50" },
  };
  const config = configs[source] || configs["RSS"];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${config.color}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

// ─── 記事カード（タイトル重視レイアウト） ───
/** プラットフォーム別アクセントカラー（左ボーダー用） */
const PLATFORM_ACCENT: Record<string, string> = {
  TikTok: "#010101",
  Instagram: "#E1306C",
  Pococha: "#0077b6",
  REALITY: "#f9d423",
  SHOWROOM: "#ff4b2b",
  "17LIVE": "#00b09b",
  Mildom: "#4568dc",
  "BIGO LIVE": "#1cb5e0",
};

function ArticleCard({
  article,
  isFavorite,
  onToggleFavorite,
}: {
  article: Article;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const platformClass = PLATFORM_COLORS[article.platform] || "bg-gray-500 text-white";
  const accentColor = PLATFORM_ACCENT[article.platform] || "#6366f1";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* ヘッダー: プラットフォーム + ソース + お気に入り */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                article.platform === "Instagram" ? "" : platformClass
              }`}
              style={
                article.platform === "Instagram"
                  ? {
                      background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }
                  : undefined
              }
            >
              {article.platform}
            </span>
            <SourceBadge source={article.source} />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(article.id);
            }}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
          >
            <Heart
              size={16}
              className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-300"}
            />
          </button>
        </div>

        {/* タイトル（大きめ・複数行表示） */}
        <h3 className="text-base font-semibold text-gray-900 leading-relaxed line-clamp-3">
          {article.title}
        </h3>

        {/* フッター: 日時 */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          <span>{formatTime(article.publishedAt)}</span>
        </div>
      </div>
    </a>
  );
}

/** 日時を「◯時間前」「◯日前」のような相対表示に変換 */
function formatTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

// ─── メインページ ───
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteArticles, setFavoriteArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── 記事読み込み（初回 or タブ/検索変更時） ──
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const platformParam =
        activeTab === "お気に入り" || activeTab === "すべて" || activeTab === "その他アプリ"
          ? undefined
          : activeTab;

      const data = await fetchArticles({
        platform: platformParam,
        search: searchQuery || undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });

      let filtered = data.articles;

      // 「その他アプリ」の場合はフロント側で除外
      if (activeTab === "その他アプリ") {
        filtered = filtered.filter((a) => !MAIN_PLATFORMS.includes(a.platform));
      }

      setArticles(filtered);
      setTotalArticles(data.total);
    } catch (err) {
      console.error("記事取得エラー:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  // ── もっと読み込む ──
  const loadMore = useCallback(async () => {
    try {
      setLoadingMore(true);
      const platformParam =
        activeTab === "お気に入り" || activeTab === "すべて" || activeTab === "その他アプリ"
          ? undefined
          : activeTab;

      const data = await fetchArticles({
        platform: platformParam,
        search: searchQuery || undefined,
        limit: PAGE_SIZE,
        offset: articles.length,
      });

      let newArticles = data.articles;

      if (activeTab === "その他アプリ") {
        newArticles = newArticles.filter((a) => !MAIN_PLATFORMS.includes(a.platform));
      }

      setArticles((prev) => [...prev, ...newArticles]);
      setTotalArticles(data.total);
    } catch (err) {
      console.error("追加読み込みエラー:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, searchQuery, articles.length]);

  // ── お気に入り読み込み ──
  const loadFavorites = useCallback(async () => {
    try {
      const data = await fetchFavorites();
      setFavoriteIds(new Set(data.ids));
      setFavoriteArticles(data.articles);
    } catch (err) {
      console.error("お気に入り取得エラー:", err);
    }
  }, []);

  // ── 初回読み込み ──
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // ── タブ・検索変更時に再読み込み ──
  useEffect(() => {
    if (activeTab !== "お気に入り") {
      loadArticles();
    }
  }, [activeTab, searchQuery, loadArticles]);

  // ── お気に入りトグル ──
  const toggleFavorite = useCallback(async (id: string) => {
    const isFav = favoriteIds.has(id);
    try {
      const result = isFav
        ? await removeFavoriteApi(id)
        : await addFavoriteApi(id);
      setFavoriteIds(new Set(result.ids));

      // お気に入りタブ表示中なら再取得
      const favData = await fetchFavorites();
      setFavoriteArticles(favData.articles);
    } catch (err) {
      console.error("お気に入り操作エラー:", err);
    }
  }, [favoriteIds]);

  // ── RSS手動取得 ──
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await triggerRssFetch();
      alert(`✅ ${result.message}`);
      loadArticles();
    } catch {
      alert("❌ RSS取得に失敗しました");
    } finally {
      setRefreshing(false);
    }
  };

  // ── 表示する記事 ──
  const displayArticles = activeTab === "お気に入り" ? favoriteArticles : articles;
  const hasMore = activeTab !== "お気に入り" && articles.length < totalArticles;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── ヘッダー ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
            >
              LC
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LiveCuration</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* RSS更新ボタン */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="RSS更新"
              title="RSSフィードを最新に更新"
            >
              {refreshing ? (
                <Loader2 size={20} className="text-gray-500 animate-spin" />
              ) : (
                <RefreshCw size={20} className="text-gray-500" />
              )}
            </button>

            {/* 通知ベル */}
            <button
              onClick={() =>
                alert(
                  "🔔 通知設定\n\nライブコマース・配信関連の最新ニュースをプッシュ通知でお届けします。\n（この機能は今後実装予定です）"
                )
              }
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="通知"
            >
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* ── 検索 + タブ ── */}
        <div className="max-w-7xl mx-auto px-4 pb-3 space-y-3">
          <div className="max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="キーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            <div className="flex gap-1.5 min-w-max">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gray-900 text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {tab}
                    {tab === "お気に入り" && (
                      <span className="ml-1 text-xs opacity-70">{favoriteIds.size}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ── 記事グリッド ── */}
      <main className="max-w-7xl mx-auto px-4 py-5">
        {loading && activeTab !== "お気に入り" ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-gray-300 animate-spin" />
          </div>
        ) : displayArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-3">
              {activeTab === "お気に入り" ? (
                <Heart size={48} className="mx-auto" />
              ) : (
                <Search size={48} className="mx-auto" />
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {activeTab === "お気に入り"
                ? "お気に入りに追加された記事はありません"
                : "該当する記事が見つかりませんでした"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {displayArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isFavorite={favoriteIds.has(article.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* もっと見るボタン */}
        {hasMore && !loading && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ChevronDown size={16} />
              )}
              {loadingMore ? "読み込み中..." : "もっと見る"}
            </button>
          </div>
        )}

        <div className="text-center text-xs text-gray-300 py-8">
          {displayArticles.length}
          {activeTab !== "お気に入り" && totalArticles > 0
            ? ` / ${totalArticles}`
            : ""}
          {" 件表示中"}
        </div>
      </main>

      {/* CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
