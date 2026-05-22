import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import UploadPage from "./pages/UploadPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";

function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span>⬡</span> Vikash<span>Docs</span>
      </div>

      <NavLink
        to="/"
        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
        <span>⬆</span> Extract
      </NavLink>

      <NavLink
        to="/history"
        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
        <span>☰</span> History
      </NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/extractions/:id" element={<ResultPage />} />
        </Routes>
      </main>
    </div>
  );
}
