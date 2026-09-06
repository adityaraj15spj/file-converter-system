import React from "react";
import { AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

export default function ValidationAlerts({ defects }) {
  if (!defects || defects.length === 0) {
    return null;
  }

  const fatalCount = defects.filter((d) => d.is_fatal).length;
  const warningCount = defects.length - fatalCount;

  return (
    <div className="glass-panel" style={{ padding: "18px 22px", marginBottom: "24px", borderColor: fatalCount > 0 ? "rgba(244, 63, 94, 0.4)" : "rgba(245, 158, 11, 0.4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        {fatalCount > 0 ? (
          <XCircle size={20} color="#f43f5e" />
        ) : (
          <AlertTriangle size={20} color="#f59e0b" />
        )}
        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: fatalCount > 0 ? "#fda4af" : "#fcd34d" }}>
          Validation &amp; Error Reporting (FR-014) &mdash; {defects.length} Issue{defects.length > 1 ? "s" : ""} Identified
        </h4>
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
        {fatalCount > 0
          ? "Conversion was halted to maintain data integrity (Design Constraint C-003 / FR-014). Please review the line-level errors below:"
          : "The following warnings were noted during parsing and type inference:"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {defects.map((defect, i) => (
          <div key={i} className="defect-card">
            <span className="line-badge">Line {defect.line_number}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{defect.defect_type}</strong>
                {defect.column && (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", fontSize: "0.68rem" }}>
                    Col: {defect.column}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                {defect.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
