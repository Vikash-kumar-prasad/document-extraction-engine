import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function HistoryPage() {
  const [extractions, setExtractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/extractions")
      .then((res) => setExtractions(res.data))
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div className="loader-text">Loading history…</div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Extraction History</h1>
        <p className="page-subtitle">All past document extractions, newest first.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {extractions.length === 0 && !error ? (
        <div className="empty">
          <span className="empty-icon">⬡</span>
          <div className="empty-title">No extractions yet</div>
          <div className="empty-text">Upload your first document to get started.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {extractions.map((ex) => (
                <tr key={ex._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/extractions/${ex._id}`)}>
                  <td>
                    <span className="filename">{ex.filename}</span>
                  </td>
                  <td>
                    <span className="type-pill">{ex.documentType}</span>
                  </td>
                  <td>
                    <span className={`status-chip status-${ex.status}`}>
                      {ex.status === "success" ? "✓" : ex.status === "partial" ? "⚠" : "✕"}{" "}
                      {ex.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {new Date(ex.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span style={{ color: "var(--accent2)", fontSize: 13 }}>View →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
