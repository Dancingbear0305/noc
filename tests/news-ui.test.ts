import { describe, it, expect } from "vitest";
import { groupNews, isSourceStale, validateNews } from "../src/services/news";
import type { NewsArticle } from "../src/types/news";
const now = new Date("2026-11-06T04:00:00Z");
const example: NewsArticle = {
  title: "Vietnam synthetic holiday example",
  url: "https://e.vnexpress.net/example",
  publishedAt: "2026-11-06T03:00:00Z",
  sourceId: "vnexpress",
  region: "VN",
  topic: "節慶／活動",
};
describe("新聞顯示邏輯", () => {
  it("相同標題合併但保留出處，可依來源與主題篩選", () => {
    const other = {
      ...example,
      url: "https://vietnamnews.vn/example",
      sourceId: "vietnamnews",
    };
    const groups = groupNews([example, other], now);
    expect(groups).toHaveLength(1);
    expect(groups[0].articles).toHaveLength(2);
    expect(
      groupNews([example, other], now, "vnexpress")[0].articles,
    ).toHaveLength(1);
    expect(groupNews([example], now, "", "電力／網路")).toHaveLength(0);
  });
  it("舊快照不當成最新，未曾成功也算過期", () => {
    expect(isSourceStale("2026-11-06T03:00:00Z", now)).toBe(false);
    expect(isSourceStale("2026-11-05T03:00:00Z", now)).toBe(true);
    expect(isSourceStale(null, now)).toBe(true);
    expect(
      groupNews([{ ...example, publishedAt: "2021-01-01" }], now),
    ).toHaveLength(0);
  });
  it("拒絕外站連結、錯誤 schema 或缺少來源狀態", () => {
    expect(() => validateNews(null)).toThrow();
    expect(() =>
      validateNews({
        schemaVersion: 1,
        region: "VN",
        checkedAt: now.toISOString(),
        sources: [],
        articles: [{ ...example, url: "javascript:alert(1)" }],
      }),
    ).toThrow();
  });
});
