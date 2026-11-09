import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  GitBranch,
  Boxes,
  BookOpen,
  Link2,
  Activity,
  ShieldCheck,
  Clock3,
  Radio,
  ChevronRight,
} from "lucide-react";
import { issueTypes } from "../data/flows";
export function Dashboard({
  products,
  links,
  incidents,
  recent,
}: {
  products: number;
  links: number;
  incidents: number;
  recent: string[];
}) {
  return (
    <>
      <div className="eyebrow">YOUR OPERATIONS COMPANION</div>
      <div className="page-heading">
        <div>
          <h1>
            工作總覽<span className="heading-dot">.</span>
          </h1>
          <p>從觀察到理解，讓每一次排查都有方向。</p>
        </div>
        <span className="date-chip">
          {new Date().toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      <section className="hero">
        <div className="hero-text">
          <span className="pill">
            <Radio size={13} /> TROUBLESHOOTING WORKSPACE
          </span>
          <h2>
            異常出現了？
            <br />
            一起找到下一步。
          </h2>
          <p>
            透過逐步引導釐清影響範圍、交叉確認指標，
            <br />
            整理初步檢查方向與交接摘要。
          </p>
          <Link className="primary" to="/troubleshoot">
            開始排查 <ArrowRight size={17} />
          </Link>
          <small>
            <ShieldCheck size={13} /> 僅提供檢查建議，不執行正式環境操作
          </small>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="radar-core">
            <Activity size={45} />
          </div>
          <span className="radar-tag top">01 · 觀察異常</span>
          <span className="radar-tag right">02 · 交叉確認</span>
          <span className="radar-tag bottom">03 · 整理方向</span>
        </div>
      </section>
      <div className="stats">
        {[
          [Boxes, products, "產品資料", "依產品、地區與 IDC 查詢"],
          [GitBranch, 10, "異常入口", "CCU 完整互動排查"],
          [Link2, links, "常用連結", "你的個人監控工具箱"],
          [Clock3, incidents, "事件紀錄", "保留排查脈絡與摘要"],
        ].map(([Icon, count, label, desc], idx) => {
          const I = Icon as typeof Boxes;
          return (
            <div className="stat" key={idx}>
              <div className="stat-top">
                <span className={"stat-icon color-" + idx}>
                  <I size={18} />
                </span>
                <ArrowUpRight size={15} />
              </div>
              <strong>
                {String(count)}
                <span>{String(label)}</span>
              </strong>
              <small>{String(desc)}</small>
            </div>
          );
        })}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-title">
            <h3>
              快速排查 <span>QUICK START</span>
            </h3>
            <Link to="/troubleshoot">
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
          <p className="muted">選擇你正在觀察的異常，開始初步檢查。</p>
          <div className="issue-grid">
            {issueTypes.slice(0, 6).map((name, i) => (
              <Link
                className="issue-card"
                to={"/troubleshoot?issue=" + i}
                key={name}
              >
                <span className={"issue-symbol color-" + (i % 4)}>
                  <Activity size={19} />
                </span>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {
                      [
                        "線上人數與趨勢變化",
                        "登入指標與服務狀態",
                        "延遲與連線品質",
                        "封包傳輸品質",
                        "網路路由與跳點",
                        "請求流量與服務指標",
                      ][i]
                    }
                  </small>
                </div>
                <ChevronRight size={15} />
              </Link>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="section-title">
            <h3>
              工作工具 <span>EXPLORE</span>
            </h3>
          </div>
          {[
            [Boxes, "產品與基礎設施", "快速查閱維運歸屬與 IDC", "/products"],
            [BookOpen, "NOC 知識庫", "在工作情境中理解技術名詞", "/knowledge"],
            [Link2, "監控網址收藏", "集中管理常用 Dashboard 與 SOP", "/links"],
          ].map(([Icon, title, desc, path]) => {
            const I = Icon as typeof Boxes;
            return (
              <Link className="tool-row" to={String(path)} key={String(path)}>
                <I size={21} />
                <div>
                  <strong>{String(title)}</strong>
                  <small>{String(desc)}</small>
                </div>
                <ArrowUpRight size={16} />
              </Link>
            );
          })}
          <div className="mini-note">
            <ShieldCheck size={18} />
            <span>
              尚未設定的公司網址不會被虛構。
              <br />
              你可以在常用連結中自行新增。
            </span>
          </div>
        </section>
      </div>
      <section className="recent">
        <h3>
          <Clock3 size={16} /> 最近使用
        </h3>
        {recent.length ? (
          recent.map((x) => (
            <Link key={x} to={x}>
              {(
                {
                  "/troubleshoot": "故障排查",
                  "/products": "產品查詢",
                  "/regions": "地區查詢",
                  "/idc": "IDC 查詢",
                  "/links": "常用連結",
                  "/knowledge": "知識庫",
                  "/incidents": "事件紀錄",
                  "/learning": "學習模式",
                  "/settings": "設定",
                } as Record<string, string>
              )[x] ?? x}{" "}
              <ArrowUpRight size={13} />
            </Link>
          ))
        ) : (
          <span>還沒有使用紀錄，從一項工具開始探索。</span>
        )}
      </section>
      <div className="notice">
        <ShieldCheck size={16} />
        <span>
          學習輔助，不取代判斷。本工具提供初步方向；通報與正式環境操作請遵循公司
          SOP。
        </span>
      </div>
    </>
  );
}
