import ConfidenceBadge from "./ConfidenceBadge.jsx";
import FieldValue from "./FieldValue.jsx";

function formatFieldName(name) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExtractionResult({ extraction }) {
  const { filename, documentType, status, result, createdAt } = extraction;

  const confidenceCounts = Object.values(result).reduce(
    (acc, field) => {
      if (field?.confidence) acc[field.confidence] = (acc[field.confidence] || 0) + 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
            {filename}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="type-pill">{documentType}</span>
            <span className={`status-chip status-${status}`}>
              {status === "success" ? "✓" : status === "partial" ? "⚠" : "✕"} {status}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
          {new Date(createdAt).toLocaleString()}
        </div>
      </div>

      {/* Confidence summary bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {["high", "medium", "low"].map((c) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ConfidenceBadge confidence={c} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)" }}>
              {confidenceCounts[c]}
            </span>
          </div>
        ))}
      </div>

      {/* Fields */}
      <div className="result-grid">
        {Object.entries(result).map(([fieldName, fieldData]) => {
          if (!fieldData) return null;
          const { value, confidence, note } = fieldData;

          return (
            <div key={fieldName} className="result-field">
              <div className="result-field-name">{formatFieldName(fieldName)}</div>
              <div>
                <div className={`result-field-value${value === null ? " null-value" : ""}`}>
                  <FieldValue value={value} />
                </div>
                {note && <div className="result-field-note">ℹ {note}</div>}
              </div>
              <ConfidenceBadge confidence={confidence} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
