import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, RefreshCw, Clock3 } from "lucide-react";
import {
  groupNews,
  isSourceStale,
  newsSources,
  newsTopics,
  sourceLabels,
  validateNews,
} from "../services/news";
import type { NewsSnapshot } from "../types/news";
const time = (s: string) =>
  new Date(s).toLocaleString("zh-TW", { hour12: false });
export function RegionNews({ region }: { region: string }) {
  const [snapshot, setSnapshot] = useState<NewsSnapshot | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const [source, setSource] = useState("");
  const [topic, setTopic] = useState("");
  const [limit, setLimit] = useState(8);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (region !== "VN") return;
    const controller = new AbortController();
    setState("loading");
    // Fixed same-origin path: never include selected products, incidents or user text.
    fetch(`${import.meta.env.BASE_URL}news/vn.json`, {
      signal: controller.signal,
      cache: "no-cache",
      credentials: "omit",
    })
      .then((r) => {
        if (!r.ok) throw Error("unavailable");
        return r.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setSnapshot(validateNews(data));
        setState("ready");
        setNow(new Date());
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("unavailable");
      });
    return () => controller.abort();
  }, [region, attempt]);
  if (!region)
    return (
      <section className="panel news-placeholder">
        <Newspaper size={22} />
        <div>
          <h2>地區新聞</h2>
          <p>選擇 VN（越南），查看公開新聞與活動背景。其他地區尚未開放。</p>
        </div>
      </section>
    );
  if (region !== "VN")
    return (
      <section className="panel news-placeholder">
        <Newspaper size={22} />
        <div>
          <h2>{region} 地區新聞尚未開放</h2>
          <p>試用版先提供 VN；不會將私人產品或監控資訊傳給新聞網站。</p>
        </div>
      </section>
    );
  const groups = groupNews(snapshot?.articles ?? [], now, source, topic);
  const successful = snapshot?.sources.filter((s) => s.lastSuccessAt) ?? [];
  const latestSuccess = successful
    .map((s) => s.lastSuccessAt!)
    .sort()
    .at(-1);
  const failed = snapshot?.sources.some((s) => s.status === "failed");
  const stale =
    state === "unavailable" ||
    snapshot?.sources.some((s) => isSourceStale(s.lastSuccessAt, now));
  return (
    <section
      className="panel region-news"
      aria-labelledby="region-news-heading"
    >
      <div className="section-title">
        <div>
          <div className="eyebrow">PUBLIC NEWS · VN PILOT</div>
          <h2 id="region-news-heading">
            <Newspaper size={20} />
            越南近期新聞
          </h2>
        </div>
        <button
          disabled={state === "loading"}
          onClick={() => setAttempt(attempt + 1)}
        >
          <RefreshCw size={14} />
          重新讀取
        </button>
      </div>
      <p className="muted">
        公開背景資訊，不能據此判定 CCU
        異常原因。標題保留原文，點選至來源網站閱讀。
      </p>
      <div className="news-timestamps">
        <span>
          <Clock3 size={12} />
          最近成功擷取：{latestSuccess ? time(latestSuccess) : "尚未成功"}
        </span>
        <span>
          上次更新嘗試：{snapshot ? time(snapshot.checkedAt) : "尚無紀錄"}
        </span>
        <span>顯示時間依此裝置時區</span>
      </div>
      {state === "loading" && (
        <p role="status" className="muted">
          正在讀取本站新聞資料…
        </p>
      )}
      {(state === "unavailable" || failed || stale) && (
        <div className="notice" role="status">
          {!latestSuccess
            ? "尚未取得可用新聞；來源 RSS 尚待成功擷取驗證。"
            : "部分來源更新失敗或超過 6 小時未更新；以下可能是較舊資料，請確認原文時間。"}
          {state === "unavailable" &&
            " 本站資料目前無法讀取，保留本次已讀取的內容。"}
        </div>
      )}
      <div className="news-filters">
        <label>
          新聞來源
          <select
            aria-label="新聞來源"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setLimit(8);
            }}
          >
            <option value="">所有候選來源</option>
            {newsSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          新聞主題
          <select
            aria-label="新聞主題"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setLimit(8);
            }}
          >
            <option value="">所有主題</option>
            {newsTopics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="news-grid">
        {groups.slice(0, limit).map((g) => (
          <article className="news-card" key={g.articles[0].url}>
            <div className="news-card-meta">
              <span>{g.articles[0].topic}</span>
              <time dateTime={g.publishedAt}>{time(g.publishedAt)}</time>
            </div>
            <h3>
              <a
                href={g.articles[0].url}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                {g.title}
                <ExternalLink size={13} />
              </a>
            </h3>
            <div className="news-citations">
              {g.articles.map((a) => {
                const s = newsSources.find((s) => s.id === a.sourceId)!;
                const status = snapshot?.sources.find((x) => x.id === s.id);
                return (
                  <span key={a.url}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                    >
                      {s.name} ↗
                    </a>
                    {status &&
                      (status.status === "failed" ||
                        isSourceStale(status.lastSuccessAt, now)) && (
                        <small>舊快照</small>
                      )}
                  </span>
                );
              })}
            </div>
            {g.articles.length > 1 && (
              <p className="news-group-note">
                同標題已合併；可能為轉載，不代表獨立佐證。
              </p>
            )}
          </article>
        ))}
      </div>
      {!groups.length && state !== "loading" && (
        <div className="news-empty">
          {snapshot?.articles.length
            ? "目前篩選條件下，沒有近 7 天的新聞。"
            : "尚無近 7 天的可用新聞。可以從下方來源入口查看原站。"}
        </div>
      )}
      {groups.length > limit && (
        <button className="news-more" onClick={() => setLimit(limit + 8)}>
          再顯示 8 則（共 {groups.length} 組）
        </button>
      )}
      <details className="news-provenance">
        <summary>來源背景與擷取狀態 · {newsSources.length} 個候選來源</summary>
        <p>
          RSS
          成功僅表示能取得資料，不代表內容獲得查證。不同網站可能轉載同一報導；本工具不提供自動可信度評分。
        </p>
        {newsSources.map((s) => {
          const status = snapshot?.sources.find((x) => x.id === s.id);
          return (
            <div className="news-source" key={s.id}>
              <div>
                <a
                  href={s.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  {s.name} <ExternalLink size={12} />
                </a>
                <span>
                  {s.kind} · {s.language}
                </span>
              </div>
              <p>{s.note}</p>
              <small>
                {status ? sourceLabels[status.status] : "尚未擷取驗證"} ·
                最近成功：
                {status?.lastSuccessAt ? time(status.lastSuccessAt) : "無"}
              </small>
            </div>
          );
        })}
      </details>
      <p className="news-footnote">
        定時更新目標為每 3
        小時，實際時間以成功擷取紀錄為準。「重新讀取」只讀本站快照，不會即時抓取新聞。主題及
        VN 關聯由公開關鍵字初篩，可能誤判或漏列。
      </p>
    </section>
  );
}
