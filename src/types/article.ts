// ─── 共通型定義 ───

export type Platform =
  | "TikTok"
  | "Instagram"
  | "Pococha"
  | "REALITY"
  | "SHOWROOM"
  | "17LIVE"
  | "Mildom"
  | "BIGO LIVE"
  | string; // 将来の拡張用

export type Source =
  | "note"
  | "PR TIMES"
  | "X"
  | "YouTube"
  | "Webメディア"
  | "公式ブログ"
  | "RSS"
  | string;

export interface Article {
  id: string;
  title: string;
  url: string;
  platform: Platform;
  source: Source;
  thumbnail: string | null;
  publishedAt: string; // ISO 8601
  createdAt: string;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  platform?: string;
}
