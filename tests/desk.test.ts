import { describe, it, expect } from "vitest";
import {
  available,
  matchesSelection,
  elapsedSeconds,
  timerLevel,
  eventKey,
  observationError,
} from "../src/services/desk";
import { legacyDemoProducts as demoProducts } from "../src/data/products";
const blank = { productId: "", region: "", idc: "" };
describe("單頁篩選", () => {
  it("產品→地區→機房及反向查詢保留未知對應", () => {
    expect(
      available(demoProducts, { ...blank, productId: "demo" }, "region"),
    ).toEqual(["SG", "TW"]);
    expect(available(demoProducts, { ...blank, region: "TW" }, "idc")).toEqual([
      "示例 SG",
    ]);
    expect(
      matchesSelection(demoProducts[0], {
        ...blank,
        region: "TW",
        idc: "不存在",
      }),
    ).toBe(false);
  });
  it("已明確指定地區的機房不可套用到其他地區", () => {
    const products = [
      {
        ...demoProducts[0],
        idcMappings: [
          { ...demoProducts[0].idcMappings[0], serviceRegion: "TW" },
        ],
      },
    ];
    expect(available(products, { ...blank, idc: "示例 SG" }, "region")).toEqual(
      ["TW"],
    );
    expect(
      matchesSelection(products[0], { ...blank, region: "SG", idc: "示例 SG" }),
    ).toBe(false);
  });
});
describe("計時與觀察", () => {
  it("跨重新整理和延遲回呼按時間差計算，暫停不累計", () => {
    const session = { ...blank, startedAt: 1000, pausedAt: null, pausedMs: 0 };
    expect(elapsedSeconds(session, 301000)).toBe(300);
    expect(timerLevel(299)).toBe(0);
    expect(timerLevel(300)).toBe(5);
    expect(timerLevel(600)).toBe(10);
    expect(elapsedSeconds({ ...session, pausedAt: 301000 }, 901000)).toBe(300);
    expect(elapsedSeconds({ ...session, pausedMs: 600000 }, 901000)).toBe(300);
  });
  it("同活動跨年度名稱匹配，但不混淆不同地區", () => {
    expect(eventKey(" Example holiday ", "TW")).toBe(
      eventKey("example holiday", "TW"),
    );
    expect(eventKey("example holiday", "TW")).not.toBe(
      eventKey("example holiday", "SG"),
    );
  });
  it("百分比可留空，不把未知當作零；拒絕負數、無限值與下降超過百分百", () => {
    expect(observationError("下降", "")).toBe("");
    expect(observationError("上升", "150")).toBe("");
    for (const percent of ["-1", "Infinity", "101"])
      expect(observationError("下降", percent)).not.toBe("");
  });
});
