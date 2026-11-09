export type NewsTopic = "節慶／活動" | "電力／網路" | "重大突發" | "一般新聞";
export interface NewsArticle {
  title: string;
  url: string;
  publishedAt: string;
  sourceId: string;
  region: "VN";
  topic: NewsTopic;
}
export interface NewsSourceState {
  id: string;
  status: "ok" | "failed";
  checkedAt: string;
  lastSuccessAt: string | null;
  articleCount: number;
}
export interface NewsSnapshot {
  schemaVersion: 1;
  region: "VN";
  checkedAt: string;
  sources: NewsSourceState[];
  articles: NewsArticle[];
}
export interface NewsGroup {
  title: string;
  publishedAt: string;
  articles: NewsArticle[];
}
