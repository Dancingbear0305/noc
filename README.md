# NOC Navigator

繁體中文 NOC 工作輔助工具。React + TypeScript + Vite + Tailwind CSS + React Router + Lucide React；純靜態、無後端、無 AI API。

## 開發

Node.js 24、npm 11。

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## 功能範圍

- Dashboard、最近使用紀錄、深／淺色模式、響應式導覽與術語搜尋。
- CCU 完整選項式流程：產品／地區、趨勢、同地區產品、登入、MA、活動、玩家回報、ISP、IDC；可返回、重新開始、查看路徑、未知資訊、相關連結與複製摘要。
- 其他九類異常提供初步檢查清單；不是完整問答式流程，也不是正式 SOP。
- 產品／地區／IDC 多條件搜尋、排序與展開詳細資訊；不推定未記錄的團隊或地區與 IDC 關聯。
- 本機網址新增／編輯／刪除／搜尋、HTTP(S) 驗證、新分頁開啟、流程關聯。
- 本機事件紀錄、狀態、純文字／Markdown 摘要與保守英文回報模板。
- 核心術語文章、翻卡、產品地區基礎測驗、不熟悉標記與答題紀錄。
- 本機資料匯入、格式驗證、清除功能；AIAnalysisService 僅介面，不連線。

## 機敏資訊不得上 GitHub

原始碼、測試、文件、Actions 紀錄、截圖與部署產物只能含公開合成示例。真實 CCU 人數、內部網址、事件、帳密、Token、產品／網路架構等資料不得提交或發佈。私人產品檔案放在儲存庫之外，於「設定」匯入本機瀏覽器。勿把它放在 `src`、`public` 或任何 Git 追蹤路徑。

網址與個人資料存在目前網域的 localStorage，不上傳。不應保存密碼、Token 或機密資訊；資料不加密，能被同來源程式及有裝置存取權者讀取。部署到 GitHub Pages 不代表獲准處理公司資料；請先遵守公司政策。不要輸入實際 CCU 人數。清除本機資料不影響其他裝置，也無法撤銷已複製或分享的內容。

`.gitignore` 是便利措施，不能攔截所有秘密。提交前人工檢查 `git diff --cached`，部署前檢查 `dist`；不可把自動測試視為機敏資訊偵測保證。程式不執行正式環境操作，也不自動載入外部監控。

## GitHub Pages

1. 將**審查後的公開程式碼**提交到 `main`。
2. Repository Settings → Pages → Source 選擇 **GitHub Actions**。
3. `.github/workflows/pages.yml` 會執行 `npm ci`、測試、建置，僅上傳 `dist`，通過後部署。

Vite `base: './'` 使用相對資產路徑，HashRouter 使用 `/#/products` 等路由，可部署在 `/noc/` 子路徑。重新整理 `https://<owner>.github.io/noc/#/products` 不會向伺服器要求 `/products`，避免 404。不要將網址改成沒有 `#` 的內部路徑。PR 僅驗證，不部署。尚未在實際 GitHub Pages 驗證或發佈。

## 結構與擴充

```
src/components  共用版型
src/pages       工作頁面
src/data        公開示例、流程、知識
src/types       資料型別與 AI 擴充介面
src/hooks       本機狀態
src/services    查詢、流程驗證、摘要及輸入驗證
src/utils       共用工具的擴充位置
tests           流程、查詢、資料與 URL 安全測試
docs            資料及流程編輯方式
```

參見 [資料與流程維護](docs/data-and-flows.md)。Phase 2 尚未完整實作：其餘告警逐步問答、完整知識庫清單、地區反向與情境測驗。Phase 3 僅保留介面，沒有 AI 分析服務。

## 瀏覽器驗收

另開終端啟動 `npm run dev`，再執行：

```sh
npx playwright install chromium
npm run test:e2e
```

如果系統已有 Chromium，可省略下載並用 `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`。`BASE_URL` 可指定本機靜態測試站點（包括 `/noc/` 子路徑）。驗收只產生合成資料，使用全新暫存瀏覽器，不使用私人匯入檔。涵蓋 CCU 全流程／返回、事件、本機連結 CRUD、匯入、篩選、路由重新整理、行動版版面、主題及本機清除。CI 預設執行核心測試與建置，瀏覽器驗收需自行執行。

## 近期特例懸浮小窗

右下角「近期特例」可在任何頁面展開／收合，支援自訂標題、節假日／球賽活動／CCU 觀察／其他分類、起迄日期與補充說明，以及編輯、刪除。新增時預設本週（週一至週日），也可快速選「今天」。期間含起迄日，以目前裝置日期判斷有效、即將到來或已結束；近期檢視涵蓋今天前後七天及期間仍有效的提醒，「全部」可管理其他日期。角標顯示有效提醒數，過期提醒不會自動刪除。

提醒僅是使用者提供的觀察背景，不是故障根因或正式日曆資訊；不會自動抓取節假日、賽程或監控資料，也不會寫入事件結論。資料僅保存在瀏覽器 `noc:exceptions`，與開關偏好一起納入「清除全部本機資料」。儲存失敗時保留編輯內容並顯示錯誤。不要填入實際 CCU 人數、內部網址或任何機敏資訊；提醒不會上傳或打包到 GitHub Pages。

## VN 公開新聞試用版

「地區查詢」選擇 VN 可查看新聞卡片、來源背景與狀態，支援來源／主題篩選、同標題合併與原文新分頁。資料與本機產品、事件、特例完全分開；不自動送出私人資料。候選來源為 VnExpress International、BBC News Tiếng Việt、Việt Nam News，RSS 與使用規範尚待真實連線驗證。目前雲端白名單阻擋新聞網域，畫面會顯示尚未取得新聞，不提供虛構內容。

`npm run news:update` 更新公開 RSS metadata，然後 `npm run build`。Pages workflow 已加入每 3 小時排程；需在預設分支發布並啟用 Pages 後才會執行。顯示嘗試／成功時間，失敗或過期明確提示。見 [新聞來源與更新文件](docs/news.md) 了解資料界線、網路前提及限制。
