import type { Product } from "../types";
// Public synthetic examples only. Import private notes locally through Settings.
export const legacyDemoProducts: Product[] = [
  {
    id: "demo",
    code: "DEMO",
    regions: ["TW", "SG"],
    responsibleTeams: { TW: "示例維運團隊", SG: "示例維運團隊" },
    idcMappings: [
      {
        serviceRegion: null,
        vendor: "示例 Cloud",
        idcLocation: "示例 SG",
        notes: "示意資料；未記錄地區與 IDC 的逐一對應。",
        verificationStatus: "verify",
      },
    ],
    notes: "公開示例，非真實產品或正式 SOP。",
    verificationStatus: "confirmed",
  },
];
// User-authorized product names/regions for a fictional filtering demonstration.
// These IDC assignments are assumptions, not the private infrastructure notes.
const sampleMappings: Record<string, Record<string, string>> = {
  SPD: { TW: "SG機房", TH: "SG機房", SG: "SG機房" },
  DF: { TW: "TW機房", TH: "TH機房" },
  UD: { TW: "SG機房", TH: "TH機房", SG: "SG機房" },
  AOV: { TW: "TW機房", TH: "TH機房" },
  MBM: { TW: "SG機房", TH: "SG機房" },
  NFS: { TW: "TW機房" },
  CODM: { TW: "TW機房" },
  FF: { TW: "TW機房" },
  FCO: { TH: "TH機房" },
  FCOM: { TH: "TH機房" },
  GNG: { SG: "SG機房" },
};
export const demoProducts: Product[] = Object.entries(sampleMappings).map(
  ([code, mappings]) => ({
    id: code.toLowerCase(),
    code,
    regions: Object.keys(mappings),
    responsibleTeams: {},
    idcMappings: Object.entries(mappings).map(
      ([serviceRegion, idcLocation]) => ({
        serviceRegion,
        idcLocation,
        vendor: "示範供應商",
        verificationStatus: "verify",
        notes: "僅供按鈕篩選測試的假設配置，不代表正式機房。",
      }),
    ),
    notes:
      "篩選示範：地區依使用者指定清單，機房為假設資料，非正式服務或基礎設施資訊。",
    verificationStatus: "verify",
  }),
);
/** Upgrade only the exact old built-in example, never an imported/custom dataset. */
export function isLegacyDemo(value: unknown): boolean {
  return JSON.stringify(value) === JSON.stringify(legacyDemoProducts);
}
export function isCurrentDemo(value: unknown): boolean {
  return JSON.stringify(value) === JSON.stringify(demoProducts);
}
export const statusLabels = {
  confirmed: "Confirmed from notes｜筆記明確記載",
  verify: "Needs verification｜需要確認",
  unrecorded: "Not recorded｜筆記未記錄",
};
