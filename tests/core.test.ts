import { describe, it, expect } from "vitest";
import { ccuFlow, issueTypes } from "../src/data/flows";
import { legacyDemoProducts as demoProducts } from "../src/data/products";
import {
  validateFlow,
  validateProducts,
  queryProducts,
  recommendations,
  makeIncident,
  summary,
  safeUrl,
} from "../src/services/core";
describe("資料與雙向查詢", () => {
  it("公開示例通過驗證", () =>
    expect(validateProducts(demoProducts)).toEqual(demoProducts));
  it("依產品、地區和 IDC 多條件查詢", () => {
    expect(queryProducts(demoProducts, "DEMO", "TW", "示例 SG")).toHaveLength(
      1,
    );
    expect(queryProducts(demoProducts, "", "未記錄地區")).toHaveLength(0);
    expect(queryProducts(demoProducts, "", "SG", "不存在 IDC")).toHaveLength(0);
  });
  it("拒絕重複 ID 及不存在的地區對應", () => {
    expect(() =>
      validateProducts([...demoProducts, ...demoProducts]),
    ).toThrow();
    expect(() =>
      validateProducts([
        {
          ...demoProducts[0],
          idcMappings: [
            { ...demoProducts[0].idcMappings[0], serviceRegion: "不存在" },
          ],
        },
      ]),
    ).toThrow();
  });
  it("不推測未記錄的團隊", () => {
    const p = { ...demoProducts[0], responsibleTeams: {} };
    expect(makeIncident(p, "TW", issueTypes[0], {}).possibleTeams).toEqual([]);
  });
});
describe("CCU 流程", () => {
  it("每個節點均可抵達終點", () => expect(validateFlow(ccuFlow)).toBe(true));
  it("拒絕缺失節點及死循環", () => {
    expect(() =>
      validateFlow({
        ...ccuFlow,
        nodes: [{ ...ccuFlow.nodes[0], nextNodeId: "missing" }],
      }),
    ).toThrow();
    expect(() =>
      validateFlow({
        ...ccuFlow,
        nodes: [{ ...ccuFlow.nodes[0], nextNodeId: "trend" }],
      }),
    ).toThrow();
  });
  it("所有選項路徑提供建議且未知資訊保持未知", () => {
    for (const scope of ["是", "否", "尚未確認"])
      for (const login of ["正常", "異常", "尚未確認"]) {
        const a = { scope, login };
        expect(recommendations(a, issueTypes[0]).length).toBeGreaterThan(1);
        const i = makeIncident(demoProducts[0], "TW", issueTypes[0], a);
        expect(i.unknowns.length).toBeGreaterThan(0);
        expect(summary(i)).toContain("根因：未確認");
        expect(summary(i)).toContain("不代表已執行");
      }
  });
  it("各異常入口均有實際初步指引", () => {
    for (const issue of issueTypes)
      expect(recommendations({}, issue).length).toBeGreaterThan(1);
  });
});
describe("連結安全", () => {
  it("只接受 HTTP(S) 並拒絕內嵌帳密", () => {
    expect(safeUrl("https://example.com")).toBe(true);
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "https://user:password@example.com",
      "not-a-url",
    ])
      expect(safeUrl(url)).toBe(false);
  });
});
