import sources from "../data/news-sources.json";
import type {
  NewsArticle,
  NewsGroup,
  NewsSnapshot,
  NewsTopic,
} from "../types/news";
export const newsSources = sources;
export const newsTopics: NewsTopic[] = [
  "節慶／活動",
  "電力／網路",
  "重大突發",
  "一般新聞",
];
export const sourceLabels = {
  ok: "RSS 最近擷取成功",
  failed: "擷取失敗／可用性未確認",
};
const validDate = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
function validArticle(value: unknown): value is NewsArticle {
  if (!value || typeof value !== "object") return false;
  const a = value as NewsArticle;
  const source = newsSources.find((s) => s.id === a.sourceId);
  if (
    !source ||
    typeof a.title !== "string" ||
    !a.title.trim() ||
    a.title.length > 250 ||
    a.region !== "VN" ||
    !newsTopics.includes(a.topic) ||
    !validDate(a.publishedAt)
  )
    return false;
  try {
    const url = new URL(a.url);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.search &&
      !url.hash &&
      source.articleHosts.includes(url.hostname)
    );
  } catch {
    return false;
  }
}
export function validateNews(value: unknown): NewsSnapshot {
  if (!value || typeof value !== "object") throw Error("新聞資料格式錯誤");
  const n = value as NewsSnapshot;
  if (
    n.schemaVersion !== 1 ||
    n.region !== "VN" ||
    !validDate(n.checkedAt) ||
    !Array.isArray(n.sources) ||
    !Array.isArray(n.articles) ||
    n.articles.length > 90 ||
    !n.articles.every(validArticle) ||
    n.sources.length !== newsSources.length ||
    new Set(n.sources.map((s) => s?.id)).size !== newsSources.length ||
    !n.sources.every(
      (s) =>
        s &&
        newsSources.some((x) => x.id === s.id) &&
        ["ok", "failed"].includes(s.status) &&
        validDate(s.checkedAt) &&
        (s.lastSuccessAt === null || validDate(s.lastSuccessAt)) &&
        Number.isInteger(s.articleCount) &&
        s.articleCount >= 0,
    )
  )
    throw Error("新聞資料格式錯誤");
  return n;
}
export function groupNews(
  articles: NewsArticle[],
  now: Date,
  source = "",
  topic = "",
): NewsGroup[] {
  const groups = new Map<string, NewsGroup>();
  const seenUrls = new Set<string>();
  for (const article of articles
    .filter(
      (a) =>
        (!source || a.sourceId === source) &&
        (!topic || a.topic === topic) &&
        Date.parse(a.publishedAt) <= now.getTime() + 5 * 60 * 1000 &&
        Date.parse(a.publishedAt) >= now.getTime() - 7 * 24 * 60 * 60 * 1000,
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    if (seenUrls.has(article.url)) continue;
    seenUrls.add(article.url);
    const key = article.title
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    const group = groups.get(key);
    if (group) group.articles.push(article);
    else
      groups.set(key, {
        title: article.title,
        publishedAt: article.publishedAt,
        articles: [article],
      });
  }
  return [...groups.values()];
}
export function isSourceStale(lastSuccessAt: string | null, now: Date) {
  return (
    !lastSuccessAt ||
    now.getTime() - Date.parse(lastSuccessAt) > 6 * 60 * 60 * 1000
  );
}
