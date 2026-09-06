import React from "react";
import { Table, CheckSquare, Edit3, Tag } from "lucide-react";

export default function SchemaReviewTable({
  attributes,
  onAttributeChange,
  instanceCount
}) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  const handleTypeChange = (index, newType) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], type: newType };
    onAttributeChange(updated);
  };

  const handleNameChange = (index, newName) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], name: newName };
    onAttributeChange(updated);
  };

  return (
    <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Table size={18} color="var(--accent-emerald)" />
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Interactive Schema Review &amp; Override (FR-010)
          </h4>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {attributes.length} attributes detected &bull; {instanceCount} records
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>#</th>
              <th>Attribute Name (Rename)</th>
              <th style={{ width: "180px" }}>Inferred Type</th>
              <th>Enumerated / Details</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr, idx) => (
              <tr key={idx}>
                <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {idx + 1}
                </td>
                <td>
                  <input
                    type="text"
                    className="input-field"
                    value={attr.name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "0.85rem", maxWidth: "260px" }}
                  />
                </td>
                <td>
                  <select
                    className="input-field"
                    value={attr.type}
                    onChange={(e) => handleTypeChange(idx, e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                  >
                    <option value="numeric">NUMERIC</option>
                    <option value="nominal">NOMINAL</option>
                    <option value="string">STRING</option>
                    <option value="date">DATE</option>
                  </select>
                </td>
                <td>
                  {attr.type === "nominal" && attr.nominal_values && attr.nominal_values.length > 0 ? (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {attr.nominal_values.length} classes:
                      </span>
                      {attr.nominal_values.slice(0, 6).map((val, vIdx) => (
                        <span key={vIdx} className="badge badge-nominal" style={{ fontSize: "0.7rem", textTransform: "none" }}>
                          {val}
                        </span>
                      ))}
                      {attr.nominal_values.length > 6 && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          +{attr.nominal_values.length - 6} more
                        </span>
                      )}
                    </div>
                  ) : attr.type === "date" ? (
                    <span className="badge badge-date">Format: {attr.date_format || "yyyy-MM-dd"}</span>
                  ) : attr.type === "numeric" ? (
                    <span className="badge badge-numeric">Real / Integer</span>
                  ) : (
                    <span className="badge badge-string">Freeform Text</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
