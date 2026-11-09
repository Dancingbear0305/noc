import { ExceptionWidget } from "./ExceptionWidget";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  GitBranch,
  Boxes,
  Globe,
  Server,
  BookOpen,
  Link2,
  ClipboardList,
  GraduationCap,
  Settings,
  Search,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";
const nav = [
  ["/", "Dashboard", LayoutDashboard],
  ["/troubleshoot", "故障排查", GitBranch],
  ["/products", "產品查詢", Boxes],
  ["/regions", "地區查詢", Globe],
  ["/idc", "IDC 查詢", Server],
  ["/knowledge", "知識庫", BookOpen],
  ["/links", "常用連結", Link2],
  ["/incidents", "事件紀錄", ClipboardList],
  ["/learning", "學習模式", GraduationCap],
  ["/settings", "設定", Settings],
] as const;
export function Layout({
  light,
  toggle,
}: {
  light: boolean;
  toggle: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className={light ? "shell light" : "shell"}>
      <aside>
        <a className="brand" href="#/">
          <span className="brand-icon">
            <Activity />
          </span>
          <span>
            NOC <b>Navigator</b>
            <small>你的日常維運導航</small>
          </span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon size={18} />
              {label}
              {path === "/troubleshoot" && <span className="tiny">FLOW</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-note">
          <ShieldCheck size={21} />
          <strong>本機優先 · 資料自主</strong>
          <small>
            個人資料僅存於此瀏覽器
            <br />
            不連接正式監控系統
          </small>
        </div>
        <div className="profile">
          <span className="avatar">N</span>
          <span>
            NOC Workspace<small>學習與初步排查</small>
          </span>
          <span className="dot" />
        </div>
      </aside>
      <div className="workspace">
        <header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q");
              navigate("/knowledge?q=" + encodeURIComponent(String(q)));
            }}
          >
            <Search size={17} />
            <input
              name="q"
              placeholder="搜尋知識、術語與排查方向…"
              aria-label="搜尋知識"
            />
          </form>
          <span className="local-status">
            <span className="dot" /> 本機工作區
          </span>
          <button className="icon-btn" onClick={toggle} aria-label="切換主題">
            {light ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </header>
        <main>
          <Outlet />
        </main>
        <footer>
          NOC NAVIGATOR{" "}
          <span>學習與初步排查輔助工具 · 請以公司正式 SOP 為準</span>
          <b>v1.0</b>
        </footer>
      </div>
      <ExceptionWidget />
    </div>
  );
}
