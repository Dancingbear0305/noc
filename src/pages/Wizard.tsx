import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Copy, RotateCcw } from "lucide-react";
import { ccuFlow, issueTypes, genericChecks } from "../data/flows";
import { makeIncident, summary } from "../services/core";
import type { Product, QuickLink, Incident } from "../types";
export function Wizard({
  products,
  links,
  saveIncident,
  copy,
}: {
  products: Product[];
  links: QuickLink[];
  saveIncident: (i: Incident) => void;
  copy: (s: string) => void;
}) {
  const [params] = useSearchParams();
  const initial = Number(params.get("issue") ?? 0);
  const [issue, setIssue] = useState(issueTypes[initial] ?? issueTypes[0]);
  const [productId, setProduct] = useState(products[0]?.id ?? "");
  const p = products.find((p) => p.id === productId) ?? products[0];
  const [region, setRegion] = useState(p?.regions[0] ?? "");
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const ccu = issue === issueTypes[0];
  const done = step >= ccuFlow.nodes.length;
  const node = ccuFlow.nodes[step];
  const incident = p ? makeIncident(p, region, issue, answers) : null;
  const applicable = links.filter(
    (l) =>
      (!l.issueTypes.length || l.issueTypes.includes(issue)) &&
      (!l.productIds.length || l.productIds.includes(p?.id)) &&
      (!l.regionIds.length || l.regionIds.includes(region)),
  );
  function reset() {
    setStep(-1);
    setAnswers({});
    setSaved(false);
  }
  return (
    <>
      <div className="eyebrow">TROUBLESHOOTING</div>
      <div className="page-heading">
        <div>
          <h1>互動式故障排查</h1>
          <p>以已確認的資訊為起點，一步步釐清下一步。</p>
        </div>
        <button onClick={reset}>
          <RotateCcw size={15} />
          重新開始
        </button>
      </div>
      <div className="notice">
        這是初步排查建議，非正式 SOP。不要輸入 CCU 人數、帳密或機敏觀測值。
      </div>
      <div className="wizard-layout">
        <section className="panel">
          {step === -1 ? (
            <>
              <h2>01 / 選擇排查情境</h2>
              <label>
                異常類型
                <select
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                >
                  {issueTypes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  產品
                  <select
                    value={p?.id}
                    onChange={(e) => {
                      setProduct(e.target.value);
                      setRegion(
                        products.find((p) => p.id === e.target.value)
                          ?.regions[0] ?? "",
                      );
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  監控地區
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="">請選擇地區</option>
                    {p?.regions.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="muted">
                缺少產品？至設定匯入本機資料。沒有記錄的地區不代表沒有提供服務。
              </p>
              <button
                className="primary"
                disabled={!p || !region}
                onClick={() => setStep(ccu ? 0 : ccuFlow.nodes.length)}
              >
                開始檢查 <ArrowRight size={16} />
              </button>
            </>
          ) : done && incident ? (
            <>
              <span className="pill">
                <Check size={14} /> 初步方向已整理
              </span>
              <h2>{issue}</h2>
              <p>
                {p.code} · {region} · 根因尚未確認
              </p>
              <h3>已知資訊</h3>
              {Object.entries(answers).length ? (
                Object.entries(answers).map(([k, v]) => (
                  <p key={k}>
                    {ccuFlow.nodes.find((n) => n.id === k)?.question} <b>{v}</b>
                  </p>
                ))
              ) : (
                <p>尚未填寫額外觀測資訊。</p>
              )}
              <h3>建議檢查清單（不代表已執行）</h3>
              <ul>
                {incident.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <h3>可能涉及的系統／團隊</h3>
              <p>
                {incident.possibleTeams.join("、") ||
                  "維運歸屬未記錄，建議確認正式窗口。"}
                ；建議依情境確認登入、ISP、IDC 等系統。
              </p>
              <h3>尚需確認</h3>
              <ul>
                {(incident.unknowns.length
                  ? incident.unknowns
                  : ["影響時間、範圍與相關指標仍需依正式 SOP 確認"]
                ).map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              {!ccu && (
                <p className="muted">
                  此類型目前提供基礎檢查指引；完整逐步流程將於後續擴充。
                </p>
              )}
              <h3>相關工具與 SOP</h3>
              {applicable.map((l) => (
                <a
                  className="link-chip"
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={l.id}
                >
                  {l.name} ↗
                </a>
              ))}
              {ccuFlow.relatedLinks
                .filter((name) => !applicable.some((l) => l.name === name))
                .map((name) => (
                  <p className="muted" key={name}>
                    {name}：尚未設定連結
                  </p>
                ))}
              <Link to="/links">新增監控連結 →</Link>
              <p>
                <Link to="/knowledge">查看 CCU／MA／MTR 相關知識 →</Link> ·{" "}
                <Link to="/idc">查看 IDC 資訊 →</Link>
              </p>
              <div className="actions">
                <button onClick={() => copy(summary(incident))}>
                  <Copy size={15} />
                  複製排查摘要
                </button>
                <button
                  className="primary"
                  disabled={saved}
                  onClick={() => {
                    saveIncident(incident);
                    setSaved(true);
                  }}
                >
                  {saved ? "已儲存在本機" : "儲存事件紀錄"}
                </button>
                <button
                  onClick={() => setStep(ccu ? ccuFlow.nodes.length - 1 : -1)}
                >
                  返回上一步
                </button>
              </div>
            </>
          ) : node ? (
            <>
              <div className="step-meta">
                步驟 {step + 1} / {ccuFlow.nodes.length}
              </div>
              <div className="progress">
                <span
                  style={{
                    width: `${((step + 1) / ccuFlow.nodes.length) * 100}%`,
                  }}
                />
              </div>
              <h2>{node.question}</h2>
              <div className="options">
                {node.options.map((o) => (
                  <button
                    className={answers[node.id] === o ? "selected" : ""}
                    key={o}
                    onClick={() => {
                      setAnswers({
                        ...Object.fromEntries(
                          ccuFlow.nodes
                            .slice(0, step)
                            .filter((n) => answers[n.id])
                            .map((n) => [n.id, answers[n.id]]),
                        ),
                        [node.id]: o,
                      });
                      setStep(
                        node.nextNodeId
                          ? ccuFlow.nodes.findIndex(
                              (n) => n.id === node.nextNodeId,
                            )
                          : ccuFlow.nodes.length,
                      );
                    }}
                  >
                    {o}
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(step - 1)}>
                <ArrowLeft size={15} />
                返回上一步
              </button>
            </>
          ) : null}
        </section>
        <aside className="panel path-panel">
          <h3>目前判斷路徑</h3>
          <p>
            {p?.code} / {region || "尚未選擇地區"}
          </p>
          {ccuFlow.nodes.map((n, i) => (
            <div
              className={"path-step " + (i === step ? "current" : "")}
              key={n.id}
            >
              <span>{answers[n.id] ? <Check size={13} /> : i + 1}</span>
              <div>
                <small>{n.question}</small>
                <b>{answers[n.id] ?? "尚未確認"}</b>
              </div>
            </div>
          ))}
          <Link to="/knowledge">查看相關術語 →</Link>
        </aside>
      </div>
    </>
  );
}
