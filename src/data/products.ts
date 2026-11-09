import type { Product } from "../types";
// Public synthetic examples only. Import private notes locally through Settings.
export const demoProducts: Product[] = [
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
export const statusLabels = {
  confirmed: "Confirmed from notes｜筆記明確記載",
  verify: "Needs verification｜需要確認",
  unrecorded: "Not recorded｜筆記未記錄",
};
