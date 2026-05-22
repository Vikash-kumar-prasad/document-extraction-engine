/**
 * Renders a field value — handles strings, numbers, arrays, objects.
 */
export default function FieldValue({ value }) {
  if (value === null || value === undefined) {
    return <span className="null-value">— not found</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="null-value">— empty</span>;

    // Array of primitives → tag cloud
    if (typeof value[0] !== "object") {
      return (
        <div className="tag-list">
          {value.map((v, i) => (
            <span key={i} className="tag">{String(v)}</span>
          ))}
        </div>
      );
    }

    // Array of objects → nested cards
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {value.map((item, i) => (
          <div key={i} className="nested-item">
            {Object.entries(item).map(([k, v]) =>
              v !== null && v !== undefined ? (
                <div key={k}>
                  <div className="nested-key">{k}</div>
                  <div className="nested-val">{String(v)}</div>
                </div>
              ) : null
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="nested-item">
        {Object.entries(value).map(([k, v]) =>
          v !== null && v !== undefined ? (
            <div key={k}>
              <div className="nested-key">{k}</div>
              <div className="nested-val">{String(v)}</div>
            </div>
          ) : null
        )}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}
