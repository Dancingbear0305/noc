import { useEffect, useState } from "react";
import { useLocal } from "../hooks/useLocal";
import {
  demoProducts,
  statusLabels,
  isLegacyDemo,
  isCurrentDemo,
} from "../data/products";
import { regionalTools } from "../data/region-tools";
import {
  available,
  matchesSelection,
  elapsedSeconds,
  timerLevel,
  type DeskSession,
  type Observation,
} from "../services/desk";
import { safeUrl } from "../services/core";
import { RegionNews } from "../components/RegionNews";
import { ActivityRail } from "../components/ActivityRail";
import type { Product, QuickLink } from "../types";
const blank: DeskSession = {
  productId: "",
  region: "",
  idc: "",
  startedAt: null,
  pausedAt: null,
  pausedMs: 0,
};
export function Workbench() {
  const [products, setProducts, pe] = useLocal<Product[]>(
    "products",
    demoProducts,
  );
  const [links, , le] = useLocal<QuickLink[]>("links", []);
  const [session, setSession, se] = useLocal<DeskSession>(
    "desk-session",
    blank,
  );
  const [observations, saveObservations, oe] = useLocal<Observation[]>(
    "observations",
    [],
  );
  const [escalation, , ee] = useLocal("escalation-url", "");
  const [light, setLight] = useLocal("light", false);
  const [mode, setMode] = useState<"productId" | "region" | "idc">("productId");
  const [now, setNow] = useState(() => new Date());
  const [showNews, setShowNews] = useState(false);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const t = setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (isLegacyDemo(products) && setProducts(demoProducts)) {
      setSession({ ...session, productId: "", region: "", idc: "" });
    }
  }, [products]);
  const elapsed = elapsedSeconds(session, now.getTime());
  const level = timerLevel(elapsed);
  const rows = products.filter((p) => matchesSelection(p, session));
  function choose(field: "productId" | "region" | "idc", value: string) {
    const next = {
      ...session,
      [field]: value,
      startedAt: session.startedAt ?? Date.now(),
    };
    const order = [
      mode,
      ...(["productId", "region", "idc"] as const).filter((k) => k !== mode),
    ];
    for (const downstream of order.slice(order.indexOf(field) + 1))
      next[downstream] = "";
    setSession(next);
    setShowNews(false);
  }
  function reset() {
    if (
      session.startedAt !== null &&
      !confirm("結束目前計時並清除篩選？本機觀察會保留。")
    )
      return;
    setSession(blank);
    setShowNews(false);
  }
  const keys = [
    mode,
    ...(["productId", "region", "idc"] as const).filter((x) => x !== mode),
  ];
  const relevantLinks = links.filter(
    (l) =>
      (!l.productIds.length || l.productIds.includes(session.productId)) &&
      (!l.regionIds.length || l.regionIds.includes(session.region)),
  );
  const ready = Boolean(session.productId && session.region);
  return (
    <div className={"shell desk " + (light ? "light" : "")}>
      <div className="desk-main">
        <div className="desk-top">
          <h1>NOC Navigator · CCU 排查</h1>
          <button onClick={() => setLight(!light)}>切換主題</button>
        </div>
        <div className="desk-toolbar">
          <p className="desk-muted">產品 → 地區 → 機房。首次選擇即開始計時。</p>
          <span className="desk-data-label">
            {isCurrentDemo(products)
              ? "假設示範資料 · 非正式配置"
              : "本機產品資料"}
          </span>
          <button
            onClick={() => {
              if (
                !isCurrentDemo(products) &&
                !isLegacyDemo(products) &&
                !confirm(
                  "以公開假設示範取代目前產品資料？請保留原始匯入檔；活動與觀察不會清除。",
                )
              )
                return;
              if (setProducts(demoProducts))
                setSession({ ...session, productId: "", region: "", idc: "" });
            }}
          >
            載入篩選示範
          </button>
        </div>
        <section className="desk-block" id="desk-filters">
          <div className="desk-row">
            <h2>定位影響範圍</h2>
            <button onClick={reset}>新的排查／重設</button>
          </div>
          <div className="desk-row">
            先從：
            {(["productId", "region", "idc"] as const).map((k, i) => (
              <button
                key={k}
                aria-pressed={mode === k}
                onClick={() => setMode(k)}
              >
                {["產品", "地區", "機房"][i]}
              </button>
            ))}
          </div>
          {keys
            .filter(
              (_, i) => i === 0 || keys.slice(0, i).every((k) => !!session[k]),
            )
            .map((field) => (
              <fieldset key={field}>
                <legend>
                  {{ productId: "產品", region: "地區", idc: "機房" }[field]}
                </legend>
                <div className="desk-options">
                  <button
                    aria-pressed={!session[field]}
                    onClick={() => choose(field, "")}
                  >
                    全部
                  </button>
                  {available(products, session, field).map((v) => (
                    <button
                      aria-pressed={session[field] === v}
                      key={v}
                      onClick={() => choose(field, v)}
                    >
                      {field === "productId"
                        ? products.find((p) => p.id === v)?.code
                        : v}
                    </button>
                  ))}
                </div>
                {!available(products, session, field).length && (
                  <p className="desk-muted">筆記尚未記錄；可清除此項或重設。</p>
                )}
              </fieldset>
            ))}
          {(session.productId || session.region || session.idc) && (
            <p className="desk-selection">
              目前：
              {products.find((p) => p.id === session.productId)?.code ||
                "全部產品"}{" "}
              ／ {session.region || "全部地區"} ／ {session.idc || "全部機房"}
            </p>
          )}
          {!ready && (
            <p className="desk-empty-guidance">
              選擇產品及地區後，顯示維運資訊與可用工具。
            </p>
          )}
          {ready && (
            <div className="desk-context" role="region" aria-label="維運資訊">
              {rows.map((p) => (
                <details key={p.id} open>
                  <summary>
                    {p.code} · {p.regions.join(" / ")} ·{" "}
                    {session.region
                      ? p.responsibleTeams[session.region] || "團隊待確認"
                      : "選地區查看維運團隊"}
                  </summary>
                  <p>{p.notes}</p>
                  {p.idcMappings
                    .filter(
                      (m) =>
                        (!session.region ||
                          m.serviceRegion === null ||
                          m.serviceRegion === session.region) &&
                        (!session.idc || m.idcLocation === session.idc),
                    )
                    .map((m, i) => (
                      <p key={i}>
                        {m.idcLocation} · {m.serviceRegion || "地區對應未確認"}{" "}
                        · {statusLabels[m.verificationStatus]} · {m.notes}
                      </p>
                    ))}
                </details>
              ))}
              <p className="desk-muted">
                未確認地區的機房只作候選列出，不代表已確認對應。公開版僅有合成示例，機房與維運歸屬仍需核對。
              </p>
            </div>
          )}
        </section>
        {ready && (
          <section className="desk-block" id="desk-tools">
            <h2>立即開啟工具</h2>
            <div className="desk-options">
              {["GNM", "告警", "原廠工具"].map((name) => (
                <button key={name} disabled title="尚未設定">
                  {name} · 尚未串接
                </button>
              ))}
              {relevantLinks.map((l) => (
                <a
                  className="button"
                  href={safeUrl(l.url) ? l.url : undefined}
                  key={l.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  {l.name} ↗
                </a>
              ))}
            </div>
            <h3>地區外部線索</h3>
            <div className="desk-options">
              {(regionalTools[session.region] ?? []).map((l) => (
                <a
                  className="button"
                  href={l.url}
                  key={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  {l.name} ↗
                </a>
              ))}
            </div>
            {!session.region ? (
              <p>請先選地區。</p>
            ) : (
              !regionalTools[session.region]?.some((l) =>
                l.name.includes("Downdetector"),
              ) && (
                <p className="desk-muted">
                  此地區的 Downdetector 入口尚未確認，不自動套用其他國家網站。
                </p>
              )
            )}
            <p className="desk-muted">
              外部網站以新分頁開啟，未嵌入
              iframe；新聞入口的編採與可用性仍需自行確認。
            </p>
            {session.region === "VN" && (
              <>
                <button onClick={() => setShowNews(!showNews)}>
                  {showNews ? "收合新聞標題" : "載入 VN 新聞標題（本站快照）"}
                </button>
                {showNews && <RegionNews region="VN" />}
              </>
            )}
          </section>
        )}
        {(pe || le || se || oe || ee) && (
          <p className="desk-error" role="alert">
            {pe || le || se || oe || ee}
          </p>
        )}
      </div>
      <aside className="desk-rail">
        <section
          className={"desk-block desk-timer level-" + level}
          aria-label="排查計時器"
        >
          <h2>
            排查計時 <small>5 分鐘提醒 · 8 分鐘通報檢查</small>
          </h2>
          <output className="desk-clock">
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </output>
          <p>
            {session.startedAt === null
              ? "等待首次篩選"
              : session.pausedAt
                ? "已暫停"
                : "計時中（重新整理保留）"}
          </p>
          {level > 0 && (
            <div role="alert" key={level}>
              {level === 8
                ? "已達 8 分鐘：請依正式 SOP 確認是否需要通報。"
                : "已達 5 分鐘：確認影響範圍與登入指標，整理目前線索。"}
            </div>
          )}
          {level === 8 &&
            (safeUrl(escalation) ? (
              <a
                className="button"
                href={escalation}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                開啟正式通報流程 ↗
              </a>
            ) : (
              <>
                <button disabled>通報流程 · 尚未設定</button>
              </>
            ))}
          <button
            className="group-notify"
            disabled
            title="尚未串接 API，不會發送或建立群組"
          >
            創群通知 · API 尚未串接
          </button>
          {session.startedAt !== null && (
            <div className="desk-row">
              <button
                onClick={() =>
                  setSession(
                    session.pausedAt
                      ? {
                          ...session,
                          pausedAt: null,
                          pausedMs:
                            session.pausedMs + Date.now() - session.pausedAt,
                        }
                      : { ...session, pausedAt: Date.now() },
                  )
                }
              >
                {session.pausedAt ? "繼續" : "暫停"}
              </button>
              <button onClick={reset}>結束／重設</button>
            </div>
          )}
        </section>
        <ActivityRail
          selection={session}
          observations={observations}
          saveObservations={saveObservations}
          now={now}
        />
      </aside>
    </div>
  );
}
