import { RegionNews } from "../components/RegionNews";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { queryProducts } from "../services/core";
import { statusLabels } from "../data/products";
import type { Product } from "../types";
export function Catalog({ products }: { products: Product[] }) {
  const path = useLocation().pathname;
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [idc, setIdc] = useState("");
  const [sort, setSort] = useState("asc");
  const regions = [
    ...new Set([
      ...products.flatMap((p) => p.regions),
      ...(path === "/regions" ? ["VN"] : []),
    ]),
  ].sort();
  const idcs = [
    ...new Set(
      products.flatMap((p) => p.idcMappings.map((m) => m.idcLocation)),
    ),
  ].sort();
  const rows = queryProducts(products, q, region, idc).sort(
    (a, b) => a.code.localeCompare(b.code) * (sort === "asc" ? 1 : -1),
  );
  return (
    <>
      <div className="eyebrow">INFRASTRUCTURE DIRECTORY</div>
      <h1>
        {path === "/regions"
          ? "地區查詢"
          : path === "/idc"
            ? "IDC 查詢"
            : "產品查詢"}
      </h1>
      <p className="muted">
        服務地區與 IDC 所在地分開記錄；未記錄不代表未提供服務。
      </p>
      <section className="panel filters">
        <input
          aria-label="搜尋產品"
          placeholder="搜尋產品、團隊、備註…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="依地區篩選"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">所有服務地區</option>
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="依 IDC 篩選"
          value={idc}
          onChange={(e) => setIdc(e.target.value)}
        >
          <option value="">所有 IDC</option>
          {idcs.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="排序"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="asc">產品 A → Z</option>
          <option value="desc">產品 Z → A</option>
        </select>
        <button
          onClick={() => {
            setQ("");
            setRegion("");
            setIdc("");
            setSort("asc");
          }}
        >
          清除篩選
        </button>
      </section>
      {path === "/regions" && <RegionNews region={region} />}
      <p className="muted">{rows.length} 項產品 · 點選以展開關聯資料</p>
      {rows.map((p) => (
        <details className="panel product" key={p.id}>
          <summary>
            <strong>{p.code}</strong>
            <span>{p.regions.join(" · ") || "地區未記錄"}</span>
            <span className="badge">{statusLabels[p.verificationStatus]}</span>
          </summary>
          <p>{p.notes}</p>
          <h3>地區與維運團隊</h3>
          <div className="chips">
            {p.regions.map((r) => (
              <span key={r}>
                {r} · {p.responsibleTeams[r] || "Not recorded｜歸屬未記錄"}
              </span>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>服務地區</th>
                  <th>Vendor</th>
                  <th>IDC 地點</th>
                  <th>可信狀態／備註</th>
                </tr>
              </thead>
              <tbody>
                {p.idcMappings.map((m, i) => (
                  <tr key={i}>
                    <td>{m.serviceRegion ?? "對應未記錄"}</td>
                    <td>{m.vendor || "未記錄"}</td>
                    <td>{m.idcLocation || "未記錄"}</td>
                    <td>
                      {statusLabels[m.verificationStatus]}
                      <small>{m.notes}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!p.idcMappings.length && <p>Not recorded｜IDC 尚未記錄</p>}
        </details>
      ))}
      {!rows.length && (
        <div className="empty panel">
          沒有符合條件的筆記；這不代表相關服務不存在。
        </div>
      )}
    </>
  );
}
