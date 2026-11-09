const { chromium } = require("playwright");
const baseURL = (process.env.BASE_URL || "http://127.0.0.1:5173").replace(
  /\/$/,
  "",
);
(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: new Date("2026-11-09T04:00:00Z") });
  await page.goto(baseURL + "/#/");
  await page
    .getByRole("heading", { name: "NOC Navigator · CCU 排查" })
    .waitFor();
  if (await page.getByRole("link", { name: "故障排查", exact: true }).count())
    throw Error("Old wizard visible");
  await page.getByRole("button", { name: "DEMO", exact: true }).click();
  await page.getByRole("button", { name: "TW", exact: true }).click();
  await page.getByRole("button", { name: "示例 SG", exact: true }).click();
  await page
    .getByRole("button", { name: "GNM · 尚未串接", exact: true })
    .waitFor();
  if (
    !(await page
      .getByRole("button", { name: "GNM · 尚未串接", exact: true })
      .isDisabled())
  )
    throw Error("Placeholder should be disabled");
  await page
    .getByRole("link", { name: "Downdetector 台灣 ↗", exact: true })
    .waitFor();
  await page.clock.fastForward(300000);
  await page.getByRole("alert").filter({ hasText: "已達 5 分鐘" }).waitFor();
  await page.clock.fastForward(300000);
  await page.getByRole("alert").filter({ hasText: "已達 10 分鐘" }).waitFor();
  await page.reload();
  await page.getByRole("alert").filter({ hasText: "已達 10 分鐘" }).waitFor();
  await page.getByText("設定通報流程網址", { exact: true }).click();
  await page
    .getByLabel("正式通報流程網址")
    .fill("https://example.com/public-sop");
  await page.getByRole("button", { name: "儲存通報網址", exact: true }).click();
  const sop = page.getByRole("link", {
    name: "開啟正式通報流程 ↗",
    exact: true,
  });
  await sop.waitFor();
  if ((await sop.getAttribute("target")) !== "_blank")
    throw Error("SOP link should open new tab");
  await page.getByRole("button", { name: "暫停", exact: true }).click();
  const clock = await page.locator(".desk-clock").innerText();
  await page.clock.fastForward(60000);
  if ((await page.locator(".desk-clock").innerText()) !== clock)
    throw Error("Pause failed");
  await page.getByRole("button", { name: "繼續", exact: true }).click();
  await page.getByRole("button", { name: "＋新增", exact: true }).click();
  await page.getByLabel("活動名稱", { exact: true }).fill("公開合成節慶");
  await page.getByRole("button", { name: "儲存活動", exact: true }).click();
  await page.getByRole("button", { name: /公開合成節慶.*點擊備註/ }).click();
  await page.getByLabel("幅度 %（選填）", { exact: true }).fill("12");
  await page
    .getByLabel("觀察備註", { exact: true })
    .fill("公開合成測試，非實際指標");
  await page
    .getByRole("button", { name: "存進本機知識庫", exact: true })
    .click();
  await page
    .locator("#desk-notes")
    .getByText("公開合成節慶", { exact: true })
    .waitFor();
  await page.reload();
  await page
    .locator("#desk-notes")
    .getByText("公開合成節慶", { exact: true })
    .waitFor();
  await page.locator(".history-hint").filter({ hasText: "下降 12%" }).waitFor();
  await page.getByRole("link", { name: "本機知識", exact: true }).click();
  if (!page.url().endsWith("/#/"))
    throw Error("In-page jump broke hash routing");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "新的排查／重設", exact: true })
    .click();
  await page.getByText("等待首次篩選", { exact: true }).waitFor();
  await page.getByRole("button", { name: "地區", exact: true }).click();
  await page.getByRole("button", { name: "SG", exact: true }).click();
  await page.getByRole("button", { name: "DEMO", exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw Error("Mobile overflow");
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: cascading selectors, tools, 5/10 minute notices, persistent timer, pause, SOP link, activity observation/history, same-page navigation, reverse selection, mobile",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
