import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Workbench } from "./pages/Workbench";
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Workbench />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
