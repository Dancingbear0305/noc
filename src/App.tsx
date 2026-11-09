import { useEffect, useState } from "react";
import { copyText } from "./utils/clipboard";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Wizard } from "./pages/Wizard";
import { Catalog } from "./pages/Catalog";
import { Links } from "./pages/Links";
import { Knowledge, Incidents, Learning, Settings } from "./pages/Extras";
import { useLocal } from "./hooks/useLocal";
import { demoProducts } from "./data/products";
import { safeUrl, validateFlow } from "./services/core";
import { ccuFlow } from "./data/flows";
import type { Product, QuickLink, Incident } from "./types";
validateFlow(ccuFlow);
function AppRoutes() {
  const [products, setProducts, pe] = useLocal<Product[]>(
    "products",
    demoProducts,
  );
  const [links, setLinks, le] = useLocal<QuickLink[]>("links", []);
  const [incidents, setIncidents, ie] = useLocal<Incident[]>("incidents", []);
  const [light, setLight, te] = useLocal("light", false);
  const [recent, setRecent, re] = useLocal<string[]>("recent", []);
  const [toast, setToast] = useState("");
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/") {
      setRecent(
        [pathname, ...recent.filter((r) => r !== pathname)].slice(0, 5),
      );
    }
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function copy(s: string) {
    try {
      await copyText(s);
      setToast("摘要已複製；請只在授權管道分享。");
    } catch {
      setToast("無法存取剪貼簿，請選取摘要手動複製。");
    }
  }
  const validLinks = links.filter((l) => safeUrl(l.url));
  return (
    <>
      <Routes>
        <Route
          element={<Layout light={light} toggle={() => setLight(!light)} />}
        >
          <Route
            index
            element={
              <Dashboard
                products={products.length}
                links={links.length}
                incidents={incidents.length}
                recent={recent}
              />
            }
          />
          <Route
            path="troubleshoot"
            element={
              <Wizard
                products={products}
                links={validLinks}
                saveIncident={(i) => setIncidents([i, ...incidents])}
                copy={copy}
              />
            }
          />
          {["products", "regions", "idc"].map((p) => (
            <Route key={p} path={p} element={<Catalog products={products} />} />
          ))}
          <Route
            path="links"
            element={
              <Links products={products} links={links} save={setLinks} />
            }
          />
          <Route path="knowledge" element={<Knowledge />} />
          <Route
            path="incidents"
            element={
              <Incidents
                incidents={incidents}
                save={setIncidents}
                copy={copy}
              />
            }
          />
          <Route path="learning" element={<Learning products={products} />} />
          <Route
            path="settings"
            element={
              <Settings products={products} saveProducts={setProducts} />
            }
          />
          <Route
            path="*"
            element={
              <div className="panel">
                <h1>找不到這個頁面</h1>
                <a href="#/">返回 Dashboard</a>
              </div>
            }
          />
        </Route>
      </Routes>
      {(pe || le || ie || te || re || toast) && (
        <div className="toast" role="status">
          {pe || le || ie || te || re || toast}
        </div>
      )}
    </>
  );
}
export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
