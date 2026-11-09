const baseURL = (process.env.BASE_URL || "http://127.0.0.1:5173").replace(
  /\/$/,
  "",
);
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(baseURL + "/");
  await page.getByRole("heading", { name: "工作總覽." }).waitFor();
  // Synthetic reminder data only: never use a real monitoring observation here.
  await page.getByRole("button", { name: /近期特例/ }).click();
  const widget = page.getByRole("region", { name: "近期特例", exact: true });
  await widget.getByRole("button", { name: "新增特例", exact: true }).click();
  await widget.getByLabel("提醒標題", { exact: true }).fill("公開合成活動提醒");
  await widget
    .getByLabel("特例分類", { exact: true })
    .selectOption("球賽／活動");
  await widget
    .getByRole("button", { name: "本週（一～日）", exact: true })
    .click();
  await widget
    .getByLabel("補充說明（選填）", { exact: true })
    .fill("<img src=x onerror=alert(1)> 僅為合成文字");
  await widget.getByRole("button", { name: "儲存特例", exact: true }).click();
  await widget
    .getByRole("heading", { name: "公開合成活動提醒", exact: true })
    .waitFor();
  if (await widget.locator("img").count())
    throw Error("Reminder HTML must render as plain text");
  await widget.getByText("有效中", { exact: true }).waitFor();
  await page.reload();
  await widget
    .getByRole("heading", { name: "公開合成活動提醒", exact: true })
    .waitFor();
  await widget
    .getByRole("button", { name: "編輯特例 公開合成活動提醒", exact: true })
    .click();
  await widget.getByLabel("提醒標題", { exact: true }).fill("已編輯的合成提醒");
  await widget.getByRole("button", { name: "儲存特例", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "知識庫", exact: true })
    .click();
  await widget
    .getByRole("heading", { name: "已編輯的合成提醒", exact: true })
    .waitFor();
  // Invalid ranges are rejected without closing the editor.
  await widget
    .getByRole("button", { name: "編輯特例 已編輯的合成提醒", exact: true })
    .click();
  await widget.getByLabel("開始日期", { exact: true }).fill("2026-11-08");
  await widget.getByLabel("結束日期", { exact: true }).fill("2026-11-02");
  await widget.getByRole("button", { name: "儲存特例", exact: true }).click();
  await widget
    .getByRole("alert")
    .filter({ hasText: "結束日期不能早於開始日期。" })
    .waitFor();
  await widget.getByRole("button", { name: "取消", exact: true }).click();
  // A failed localStorage write must keep the draft for correction/retry.
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.__restoreStorage = () => {
      Storage.prototype.setItem = original;
    };
    Storage.prototype.setItem = function (k, v) {
      if (k === "noc:exceptions")
        throw new DOMException("Synthetic quota failure", "QuotaExceededError");
      return original.call(this, k, v);
    };
  });
  await widget.getByRole("button", { name: "新增特例", exact: true }).click();
  await widget.getByLabel("提醒標題", { exact: true }).fill("公開儲存測試提醒");
  await widget.getByRole("button", { name: "儲存特例", exact: true }).click();
  await widget
    .getByRole("alert")
    .filter({ hasText: "本機儲存失敗，請確認瀏覽器空間或隱私設定。" })
    .waitFor();
  if (
    (await widget.getByLabel("提醒標題", { exact: true }).inputValue()) !==
    "公開儲存測試提醒"
  )
    throw Error("Unsaved draft lost");
  await page.evaluate(() => window.__restoreStorage());
  await widget.getByRole("button", { name: "儲存特例", exact: true }).click();
  await widget
    .getByRole("heading", { name: "公開儲存測試提醒", exact: true })
    .waitFor();
  page.once("dialog", (d) => d.accept());
  await widget
    .getByRole("button", { name: "刪除特例 公開儲存測試提醒", exact: true })
    .click();
  await widget
    .getByRole("button", { name: "收合近期特例", exact: true })
    .click();
  await page.reload();
  if (await page.getByRole("region", { name: "近期特例", exact: true }).count())
    throw Error("Collapsed preference lost");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();

  await page.getByRole("link", { name: "開始排查", exact: true }).click();
  await page.getByRole("button", { name: "開始檢查" }).click();
  await page.getByRole("button", { name: "CCU 突然下降", exact: true }).click();
  await page.getByRole("button", { name: "是", exact: true }).click();
  await page.getByRole("button", { name: "異常", exact: true }).click();
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "尚未確認", exact: true }).click();
  await page
    .getByRole("heading", { name: "建議檢查清單（不代表已執行）" })
    .waitFor();
  await page.getByRole("button", { name: "返回上一步", exact: true }).click();
  await page.getByRole("button", { name: "否", exact: true }).click();
  await page.getByRole("button", { name: "儲存事件紀錄" }).click();
  await page.getByRole("link", { name: "事件紀錄", exact: true }).click();
  await page.getByText("根因：未確認", { exact: false }).waitFor();
  await page.getByRole("link", { name: "常用連結", exact: true }).click();
  await page.getByRole("button", { name: "新增連結", exact: true }).click();
  await page.getByLabel("名稱", { exact: true }).fill("公開測試工具");
  await page.getByLabel("URL", { exact: true }).fill("https://example.com");
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await page.getByRole("link", { name: "開啟", exact: false }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "公開測試工具" }).waitFor();
  await page
    .getByRole("button", { name: "編輯 公開測試工具", exact: true })
    .click();
  await page.getByLabel("名稱", { exact: true }).fill("已編輯的公開工具");
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await page.getByRole("heading", { name: "已編輯的公開工具" }).waitFor();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "刪除 已編輯的公開工具", exact: true })
    .click();
  await page.getByRole("heading", { name: "尚未設定連結" }).waitFor();

  // Public news UI: synthetic unavailable snapshot, then synthetic article responses.
  await page.route("**/news/vn.json", (route) => {
    const time = new Date().toISOString();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        schemaVersion: 1,
        region: "VN",
        checkedAt: time,
        sources: ["vnexpress", "bbc-vietnamese", "vietnamnews"].map((id) => ({
          id,
          status: "failed",
          checkedAt: time,
          lastSuccessAt: null,
          articleCount: 0,
        })),
        articles: [],
      }),
    });
  });
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "地區查詢", exact: true })
    .click();
  await page.getByLabel("依地區篩選").selectOption("VN");
  await page
    .getByRole("heading", { name: "越南近期新聞", exact: true })
    .waitFor();
  await page
    .getByText("尚無近 7 天的可用新聞。可以從下方來源入口查看原站。", {
      exact: true,
    })
    .waitFor();
  await page.unroute("**/news/vn.json");
  const newsRequests = [];
  await page.route("**/news/vn.json", async (route) => {
    newsRequests.push(route.request().url());
    const time = new Date().toISOString();
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        schemaVersion: 1,
        region: "VN",
        checkedAt: time,
        sources: [
          {
            id: "vnexpress",
            status: "ok",
            checkedAt: time,
            lastSuccessAt: time,
            articleCount: 1,
          },
          {
            id: "bbc-vietnamese",
            status: "failed",
            checkedAt: time,
            lastSuccessAt: old,
            articleCount: 1,
          },
          {
            id: "vietnamnews",
            status: "ok",
            checkedAt: time,
            lastSuccessAt: time,
            articleCount: 1,
          },
        ],
        articles: [
          {
            title: "Vietnam public holiday — SYNTHETIC TEST",
            url: "https://e.vnexpress.net/synthetic-example",
            publishedAt: time,
            sourceId: "vnexpress",
            region: "VN",
            topic: "節慶／活動",
          },
          {
            title: "Vietnam public holiday — SYNTHETIC TEST",
            url: "https://vietnamnews.vn/synthetic-example",
            publishedAt: time,
            sourceId: "vietnamnews",
            region: "VN",
            topic: "節慶／活動",
          },
          {
            title: "Vietnam internet — SYNTHETIC TEST",
            url: "https://www.bbc.com/vietnamese/synthetic-example",
            publishedAt: old,
            sourceId: "bbc-vietnamese",
            region: "VN",
            topic: "電力／網路",
          },
        ],
      }),
    });
  });
  await page.getByRole("button", { name: "重新讀取", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Vietnam public holiday — SYNTHETIC TEST",
      exact: true,
    })
    .waitFor();
  if ((await page.locator(".news-card").count()) !== 2)
    throw Error("Same-title dedup failed");
  await page
    .getByText("同標題已合併；可能為轉載，不代表獨立佐證。", { exact: true })
    .waitFor();
  await page.getByLabel("新聞來源", { exact: true }).selectOption("vnexpress");
  if ((await page.locator(".news-card").count()) !== 1)
    throw Error("News source filter failed");
  const articleLink = page.locator(".news-card h3 a").first();
  if (
    (await articleLink.getAttribute("target")) !== "_blank" ||
    (await articleLink.getAttribute("referrerpolicy")) !== "no-referrer"
  )
    throw Error("News link privacy attributes missing");
  await page.getByLabel("新聞來源", { exact: true }).selectOption("");
  await page.getByLabel("新聞主題", { exact: true }).selectOption("電力／網路");
  await page
    .getByRole("heading", {
      name: "Vietnam internet — SYNTHETIC TEST",
      exact: true,
    })
    .waitFor();
  if ((await page.locator(".news-card").count()) !== 1)
    throw Error("News topic filter failed");
  await page.getByText("舊快照", { exact: true }).waitFor();
  const requestsBefore = newsRequests.length;
  await page.getByLabel("依地區篩選").selectOption("SG");
  await page
    .getByRole("heading", { name: "SG 地區新聞尚未開放", exact: true })
    .waitFor();
  if (
    newsRequests.length !== requestsBefore ||
    newsRequests.some((url) => new URL(url).search)
  )
    throw Error("Unexpected news region/query request");

  await page.getByRole("link", { name: "產品查詢", exact: true }).click();
  await page.getByLabel("依地區篩選").selectOption("SG");
  await page.getByText("DEMO", { exact: true }).click();
  await page.getByRole("cell", { name: "示例 SG", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "產品查詢" }).waitFor();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "設定", exact: true })
    .click();
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify([
        {
          id: "synthetic",
          code: "SYNTHETIC",
          regions: ["SG"],
          responsibleTeams: {},
          idcMappings: [],
          notes: "公開測試資料",
          verificationStatus: "verify",
        },
      ]),
    ),
  });
  await page.getByText("目前 1 項產品。", { exact: false }).waitFor();
  await page.getByRole("link", { name: "產品查詢", exact: true }).click();
  await page.getByText("SYNTHETIC", { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("" + baseURL + "/#/");
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw Error("mobile horizontal overflow");
  await page.getByRole("button", { name: /近期特例/ }).click();
  await widget
    .getByRole("heading", { name: "已編輯的合成提醒", exact: true })
    .waitFor();
  const box = await widget.boundingBox();
  if (
    !box ||
    box.x < 64 ||
    box.x + box.width > 390 ||
    box.y < 0 ||
    box.y + box.height > 844
  )
    throw Error("Mobile reminder outside viewport");
  await widget
    .getByRole("button", { name: "收合近期特例", exact: true })
    .click();
  await page.getByRole("button", { name: "切換主題" }).click();
  if (!(await page.locator(".shell.light").count()))
    throw Error("theme toggle failed");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "設定", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "清除全部本機資料" }).click();
  await page.getByText("目前 1 項產品。", { exact: false }).waitFor();
  if (
    await page.evaluate(() =>
      Object.keys(localStorage).some(
        (k) =>
          k === "noc:products" ||
          k === "noc:links" ||
          k === "noc:incidents" ||
          k === "noc:exceptions",
      ),
    )
  )
    throw Error("local clear failed");
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: VN news empty/filter/provenance/stale/dedup/privacy states, reminder CRUD/persistence/date validation/storage failure/plain text/mobile/clear, dashboard, complete CCU flow, local incident, link create/edit/delete/persistence, catalog, hash reload, import, mobile layout; no browser errors",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
