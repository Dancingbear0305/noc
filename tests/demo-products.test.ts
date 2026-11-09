import { describe, it, expect } from "vitest";
import {
  demoProducts,
  isLegacyDemo,
  legacyDemoProducts,
} from "../src/data/products";
import { available, matchesSelection } from "../src/services/desk";
import { validateProducts } from "../src/services/core";
const blank = { productId: "", region: "", idc: "" };
describe("公開假設篩選資料", () => {
  it("11 個產品通過資料驗證，地區清單符合指定示範", () => {
    expect(validateProducts(demoProducts)).toHaveLength(11);
    for (const [region, codes] of Object.entries({
      TW: ["SPD", "DF", "UD", "AOV", "MBM", "NFS", "CODM", "FF"],
      TH: ["SPD", "DF", "UD", "AOV", "MBM", "FCO", "FCOM"],
      SG: ["SPD", "GNG", "UD"],
    }))
      expect(
        demoProducts
          .filter((p) => p.regions.includes(region))
          .map((p) => p.code)
          .sort(),
      ).toEqual(codes.sort());
  });
  it("SPD 三個地區均只使用 SG機房，未將服務地區誤當機房", () => {
    expect(
      available(demoProducts, { ...blank, productId: "spd" }, "region"),
    ).toEqual(["SG", "TH", "TW"]);
    for (const region of ["TW", "TH", "SG"])
      expect(
        available(demoProducts, { ...blank, productId: "spd", region }, "idc"),
      ).toEqual(["SG機房"]);
    expect(
      matchesSelection(demoProducts[0], {
        productId: "spd",
        region: "TW",
        idc: "TW機房",
      }),
    ).toBe(false);
  });
  it("從機房可反查產品和地區，未知正式團隊維持空白", () => {
    expect(
      available(demoProducts, { ...blank, idc: "SG機房" }, "productId").sort(),
    ).toEqual(["spd", "ud", "mbm", "gng"].sort());
    expect(
      demoProducts.every((p) => !Object.keys(p.responsibleTeams).length),
    ).toBe(true);
    expect(
      new Set(
        demoProducts.flatMap((p) => p.idcMappings.map((m) => m.idcLocation)),
      ),
    ).toEqual(new Set(["TW機房", "TH機房", "SG機房"]));
  });
  it("自動升級只辨識完全相同的舊內建資料，不覆蓋私人匯入或編輯", () => {
    expect(isLegacyDemo(structuredClone(legacyDemoProducts))).toBe(true);
    expect(isLegacyDemo(demoProducts)).toBe(false);
    expect(
      isLegacyDemo([
        { ...legacyDemoProducts[0], notes: "已自行修改的公開範例" },
      ]),
    ).toBe(false);
    expect(isLegacyDemo([])).toBe(false);
  });
});
