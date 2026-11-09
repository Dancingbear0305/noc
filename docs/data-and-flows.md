# 資料與流程維護

## 私人產品資料

不要在此儲存庫編輯真實資料。另在儲存庫外建立 UTF-8 JSON 陣列，再透過設定匯入。匯入會取代目前瀏覽器的產品資料，更新前保留自己的原始檔。

公開、合成格式範例：

```json
[
  {
    "id": "sample",
    "code": "SAMPLE",
    "regions": ["TW"],
    "responsibleTeams": {},
    "idcMappings": [
      {
        "serviceRegion": null,
        "vendor": "示例供應商",
        "idcLocation": "示例 SG",
        "notes": "產品與 IDC 關聯已記錄，服務地區對應未知。",
        "verificationStatus": "verify"
      }
    ],
    "notes": "公開示例",
    "verificationStatus": "confirmed"
  }
]
```

`responsibleTeams` 依服務地區對應團隊，沒有資訊就省略，不能猜測。地區記在 `regions`，IDC 在 `idcMappings`。若逐一地區對應不明，`serviceRegion` 必須為 null，不能把每個 IDC 擴展給全部地區。vendor 未確認用空字串，不由地點推測。狀態為 `confirmed`（明確記錄）、`verify`（需要確認）、`unrecorded`（未記錄），產品狀態不取代個別 mapping 狀態。特殊維運規則可保留在 notes，不對未確認的地區代碼自動推論。匯入驗證 ID 唯一、基本型別、對應地區及可信狀態。

## 流程

`src/data/flows.ts` 的 `ccuFlow` 儲存節點、選項與 nextNodeId，null 表示結束；每個節點 ID 必須唯一。修改後執行 `npm test`，驗證不存在遺失節點或循環。流程引擎按 nextNodeId 前進，返回時可重選；改選會移除後續答案。不同條件的建議在 `src/services/core.ts` 的 recommendations 中獨立維護，不放在 UI。建議必須保守表述，不代表已完成檢查或已確認根因。

若需增加分支規則，先擴充 FlowNode 型別、驗證器與測試，再更動資料。其他告警的初步清單在 genericChecks；新增完整流程時應以獨立 TroubleshootingFlow 資料定義。

## 事件與 AI

Incident 分開 observations、checks（建議檢查，非已執行）、unknowns、possibleTeams 與 hypotheses。不得將建議冒充已執行檢查。AIAnalysisService 僅定義介面；未取得新的明確授權，不得傳送任何本機內容到外部模型。
