"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, Search, Heart, Clock, X, FileText, Youtube,
  Globe, MessageCircle, ExternalLink, RefreshCw, Loader2,
} from "lucide-react";
import {
  fetchArticles, fetchFavorites, addFavoriteApi,
  removeFavoriteApi, triggerRssFetch,
} from "@/lib/api-client";
import type { Article } from "@/types/article";

type TabName = "お気に入り" | "すべて" | "TikTok" | "Instagram" | "Pococha" | "REALITY" | "SHOWROOM" | "その他アプリ";

const TABS: TabName[] = ["お気に入り", "すべて", "TikTok", "Instagram", "Pococha", "REALITY", "SHOWROOM", "その他アプリ"];
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

function SourceBadge({ source }: { source: string }) {
  const configs: Record<string, { icon: typeof FileText; label: string; color: string }> = {
    X:          { icon: MessageCircle, label: "X",        color: "text-gray-800 bg-gray-100" },
    YouTube:    { icon: Youtube,       label: "YouTube",  color: "text-red-600 bg-red-50" },
    note:       { icon: FileText,      label: "note",     color: "text-green-700 bg-green-50" },
    "PR TIMES": { icon: ExternalLink,  label: "PR TIMES", color: "text-blue-700 bg-blue-50" },
    "Webメディア": { icon: Globe,      label: "Web",      color: "text-purple-700 bg-purple-50" },
    "公式ブログ":  { icon: FileText,   label: "公式",     color: "text-orange-700 bg-orange-50" },
    RSS:        { icon: Globe,         label: "RSS",      color: "text-amber-700 bg-amber-50" },
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

function ArticleCard({ article, isFavorite, onToggleFavorite }: {
  article: Article; isFavorite: boolean; onToggleFavorite: (id: string) => void;
}) {
  const platformClass = PLATFORM_COLORS[article.platform] || "bg-gray-500 text-white";
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
      <div className="flex flex-row sm:flex-col">
        <div className="relative w-28 min-h-[90px] sm:w-full sm:h-40 flex-shrink-0 overflow-hidden bg-gray-200">
          {article.thumbnail ? (
            <img src={article.thumbnail} alt="" loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-200">
              <span className="text-2xl font-bold text-gray-400">{article.platform.charAt(0)}</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${article.platform === "Instagram" ? "" : platformClass}`}
              style={article.platform === "Instagram" ? { background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)", color: "white", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 } : undefined}>
              {article.platform}
            </span>
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(article.id); }}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 active:scale-90 transition-transform"
            aria-label={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}>
            <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
        </div>
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap"><SourceBadge source={article.source} /></div>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-0 line-clamp-2 sm:line-clamp-3">{article.title}</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
            <Clock size={12} /><span>{formatTime(article.publishedAt)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteArticles, setFavoriteArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const platformParam = activeTab === "お気に入り" || activeTab === "すべて" || activeTab === "その他アプリ" ? undefined : activeTab;
      const data = await fetchArticles({ platform: platformParam, search: searchQuery || undefined });
      let filtered = data.articles;
      if (activeTab === "その他アプリ") {
        filtered = filtered.filter((a) => !MAIN_PLATFORMS.includes(a.platform));
      }
      setArticles(filtered);
    } catch (err) { console.error("記事取得エラー:", err); }
    finally { setLoading(false); }
  }, [activeTab, searchQuery]);

  const loadFavorites = useCallback(async () => {
    try {
      const data = await fetchFavorites();
      setFavoriteIds(new Set(data.ids));
      setFavoriteArticles(data.articles);
    } catch (err) { console.error("お気に入り取得エラー:", err); }
  }, []);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);
  useEffect(() => { if (activeTab !== "お気に入り") loadArticles(); }, [activeTab, searchQuery, loadArticles]);

  const toggleFavorite = useCallback(async (id: string) => {
    const isFav = favoriteIds.has(id);
    try {
      const result = isFav ? await removeFavoriteApi(id) : await addFavoriteApi(id);
      setFavoriteIds(new Set(result.ids));
      const favData = await fetchFavorites();
      setFavoriteArticles(favData.articles);
    } catch (err) { console.error("お気に入り操作エラー:", err); }
  }, [favoriteIds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await triggerRssFetch();
      alert(`✅ ${result.message}`);
      loadArticles();
    } catch { alert("❌ RSS取得に失敗しました"); }
    finally { setRefreshing(false); }
  };

  const displayArticles = activeTab === "お気に入り" ? favoriteArticles : articles;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}>LC</div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LiveCuration</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50" aria-label="RSS更新">
              {refreshing ? <Loader2 size={20} className="text-gray-500 animate-spin" /> : <RefreshCw size={20} className="text-gray-500" />}
            </button>
            <button onClick={() => alert("🔔 通知設定\n\nこの機能は今後実装予定です")}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="通知">
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 space-y-3">
          <div className="max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="キーワードで検索..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <div className="flex gap-1.5 min-w-max">
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === tab ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {tab}{tab === "お気に入り" && <span className="ml-1 text-xs opacity-70">{favoriteIds.size}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-5">
        {loading && activeTab !== "お気に入り" ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-gray-300 animate-spin" /></div>
        ) : displayArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-3">{activeTab === "お気に入り" ? <Heart size={48} className="mx-auto" /> : <Search size={48} className="mx-auto" />}</div>
            <p className="text-gray-400 text-sm">{activeTab === "お気に入り" ? "お気に入りに追加された記事はありません" : "該当する記事が見つかりませんでした"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {displayArticles.map((article) => (
              <ArticleCard key={article.id} article={article} isFavorite={favoriteIds.has(article.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
        <div className="text-center text-xs text-gray-300 py-8">{displayArticles.length} 件表示中</div>
      </main>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
