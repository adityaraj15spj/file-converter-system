import React from "react";
import { SlidersHorizontal } from "lucide-react";

export default function ParsingOptions({
  options,
  onChange,
  sourceFormat
}) {
  return (
    <div className="glass-panel" style={{ padding: "18px 22px", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <SlidersHorizontal size={18} color="var(--accent-indigo)" />
        <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Parsing & Relation Configuration (FR-007)</h4>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
            Relation Name (@relation)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. iris_dataset"
            value={options.relationName || ""}
            onChange={(e) => onChange({ ...options, relationName: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
            Field Delimiter
          </label>
          <select
            className="input-field"
            value={options.delimiter}
            onChange={(e) => onChange({ ...options, delimiter: e.target.value })}
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="	">Tab (\t)</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
            Quote Character
          </label>
          <select
            className="input-field"
            value={options.quoteChar}
            onChange={(e) => onChange({ ...options, quoteChar: e.target.value })}
          >
            <option value='"'>Double Quote (&quot;)</option>
            <option value="'">Single Quote (&apos;)</option>
          </select>
        </div>

        {sourceFormat === "csv" && (
          <div style={{ display: "flex", alignItems: "center", paddingTop: "26px", gap: "10px" }}>
            <input
              type="checkbox"
              id="hasHeaderToggle"
              style={{ width: "16px", height: "16px", accentColor: "var(--accent-indigo)", cursor: "pointer" }}
              checked={options.hasHeader}
              onChange={(e) => onChange({ ...options, hasHeader: e.target.checked })}
            />
            <label htmlFor="hasHeaderToggle" style={{ fontSize: "0.85rem", cursor: "pointer", fontWeight: 500 }}>
              First row is CSV Header
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
