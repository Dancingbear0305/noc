import { XMLParser, XMLValidator } from "fast-xml-parser";

export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function plainText(value) {
  return (
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? String(value)
        : ""
  )
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function topicFor(text) {
  const t = normalize(text);
  if (
    /\b(power outage|blackout|electricity|internet|telecom|submarine cable|cable outage|mat dien|cap quang|dien luc|mang internet)\b/.test(
      t,
    )
  )
    return "電力／網路";
  if (
    /\b(flood|typhoon|earthquake|storm|landslide|bao|lu lut|dong dat)\b/.test(t)
  )
    return "重大突發";
  if (
    /\b(holiday|festival|football|match|tournament|tet|le hoi|bong da|giai dau)\b/.test(
      t,
    )
  )
    return "節慶／活動";
  return "一般新聞";
}
export function articleUrl(raw, source) {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !source.articleHosts.includes(url.hostname)
    )
      return null;
    // RSS metadata must never become a URL credential/token forwarding route.
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}
function list(x) {
  return x == null ? [] : Array.isArray(x) ? x : [x];
}
export function parseFeed(xml, source, now = new Date()) {
  if (
    typeof xml !== "string" ||
    /<!DOCTYPE|<!ENTITY/i.test(xml) ||
    XMLValidator.validate(xml) !== true
  )
    throw Error("invalid-feed");
  const tree = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
    processEntities: true,
    parseTagValue: false,
  }).parse(xml);
  const root = tree.rss?.channel ?? tree.feed;
  if (!root) throw Error("invalid-feed");
  const entries = list(root.item ?? root.entry);
  const articles = [];
  for (const item of entries.slice(0, 200)) {
    const title = plainText(
      typeof item.title === "object" ? item.title?.["#text"] : item.title,
    ).slice(0, 250);
    const description = plainText(item.description ?? item.summary ?? "");
    const links = list(item.link);
    const raw =
      links.find((l) => typeof l === "string") ??
      links.find((l) => l?.["@_rel"] === "alternate" || !l?.["@_rel"])?.[
        "@_href"
      ];
    const url = articleUrl(raw, source);
    const timestamp = Date.parse(
      item.pubDate ?? item.published ?? item.updated ?? "",
    );
    if (
      !title ||
      !url ||
      !Number.isFinite(timestamp) ||
      timestamp > now.getTime() + 5 * 60 * 1000 ||
      timestamp < now.getTime() - MAX_AGE_MS
    )
      continue;
    // Public geographic terms only; no product, incident, or private query input.
    if (
      !/\b(viet nam|vietnam|vietnamese|ha noi|hanoi|ho chi minh|hcmc|da nang|danang|mekong)\b/.test(
        normalize(title + " " + description),
      )
    )
      continue;
    articles.push({
      title,
      url,
      publishedAt: new Date(timestamp).toISOString(),
      sourceId: source.id,
      region: "VN",
      topic: topicFor(title + " " + description),
    });
  }
  return [...new Map(articles.map((a) => [a.url, a])).values()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 30);
}
export async function collectNews(
  sources,
  previous,
  fetchSource,
  now = new Date(),
) {
  const checkedAt = now.toISOString();
  const states = [];
  const articles = [];
  await Promise.all(
    sources.map(async (source) => {
      const old = Array.isArray(previous?.sources)
        ? previous.sources.find((s) => s?.id === source.id)
        : null;
      try {
        const parsed = parseFeed(await fetchSource(source), source, now);
        articles.push(...parsed);
        states.push({
          id: source.id,
          status: "ok",
          checkedAt,
          lastSuccessAt: checkedAt,
          articleCount: parsed.length,
        });
      } catch {
        const retained = (
          Array.isArray(previous?.articles) ? previous.articles : []
        )
          .filter(
            (a) =>
              a &&
              typeof a.title === "string" &&
              a.title.trim() &&
              a.sourceId === source.id &&
              articleUrl(a.url, source) &&
              Number.isFinite(Date.parse(a.publishedAt)) &&
              Date.parse(a.publishedAt) >= now.getTime() - MAX_AGE_MS &&
              Date.parse(a.publishedAt) <= now.getTime() + 5 * 60 * 1000,
          )
          .slice(0, 30)
          .map((a) => ({
            title: plainText(a.title).slice(0, 250),
            url: articleUrl(a.url, source),
            publishedAt: new Date(a.publishedAt).toISOString(),
            sourceId: source.id,
            region: "VN",
            topic: [
              "節慶／活動",
              "電力／網路",
              "重大突發",
              "一般新聞",
            ].includes(a.topic)
              ? a.topic
              : "一般新聞",
          }));
        articles.push(...retained);
        states.push({
          id: source.id,
          status: "failed",
          checkedAt,
          lastSuccessAt:
            typeof old?.lastSuccessAt === "string" &&
            Number.isFinite(Date.parse(old.lastSuccessAt))
              ? old.lastSuccessAt
              : null,
          articleCount: retained.length,
        });
      }
    }),
  );
  return {
    schemaVersion: 1,
    region: "VN",
    checkedAt,
    sources: sources.map((s) => states.find((x) => x.id === s.id)),
    articles: articles.sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    ),
  };
}
