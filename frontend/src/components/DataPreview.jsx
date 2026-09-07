import React, { useState, useMemo } from "react";
import { Table2, ChevronDown, ChevronUp, Eye, Search, AlertTriangle, Copy, Check } from "lucide-react";

export default function DataPreview({ sampleRows, attributes }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [copied, setCopied] = useState(false);

  // Missing values count
  const missingCount = useMemo(() => {
    if (!sampleRows) return 0;
    let count = 0;
    for (const row of sampleRows) {
      for (const cell of row) {
        if (cell === null || cell === undefined || cell === "?" || cell === "") {
          count++;
        }
      }
    }
    return count;
  }, [sampleRows]);

  // Filtered rows based on search
  const filteredRows = useMemo(() => {
    if (!sampleRows) return [];
    if (!searchQuery.trim()) return sampleRows;
    const q = searchQuery.toLowerCase();
    return sampleRows.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(q))
    );
  }, [sampleRows, searchQuery]);

  if (!sampleRows || sampleRows.length === 0 || !attributes || attributes.length === 0) {
    return null;
  }

  const visibleRows = pageSize === 0 ? filteredRows : filteredRows.slice(0, pageSize);
  const hasMore = pageSize !== 0 && filteredRows.length > pageSize;

  const formatCell = (val) => {
    if (val === null || val === undefined || val === "?") {
      return (
        <span className="cell-missing" style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "1px 6px",
          borderRadius: "4px",
          background: "rgba(245, 158, 11, 0.15)",
          color: "#f59e0b",
          fontWeight: 700,
          fontSize: "0.75rem"
        }}>
          ?
        </span>
      );
    }
    const str = String(val);
    if (str.length > 45) return str.slice(0, 42) + "…";
    return str;
  };

  const handleCopyTableCsv = () => {
    const header = attributes.map((a) => a.name).join(",");
    const rows = filteredRows.map((r) => r.map((c) => (c === null || c === undefined ? "?" : `"${String(c).replace(/"/g, '""')}"`)).join(","));
    const csvContent = [header, ...rows].join("\n");
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel fade-in-up" style={{ padding: "0", marginBottom: "28px", overflow: "hidden" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          background: "rgba(15, 23, 42, 0.65)",
          borderBottom: isExpanded ? "1px solid var(--border-subtle)" : "none",
          userSelect: "none",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div
          onClick={() => setIsExpanded((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
        >
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
            border: "1px solid rgba(6, 182, 212, 0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#22d3ee",
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.2)"
          }}>
            <Eye size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Interactive Data Preview</h3>
              <span style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                fontWeight: 700
              }}>
                {attributes.length} Cols &bull; {sampleRows.length} Rows In Memory
              </span>
              {missingCount > 0 && (
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#fbbf24",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <AlertTriangle size={11} />
                  {missingCount} Missing (?)
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
              Previewing sampled data instances with inferred schema datatypes
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isExpanded && (
            <>
              {/* Search filter */}
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "6px 10px 6px 30px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    outline: "none",
                    width: "160px"
                  }}
                />
              </div>

              {/* Rows per page selector */}
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                <option value={10}>Show 10</option>
                <option value={25}>Show 25</option>
                <option value={50}>Show 50</option>
                <option value={0}>Show All ({sampleRows.length})</option>
              </select>

              {/* Copy preview */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyTableCsv}
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                title="Copy current preview as CSV"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Table Content */}
      {isExpanded && (
        <div className="table-container" style={{ border: "none", borderRadius: 0, maxHeight: "420px" }}>
          <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center", background: "rgba(15, 23, 42, 0.95)" }}>#</th>
                {attributes.map((attr, i) => (
                  <th key={i} title={attr.name} style={{ background: "rgba(15, 23, 42, 0.95)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{attr.name}</span>
                      <span className={`badge badge-${attr.type}`} style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                        {attr.type}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={attributes.length + 1} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                    No rows match query "{searchQuery}"
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                      {ri + 1}
                    </td>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ fontFamily: cell === null ? "inherit" : "var(--font-mono)", fontSize: "0.82rem" }}>
                        {formatCell(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {hasMore && (
            <div style={{
              textAlign: "center", padding: "10px 0", fontSize: "0.78rem",
              color: "var(--text-muted)", background: "rgba(15, 23, 42, 0.4)",
              borderTop: "1px solid var(--border-subtle)"
            }}>
              Showing {visibleRows.length} of {filteredRows.length} rows &bull;{" "}
              <button
                type="button"
                onClick={() => setPageSize(0)}
                style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", textDecoration: "underline", fontSize: "0.78rem" }}
              >
                Expand all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
