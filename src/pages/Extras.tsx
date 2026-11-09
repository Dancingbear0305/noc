import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { knowledge } from "../data/knowledge";
import { demoProducts } from "../data/products";
import { summary, validateProducts } from "../services/core";
import { useLocal } from "../hooks/useLocal";
import type { Incident, Product } from "../types";
export function Knowledge() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("");
  return (
    <>
      <div className="eyebrow">KNOWLEDGE BASE</div>
      <h1>NOC 知識庫</h1>
      <p className="muted">
        先理解指標，再進一步判斷。第一版提供核心術語文章。
      </p>
      <div className="filters">
        <input
          placeholder="搜尋術語或關鍵字…"
          aria-label="搜尋術語"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="知識分類"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">所有分類</option>
          {[...new Set(knowledge.map((k) => k.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="cards">
        {knowledge
          .filter(
            (k) =>
              (!category || k.category === category) &&
              JSON.stringify(k).toLowerCase().includes(q.toLowerCase()),
          )
          .map((k) => (
            <article className="panel" key={k.id}>
              <span className="badge">{k.category}</span>
              <h2>{k.title}</h2>
              <small>{k.fullName || "英文全名未確認／不適用"}</small>
              <p>{k.content}</p>
              <details>
                <summary>範例、用途與常見誤解</summary>
                <p>範例：{k.example}</p>
                <p>用途：{k.use}</p>
                <div className="notice">{k.caution}</div>
                <Link to="/links">管理相關參考連結 →</Link>
              </details>
            </article>
          ))}
      </div>
    </>
  );
}
export function Incidents({
  incidents,
  save,
  copy,
}: {
  incidents: Incident[];
  save: (x: Incident[]) => void;
  copy: (x: string) => void;
}) {
  return (
    <>
      <div className="eyebrow">LOCAL INCIDENT NOTES</div>
      <h1>事件紀錄</h1>
      <p className="muted">
        僅保留選項式排查脈絡，不填入人數或未知根因。切勿儲存機敏內容。
      </p>
      {!incidents.length && (
        <div className="empty panel">
          尚無事件紀錄。<Link to="/troubleshoot">開始排查 →</Link>
        </div>
      )}
      {incidents.map((i) => (
        <article className="panel" key={i.id}>
          <div className="section-title">
            <h3>
              {i.product} / {i.region} · {i.issue}
            </h3>
            <select
              aria-label="處理狀態"
              value={i.status}
              onChange={(e) =>
                save(
                  incidents.map((x) =>
                    x.id === i.id
                      ? { ...x, status: e.target.value as Incident["status"] }
                      : x,
                  ),
                )
              }
            >
              {["待確認", "調查中", "已恢復（使用者確認）"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <pre>{summary(i)}</pre>
          <div className="actions">
            <button onClick={() => copy(summary(i))}>複製純文字</button>
            <button onClick={() => copy(summary(i, true))}>
              複製 Markdown
            </button>
            <button
              onClick={() => {
                if (confirm("刪除此事件？"))
                  save(incidents.filter((x) => x.id !== i.id));
              }}
            >
              刪除
            </button>
          </div>
          <details>
            <summary>英文回報模板（僅採已確認資訊）</summary>
            <p>
              {i.observations.trend === "CCU 突然下降"
                ? `A CCU drop was observed in ${i.region}. `
                : ""}
              Initial investigation is ongoing. Root cause has not been
              confirmed.
            </p>
            {i.observations.trend === "CCU 已開始恢復" && (
              <p>
                CCU has started to recover. Continued observation is required.
              </p>
            )}
            {i.observations.login === "正常" && (
              <p>
                SGS metrics appear normal. Further investigation is ongoing.
              </p>
            )}
            <button
              onClick={() =>
                copy(
                  `Initial investigation is ongoing. Root cause has not been confirmed.${i.observations.login === "正常" ? " SGS metrics appear normal." : ""}`,
                )
              }
            >
              複製英文摘要
            </button>
          </details>
        </article>
      ))}
    </>
  );
}
export function Learning({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState(false);
  const [records, save, error] = useLocal<{ time: string; correct: boolean }[]>(
    "learning",
    [],
  );
  const [unfamiliar, saveUnfamiliar, uerror] = useLocal<string[]>(
    "unfamiliar",
    [],
  );
  const [feedback, setFeedback] = useState("");
  const card = knowledge[index % knowledge.length];
  const quiz = products.find((p) => p.regions.length > 0);
  return (
    <>
      <div className="eyebrow">LEARNING LAB</div>
      <h1>學習模式</h1>
      <p className="muted">利用有記錄的資料練習；筆記缺漏不會當成否定答案。</p>
      <section className="panel">
        <span className="badge">
          術語卡片 {(index % knowledge.length) + 1} / {knowledge.length}
        </span>
        <button className="flashcard" onClick={() => setFlip(!flip)}>
          <h2>{card.title}</h2>
          <p>{flip ? card.content : "點擊翻面查看解釋"}</p>
        </button>
        <div className="actions">
          <button
            onClick={() => {
              setIndex(index + 1);
              setFlip(false);
            }}
          >
            下一張
          </button>
          <button
            onClick={() =>
              saveUnfamiliar(
                unfamiliar.includes(card.id)
                  ? unfamiliar.filter((x) => x !== card.id)
                  : [...unfamiliar, card.id],
              )
            }
          >
            {unfamiliar.includes(card.id) ? "已標記不熟悉 ✓" : "標記不熟悉"}
          </button>
        </div>
      </section>
      {quiz && (
        <section className="panel">
          <h3>依產品查詢練習</h3>
          <p>哪個選項是 {quiz.code} 筆記中已記錄的監控地區？</p>
          {[quiz.regions[0], "筆記沒有任何地區紀錄"].map((r, i) => (
            <button
              key={r}
              onClick={() => {
                save([
                  ...records,
                  { time: new Date().toISOString(), correct: i === 0 },
                ]);
                setFeedback(
                  i === 0
                    ? "答對了，資料有明確記錄。"
                    : "請再次查閱產品筆記；缺漏不能推論為沒有服務。",
                );
              }}
            >
              {r}
            </button>
          ))}
          <p role="status">{feedback}</p>
        </section>
      )}
      <section className="panel">
        <h3>答題紀錄</h3>
        <p>
          已答 {records.length} 次 · 答對{" "}
          {records.filter((r) => r.correct).length} 次
        </p>
        <p>不熟悉內容：{unfamiliar.join("、") || "尚無標記"}</p>
        {records
          .slice(-10)
          .reverse()
          .map((r, i) => (
            <p key={i}>
              {new Date(r.time).toLocaleString("zh-TW")} ·{" "}
              {r.correct ? "答對" : "需要複習"}
            </p>
          ))}
      </section>
      {error || uerror}
    </>
  );
}
export function Settings({
  products,
  saveProducts,
}: {
  products: Product[];
  saveProducts: (p: Product[]) => void;
}) {
  const [message, setMessage] = useState("");
  return (
    <>
      <div className="eyebrow">WORKSPACE SETTINGS</div>
      <h1>設定與資料安全</h1>
      <section className="panel">
        <h2>本機產品資料</h2>
        <p>
          目前 {products.length} 項產品。公開程式碼僅附合成示例；私人筆記以 JSON
          匯入此瀏覽器，不會上傳。
        </p>
        <div className="notice">
          請先確認公司政策允許在此裝置儲存。localStorage
          不加密，不適合密碼、Token 或其他機密。CCU 人數不在本工具的資料欄位內。
        </div>
        <label>
          匯入產品 JSON（取代目前本機產品；上限 1 MB）
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 1024 * 1024) throw Error("檔案超過 1 MB");
                const data = validateProducts(JSON.parse(await file.text()));
                saveProducts(data);
                setMessage(
                  "格式驗證通過，已提交本機儲存；若儲存失敗會顯示錯誤。",
                );
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "匯入失敗");
              }
              e.target.value = "";
            }}
          />
        </label>
        <p role="status">{message}</p>
        <button
          onClick={() => {
            if (confirm("以公開示例取代目前本機產品資料？"))
              saveProducts(demoProducts);
          }}
        >
          恢復公開示例
        </button>
      </section>
      <section className="panel">
        <h2>隱私與儲存範圍</h2>
        <p>
          本工具無後端、無分析追蹤，不自動連線、掃描或操作正式系統。網址與事件資料只存於目前瀏覽器。不同裝置及網址的資料不互通；清除瀏覽器資料後將遺失。
        </p>
        <p>
          GitHub Pages 內容是公開的。不得將機敏資料加入原始碼、測試、截圖、Git
          歷史、Actions 紀錄或部署產物。
        </p>
        <button
          className="danger"
          onClick={() => {
            if (confirm("清除本工具全部本機資料？此操作無法復原。")) {
              Object.keys(localStorage)
                .filter((k) => k.startsWith("noc:"))
                .forEach((k) => localStorage.removeItem(k));
              location.reload();
            }
          }}
        >
          清除全部本機資料
        </button>
      </section>
    </>
  );
}
