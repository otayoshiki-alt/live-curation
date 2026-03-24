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
} from "lucide-react";
import {
  fetchArticles,
  fetchFavorites,
  addFavoriteApi,
  removeFavoriteApi,
  triggerRssFetch,
} from "@/lib/api-client";
import type { Article } from "@/types/article";

// âââ å®æ° âââ

type TabName =
  | "ãæ°ã«å¥ã"
  | "ãã¹ã¦"
  | "TikTok"
  | "Instagram"
  | "Pococha"
  | "REALITY"
  | "SHOWROOM"
  | "ãã®ä»ã¢ããª";

const TABS: TabName[] = [
  "ãæ°ã«å¥ã",
  "ãã¹ã¦",
  "TikTok",
  "Instagram",
  "Pococha",
  "REALITY",
  "SHOWROOM",
  "ãã®ä»ã¢ããª",
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


// âââ ã½ã¼ã¹ããã¸ âââ

function SourceBadge({ source }: { source: string }) {
  const configs: Record<string, { icon: typeof FileText; label: string; color: string }> = {
    X:          { icon: MessageCircle, label: "X",        color: "text-gray-800 bg-gray-100" },
    YouTube:    { icon: Youtube,       label: "YouTube",  color: "text-red-600 bg-red-50" },
    note:       { icon: FileText,      label: "note",     color: "text-green-700 bg-green-50" },
    "PR TIMES": { icon: ExternalLink,  label: "PR TIMES", color: "text-blue-700 bg-blue-50" },
    Webã¡ãã£ã¢: { icon: Globe,        label: "Web",      color: "text-purple-700 bg-purple-50" },
    å¬å¼ãã­ã°:  { icon: FileText,     label: "å¬å¼",     color: "text-orange-700 bg-orange-50" },
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

// âââ è¨äºã«ã¼ãï¼ã¿ã¤ãã«éè¦ã¬ã¤ã¢ã¦ãï¼ âââ

/** ãã©ãããã©ã¼ã å¥ã¢ã¯ã»ã³ãã«ã©ã¼ï¼å·¦ãã¼ãã¼ç¨ï¼ */
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
        {/* ãããã¼: ãã©ãããã©ã¼ã  + ã½ã¼ã¹ + ãæ°ã«å¥ã */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                article.platform === "Instagram" ? "" : platformClass
              }`}
              style={
                article.platform === "Instagram"
                  ? { background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)", color: "white", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 }
                  : undefined
              }
            >
              {article.platform}
            </span>
            <SourceBadge source={article.source} />
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(article.id); }}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            aria-label={isFavorite ? "ãæ°ã«å¥ãããåé¤" : "ãæ°ã«å¥ãã«è¿½å "}
          >
            <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-300"} />
          </button>
        </div>

        {/* ã¿ã¤ãã«ï¼å¤§ããã»è¤æ°è¡è¡¨ç¤ºï¼ */}
        <h3 className="text-base font-semibold text-gray-900 leading-relaxed line-clamp-3">
          {article.title}
        </h3>

        {/* ããã¿ã¼: æ¥æ */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          <span>{formatTime(article.publishedAt)}</span>
        </div>
      </div>
    </a>
  );
}

/** æ¥æããâ¯æéåããâ¯æ¥åãã®ãããªç¸å¯¾è¡¨ç¤ºã«å¤æ */
function formatTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "ãã£ãä»";
  if (diffMin < 60) return `${diffMin}åå`;
  if (diffHour < 24) return `${diffHour}æéå`;
  if (diffDay < 7) return `${diffDay}æ¥å`;
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

// âââ ã¡ã¤ã³ãã¼ã¸ âââ

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>("ãã¹ã¦");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteArticles, setFavoriteArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ââ è¨äºèª­ã¿è¾¼ã¿ ââ
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const platformParam =
        activeTab === "ãæ°ã«å¥ã" || activeTab === "ãã¹ã¦" || activeTab === "ãã®ä»ã¢ããª"
          ? undefined
          : activeTab;

      const data = await fetchArticles({
        platform: platformParam,
        search: searchQuery || undefined,
      });

      let filtered = data.articles;

      // ããã®ä»ã¢ããªãã®å ´åã¯ãã­ã³ãå´ã§é¤å¤
      if (activeTab === "ãã®ä»ã¢ããª") {
        filtered = filtered.filter((a) => !MAIN_PLATFORMS.includes(a.platform));
      }

      setArticles(filtered);
    } catch (err) {
      console.error("è¨äºåå¾ã¨ã©ã¼:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  // ââ ãæ°ã«å¥ãèª­ã¿è¾¼ã¿ ââ
  const loadFavorites = useCallback(async () => {
    try {
      const data = await fetchFavorites();
      setFavoriteIds(new Set(data.ids));
      setFavoriteArticles(data.articles);
    } catch (err) {
      console.error("ãæ°ã«å¥ãåå¾ã¨ã©ã¼:", err);
    }
  }, []);

  // ââ ååèª­ã¿è¾¼ã¿ ââ
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // ââ ã¿ãã»æ¤ç´¢å¤æ´æã«åèª­ã¿è¾¼ã¿ ââ
  useEffect(() => {
    if (activeTab !== "ãæ°ã«å¥ã") {
      loadArticles();
    }
  }, [activeTab, searchQuery, loadArticles]);

  // ââ ãæ°ã«å¥ããã°ã« ââ
  const toggleFavorite = useCallback(async (id: string) => {
    const isFav = favoriteIds.has(id);
    try {
      const result = isFav
        ? await removeFavoriteApi(id)
        : await addFavoriteApi(id);
      setFavoriteIds(new Set(result.ids));
      // ãæ°ã«å¥ãã¿ãè¡¨ç¤ºä¸­ãªãååå¾
      const favData = await fetchFavorites();
      setFavoriteArticles(favData.articles);
    } catch (err) {
      console.error("ãæ°ã«å¥ãæä½ã¨ã©ã¼:", err);
    }
  }, [favoriteIds]);

  // ââ RSSæååå¾ ââ
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await triggerRssFetch();
      alert(`â ${result.message}`);
      loadArticles();
    } catch {
      alert("â RSSåå¾ã«å¤±æãã¾ãã");
    } finally {
      setRefreshing(false);
    }
  };

  // ââ è¡¨ç¤ºããè¨äº ââ
  const displayArticles = activeTab === "ãæ°ã«å¥ã" ? favoriteArticles : articles;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ââ ãããã¼ ââ */}
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
            {/* RSSæ´æ°ãã¿ã³ */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="RSSæ´æ°"
              title="RSSãã£ã¼ããææ°ã«æ´æ°"
            >
              {refreshing ? (
                <Loader2 size={20} className="text-gray-500 animate-spin" />
              ) : (
                <RefreshCw size={20} className="text-gray-500" />
              )}
            </button>
            {/* éç¥ãã« */}
            <button
              onClick={() => alert("ð éç¥è¨­å®\n\nã©ã¤ãã³ãã¼ã¹ã»éä¿¡é¢é£ã®ææ°ãã¥ã¼ã¹ãããã·ã¥éç¥ã§ãå±ããã¾ãã\nï¼ãã®æ©è½ã¯ä»å¾å®è£äºå®ã§ãï¼")}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="éç¥"
            >
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* ââ æ¤ç´¢ + ã¿ã ââ */}
        <div className="max-w-7xl mx-auto px-4 pb-3 space-y-3">
          <div className="max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ã­ã¼ã¯ã¼ãã§æ¤ç´¢..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <div className="flex gap-1.5 min-w-max">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {tab}
                    {tab === "ãæ°ã«å¥ã" && (
                      <span className="ml-1 text-xs opacity-70">{favoriteIds.size}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ââ è¨äºã°ãªãã ââ */}
      <main className="max-w-7xl mx-auto px-4 py-5">
        {loading && activeTab !== "ãæ°ã«å¥ã" ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-gray-300 animate-spin" />
          </div>
        ) : displayArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-3">
              {activeTab === "ãæ°ã«å¥ã" ? <Heart size={48} className="mx-auto" /> : <Search size={48} className="mx-auto" />}
            </div>
            <p className="text-gray-400 text-sm">
              {activeTab === "ãæ°ã«å¥ã" ? "ãæ°ã«å¥ãã«è¿½å ãããè¨äºã¯ããã¾ãã" : "è©²å½ããè¨äºãè¦ã¤ããã¾ããã§ãã"}
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
        <div className="text-center text-xs text-gray-300 py-8">
          {displayArticles.length} ä»¶è¡¨ç¤ºä¸­
        </div>
      </main>

      {/* CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
