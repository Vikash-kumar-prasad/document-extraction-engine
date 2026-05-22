import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ExtractionResult from "../components/ExtractionResult.jsx";

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [extraction, setExtraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`/api/extractions/${id}`)
      .then((res) => setExtraction(res.data))
      .catch(() => setError("Extraction not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div className="loader-text">Loading extraction…</div>
      </div>
    );

  if (error)
    return (
      <>
        <div className="error-box">{error}</div>
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/history")}>
          ← Back to History
        </button>
      </>
    );

  return (
    <>
      <div className="page-header">
        <button
          className="btn btn-ghost"
          style={{ marginBottom: 20, padding: "8px 14px", fontSize: 13 }}
          onClick={() => navigate("/history")}
        >
          ← History
        </button>
        <h1 className="page-title">Extraction Detail</h1>
      </div>

      {extraction && <ExtractionResult extraction={extraction} />}
    </>
  );
}
