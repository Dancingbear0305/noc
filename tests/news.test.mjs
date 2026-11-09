import { describe, it, expect } from "vitest";
import {
  parseFeed,
  collectNews,
  articleUrl,
  topicFor,
} from "../scripts/news-lib.mjs";
const source = { id: "synthetic", articleHosts: ["news.example.com"] };
const now = new Date("2026-11-06T04:00:00Z");
function rss(items) {
  return `<rss version="2.0"><channel>${items}</channel></rss>`;
}
function item(
  title = "Vietnam public holiday — synthetic example",
  url = "https://news.example.com/story",
  date = "Fri, 06 Nov 2026 03:00:00 GMT",
) {
  return `<item><title><![CDATA[${title}]]></title><link>${url}</link><pubDate>${date}</pubDate><description>Public synthetic test data only.</description></item>`;
}
describe("公開 RSS 解析與篩選", () => {
  it("只輸出公開中繼資料，移除 HTML、查詢字串與片段", () => {
    const articles = parseFeed(
      rss(
        item(
          "<b>Vietnam holiday example</b>",
          "https://news.example.com/story?utm_source=feed#anchor",
        ),
      ),
      source,
      now,
    );
    expect(articles).toHaveLength(1);
    expect(articles[0]).toEqual({
      title: "Vietnam holiday example",
      url: "https://news.example.com/story",
      publishedAt: "2026-11-06T03:00:00.000Z",
      sourceId: "synthetic",
      region: "VN",
      topic: "節慶／活動",
    });
    expect(articles[0]).not.toHaveProperty("description");
  });
  it("支援 Atom 及單筆 RSS", () => {
    const atom =
      '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Vietnam internet outage example</title><link rel="alternate" href="https://news.example.com/atom"/><updated>2026-11-06T03:00:00Z</updated></entry></feed>';
    expect(parseFeed(atom, source, now)[0].topic).toBe("電力／網路");
  });
  it("拒絕外站／非 HTTPS／帳密 URL，去除重複 URL", () => {
    for (const u of [
      "javascript:alert(1)",
      "http://news.example.com/a",
      "https://other.example.com/a",
      "https://user:pass@news.example.com/a",
    ])
      expect(articleUrl(u, source)).toBeNull();
    expect(parseFeed(rss(item() + item()), source, now)).toHaveLength(1);
  });
  it("不把其他國家、未來、過期或缺日期當作最新越南新聞", () => {
    const xml = rss(
      item("Tokyo public holiday example") +
        item(
          "Vietnam example",
          "https://news.example.com/future",
          "Fri, 06 Nov 2026 05:00:00 GMT",
        ) +
        item(
          "Vietnam example",
          "https://news.example.com/old",
          "Fri, 01 Jan 2021 00:00:00 GMT",
        ) +
        item("Vietnam example", "https://news.example.com/missing", ""),
    );
    expect(parseFeed(xml, source, now)).toEqual([]);
  });
  it("拒絕 HTML 錯誤頁、無效 XML 及 DTD／外部實體", () => {
    for (const xml of [
      "<html>Denied</html>",
      "not xml",
      '<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///secret">]><rss/>',
    ])
      expect(() => parseFeed(xml, source, now)).toThrow();
  });
  it("越南文僅供關鍵字分類，不宣稱驗證根因", () => {
    expect(topicFor("Việt Nam mất điện")).toBe("電力／網路");
    expect(topicFor("Hà Nội lễ hội")).toBe("節慶／活動");
    expect(topicFor("Vietnam typhoon example")).toBe("重大突發");
  });
});
describe("擷取失敗與快照保留", () => {
  it("部分來源失敗仍保留其他來源，紀錄失敗且不冒充成功", async () => {
    const other = { ...source, id: "other" };
    const snapshot = await collectNews(
      [source, other],
      null,
      async (s) => {
        if (s.id === "other") throw Error("unavailable");
        return rss(item());
      },
      now,
    );
    expect(snapshot.sources.map((s) => s.status)).toEqual(["ok", "failed"]);
    expect(snapshot.sources[1].lastSuccessAt).toBeNull();
    expect(snapshot.articles).toHaveLength(1);
  });
  it("失敗保留七天內快照，不刷新原成功時間；過期內容淘汰", async () => {
    const previous = await collectNews(
      [source],
      null,
      async () => rss(item()),
      now,
    );
    const later = new Date("2026-11-06T07:00:00Z");
    const failed = await collectNews(
      [source],
      previous,
      async () => {
        throw Error("network");
      },
      later,
    );
    expect(failed.articles).toHaveLength(1);
    expect(failed.sources[0].lastSuccessAt).toBe(previous.checkedAt);
    expect(failed.checkedAt).toBe(later.toISOString());
    const expired = await collectNews(
      [source],
      previous,
      async () => {
        throw Error("network");
      },
      new Date("2026-11-20"),
    );
    expect(expired.articles).toEqual([]);
  });
  it("有效 RSS 沒有相關新聞是零筆成功，不是假造新聞", async () => {
    const result = await collectNews(
      [source],
      null,
      async () => rss(item("Tokyo news example")),
      now,
    );
    expect(result.sources[0].status).toBe("ok");
    expect(result.articles).toHaveLength(0);
  });
});
