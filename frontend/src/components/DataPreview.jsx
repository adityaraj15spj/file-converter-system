import React, { useState } from "react";
import { Table2, ChevronDown, ChevronUp, Eye } from "lucide-react";

export default function DataPreview({ sampleRows, attributes }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const MAX_VISIBLE = 8;

  if (!sampleRows || sampleRows.length === 0 || !attributes || attributes.length === 0) {
    return null;
  }

  const visibleRows = sampleRows.slice(0, MAX_VISIBLE);
  const hasMore = sampleRows.length > MAX_VISIBLE;

  const formatCell = (val) => {
    if (val === null || val === undefined) {
      return <span className="cell-missing">?</span>;
    }
    const str = String(val);
    if (str.length > 40) return str.slice(0, 37) + "…";
    return str;
  };

  return (
    <div className="glass-panel fade-in-up" style={{ padding: "0", marginBottom: "24px", overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          cursor: "pointer",
          background: "rgba(15, 23, 42, 0.5)",
          borderBottom: isExpanded ? "1px solid var(--border-subtle)" : "none",
          userSelect: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6, 182, 212, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#22d3ee"
          }}>
            <Eye size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "2px" }}>Data Preview</h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Showing {visibleRows.length} of {sampleRows.length} rows · {attributes.length} columns
            </span>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
      </div>

      {/* Table */}
      {isExpanded && (
        <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: "44px", textAlign: "center" }}>#</th>
                {attributes.map((attr, i) => (
                  <th key={i} title={attr.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{attr.name}</span>
                      <span className={`badge badge-${attr.type}`} style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                        {attr.type}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{ri + 1}</td>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ fontFamily: cell === null ? "inherit" : "var(--font-mono)", fontSize: "0.82rem" }}>
                      {formatCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div style={{
              textAlign: "center", padding: "10px 0", fontSize: "0.78rem",
              color: "var(--text-muted)", background: "rgba(15, 23, 42, 0.3)",
              borderTop: "1px solid var(--border-subtle)"
            }}>
              +{sampleRows.length - MAX_VISIBLE} more rows not shown
            </div>
          )}
        </div>
      )}
    </div>
  );
}
