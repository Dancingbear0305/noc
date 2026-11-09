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
import { Settings, Knowledge } from "./Extras";
import { Links } from "./Links";
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
  const [links, setLinks, le] = useLocal<QuickLink[]>("links", []);
  const [session, setSession, se] = useLocal<DeskSession>(
    "desk-session",
    blank,
  );
  const [observations, saveObservations, oe] = useLocal<Observation[]>(
    "observations",
    [],
  );
  const [escalation, setEscalation, ee] = useLocal("escalation-url", "");
  const [light, setLight] = useLocal("light", false);
  const [mode, setMode] = useState<"productId" | "region" | "idc">("productId");
  const [now, setNow] = useState(() => new Date());
  const [showNews, setShowNews] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [url, setUrl] = useState(escalation);
  const [urlError, setUrlError] = useState("");
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
  const notes = observations.filter(
    (o) =>
      showAllNotes ||
      ((!session.region || o.region === session.region) &&
        (!session.productId || o.productId === session.productId)),
  );
  return (
    <div className={"shell desk " + (light ? "light" : "")}>
      <div className="desk-main">
        <div className="desk-top">
          <h1>NOC Navigator · CCU 排查</h1>
          <button onClick={() => setLight(!light)}>切換主題</button>
        </div>
        <p className="desk-muted">
          先選一個產品、地區或機房 → 縮小範圍 →
          開啟工具。首次選擇開始計時。不執行正式環境操作。
        </p>
        <div className="notice">
          <span>
            {isCurrentDemo(products)
              ? "目前使用 11 個產品的假設篩選資料，非正式機房配置。"
              : "目前使用本機產品資料；切換示範前請保留自己的原始匯入檔。"}
          </span>
          <button
            onClick={() => {
              if (
                !isCurrentDemo(products) &&
                !isLegacyDemo(products) &&
                !confirm(
                  "以公開假設示範取代目前產品資料？請先保留自己的原始匯入檔。活動、觀察及工具不會清除。",
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
        <nav className="desk-nav">
          <a
            href="#desk-filters"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("desk-filters")
                ?.scrollIntoView({ behavior: "instant" });
            }}
          >
            篩選
          </a>
          <a
            href="#desk-tools"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("desk-tools")
                ?.scrollIntoView({ behavior: "instant" });
            }}
          >
            工具
          </a>
          <a
            href="#desk-notes"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("desk-notes")
                ?.scrollIntoView({ behavior: "instant" });
            }}
          >
            本機知識
          </a>
          <a
            href="#desk-config"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("desk-config")
                ?.scrollIntoView({ behavior: "instant" });
            }}
          >
            設定／匯入
          </a>
        </nav>
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
          <p>
            目前：
            {products.find((p) => p.id === session.productId)?.code ||
              "全部產品"}{" "}
            ／ {session.region || "全部地區"} ／ {session.idc || "全部機房"}
          </p>
          {rows.map((p) => (
            <details key={p.id}>
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
                    {m.idcLocation} · {m.serviceRegion || "地區對應未確認"} ·{" "}
                    {statusLabels[m.verificationStatus]} · {m.notes}
                  </p>
                ))}
            </details>
          ))}
          <p className="desk-muted">
            未確認地區的機房只作候選列出，不代表已確認對應。公開版僅有合成示例，正式筆記請在下方本機匯入。
          </p>
        </section>
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
        <section className="desk-block" id="desk-notes">
          <div className="desk-row">
            <h2>活動觀察知識庫（僅存本機）</h2>
            <button onClick={() => setShowAllNotes(!showAllNotes)}>
              {showAllNotes ? "只看目前範圍" : "查看全部觀察"}
            </button>
          </div>
          <p className="desk-muted">
            歷史觀察是線索，不是已確認根因；相同活動名稱及地區會在右側提示。
          </p>
          {!notes.length && <p>尚無觀察。點右側活動名稱即可記錄。</p>}
          {notes.map((o) => (
            <article className="desk-observation" key={o.id}>
              <strong>{o.eventTitle}</strong>
              <p>
                {o.eventDate} ·{" "}
                {products.find((p) => p.id === o.productId)?.code ||
                  o.productId ||
                  "產品未選"}{" "}
                · {o.region || "地區未記錄"} · CCU {o.direction}{" "}
                {o.percent === null ? "幅度未填" : `${o.percent}%`}
              </p>
              <p>{o.note}</p>
              <button
                onClick={() => {
                  if (confirm("刪除此本機觀察？"))
                    saveObservations(observations.filter((x) => x.id !== o.id));
                }}
              >
                刪除觀察
              </button>
            </article>
          ))}
          <details>
            <summary>通用術語知識</summary>
            <Knowledge />
          </details>
        </section>
        <section className="desk-block" id="desk-config">
          <h2>同頁設定</h2>
          <details>
            <summary>本機資料匯入與清除</summary>
            <Settings
              products={products}
              saveProducts={(p) => {
                if (setProducts(p)) setSession(blank);
              }}
            />
          </details>
          <details>
            <summary>管理監控工具連結</summary>
            <Links links={links} save={setLinks} products={products} />
          </details>
          <details>
            <summary>設定通報流程網址</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (url && !safeUrl(url)) {
                  setUrlError("請使用不含帳密的 HTTP／HTTPS 網址。");
                  return;
                }
                if (setEscalation(url)) setUrlError("已存於本機。");
              }}
            >
              <label>
                正式通報流程網址
                <input value={url} onChange={(e) => setUrl(e.target.value)} />
              </label>
              <button>儲存通報網址</button>
              <p role="status">{urlError}</p>
            </form>
          </details>
        </section>
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
          <h2>排查已經過</h2>
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
              {level === 10
                ? "已達 10 分鐘：請依正式 SOP 確認是否需要通報。"
                : "已達 5 分鐘：確認影響範圍與登入指標，整理目前線索。"}
            </div>
          )}
          {level === 10 &&
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
                <a
                  href="#desk-config"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("desk-config")
                      ?.scrollIntoView({ behavior: "instant" });
                  }}
                >
                  在同頁設定通報網址
                </a>
              </>
            ))}
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
