import { useState } from "react";
import { ExternalLink, Plus, Trash2, Pencil } from "lucide-react";
import type { QuickLink, Product } from "../types";
import { safeUrl } from "../services/core";
import { issueTypes } from "../data/flows";
export function Links({
  links,
  save,
  products,
}: {
  links: QuickLink[];
  save: (v: QuickLink[]) => void;
  products: Product[];
}) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<QuickLink | null>(null);
  const [error, setError] = useState("");
  function newLink() {
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      url: "",
      category: "Dashboard",
      productIds: [],
      regionIds: [],
      issueTypes: [],
      description: "",
    });
  }
  return (
    <>
      <div className="eyebrow">PERSONAL TOOLBOX</div>
      <div className="page-heading">
        <div>
          <h1>常用連結</h1>
          <p>僅存在本機瀏覽器，不會隨程式碼發佈。</p>
        </div>
        <button className="primary" onClick={newLink}>
          <Plus size={16} />
          新增連結
        </button>
      </div>
      <div className="notice">
        請勿在 URL 放入帳密或
        Token。內部網址是否可儲存在本機，仍須遵守公司政策。
      </div>
      <input
        className="search-field"
        placeholder="搜尋名稱、分類、產品、地區…"
        aria-label="搜尋連結"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {editing && (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (!safeUrl(editing.url)) {
              setError("僅接受無內嵌帳密的 HTTP／HTTPS 網址");
              return;
            }
            save([...links.filter((l) => l.id !== editing.id), editing]);
            setEditing(null);
            setError("");
          }}
        >
          <h2>
            {links.some((l) => l.id === editing.id) ? "編輯連結" : "新增連結"}
          </h2>
          <div className="form-grid">
            {(["name", "url", "category", "description"] as const).map(
              (key, i) => (
                <label key={key}>
                  {["名稱", "URL", "分類", "說明"][i]}
                  <input
                    required={key !== "description"}
                    value={editing[key]}
                    onChange={(e) =>
                      setEditing({ ...editing, [key]: e.target.value })
                    }
                  />
                </label>
              ),
            )}
            <label>
              關聯產品（可複選）
              <select
                multiple
                value={editing.productIds}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    productIds: Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    ),
                  })
                }
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              關聯地區（逗號分隔；留空代表全部）
              <input
                value={editing.regionIds.join(",")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    regionIds: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label>
              關聯異常（可複選；不選代表全部）
              <select
                multiple
                value={editing.issueTypes}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    issueTypes: Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    ),
                  })
                }
              >
                {issueTypes.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <button className="primary">儲存</button>
            <button type="button" onClick={() => setEditing(null)}>
              取消
            </button>
          </div>
        </form>
      )}
      <div className="cards">
        {links
          .filter((l) =>
            JSON.stringify(l).toLowerCase().includes(q.toLowerCase()),
          )
          .map((l) => (
            <article className="panel" key={l.id}>
              <span className="badge">{l.category}</span>
              <h3>{l.name}</h3>
              <p>{l.description}</p>
              <p className="muted">
                {l.regionIds.join(" · ")} {l.issueTypes.join(" · ")}
              </p>
              <div className="actions">
                <a
                  className="button"
                  href={safeUrl(l.url) ? l.url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  開啟 <ExternalLink size={14} />
                </a>
                <button
                  aria-label={"編輯 " + l.name}
                  onClick={() => setEditing(l)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label={"刪除 " + l.name}
                  onClick={() => {
                    if (confirm("刪除此連結？"))
                      save(links.filter((x) => x.id !== l.id));
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
      </div>
      {!links.length && (
        <div className="empty panel">
          <ExternalLink size={28} />
          <h3>尚未設定連結</h3>
          <p>
            新增 CCU Dashboard、SGS Monitoring 或正式 SOP 網址，建立你的工具箱。
          </p>
          <button onClick={newLink}>新增第一個連結</button>
        </div>
      )}
    </>
  );
}
