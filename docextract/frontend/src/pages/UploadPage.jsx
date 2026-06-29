import { useState, useRef } from "react";
import axios from "axios";
import ExtractionResult from "../components/ExtractionResult.jsx";

// API URL
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const DOC_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "resume", label: "Resume / CV" },
  { value: "contract", label: "Contract" },
];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("resume");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError("");
      setResult(null);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setError("");
      setResult(null);
    }
  }

  async function handleSubmit() {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", docType);

      const { data } = await axios.post(
        `${API_URL}/api/extract`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Extraction failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Extract Document</h1>
        <p className="page-subtitle">
          Upload a PDF or text file — get clean, structured JSON with confidence
          scores.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div
          className={`upload-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
          />

          <span className="upload-icon">⬡</span>

          <span className="upload-label">
            {file ? "File selected" : "Drop your file here"}
          </span>

          <span className="upload-hint">
            PDF or plain text · max 10 MB
          </span>
        </div>

        {file && (
          <div className="file-selected">
            <span>📄</span>
            <span>{file.name}</span>

            <span
              style={{
                marginLeft: "auto",
                color: "var(--text3)",
              }}
            >
              {(file.size / 1024).toFixed(1)} KB
            </span>

            <button
              className="btn btn-ghost"
              style={{
                padding: "4px 10px",
                fontSize: 12,
              }}
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="field-group">
          <label className="field-label">Document Type</label>

          <select
            className="select"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            className="error-box"
            style={{
              marginTop: 16,
            }}
          >
            <span>⚠</span> {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{
            marginTop: 20,
            width: "100%",
          }}
          onClick={handleSubmit}
          disabled={loading || !file}
        >
          {loading ? "Extracting…" : "Extract Document"}
        </button>
      </div>

      {loading && (
        <div className="loader-wrap">
          <div className="spinner" />
          <div className="loader-text">
            Parsing document with AI…
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          <div className="divider" />

          <div className="section-title">
            <span>✓</span> Extraction Result
          </div>

          <ExtractionResult extraction={result} />
        </>
      )}
    </>
  );
}