import React, { useState } from "react";
import { Download, Copy, Check, FileCheck, ExternalLink, Zap } from "lucide-react";

export default function OutputPreview({
  result,
  downloadUrl,
  onDownload
}) {
  const [copied, setCopied] = useState(false);

  if (!result || !result.success) {
    return null;
  }

  const handleCopy = () => {
    if (result.full_output) {
      navigator.clipboard.writeText(result.full_output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "22px 26px", marginBottom: "32px", borderColor: "rgba(16, 185, 129, 0.35)" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileCheck size={18} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Converted Output Studio (FR-015)</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              File generated: <strong style={{ color: "var(--text-primary)" }}>{result.filename}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button id="btn-copy-preview" className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy Content"}</span>
          </button>

          <button id="btn-download-converted" className="btn btn-success btn-sm" onClick={onDownload}>
            <Download size={14} />
            <span>Download ({result.filename?.split('.').pop()?.toUpperCase()})</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "18px" }}>
        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>INSTANCES</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#60a5fa" }}>
            {result.instance_count}
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>ATTRIBUTES</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#c084fc" }}>
            {result.attribute_count}
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>RELATION</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.relation_name || "dataset"}
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
            <Zap size={11} color="#f59e0b" />
            <span>LATENCY</span>
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#34d399" }}>
            {result.duration_ms} ms
          </div>
        </div>
      </div>

      {/* Code Snippet Box */}
      <div className="code-preview">
        {result.full_output ? result.full_output.slice(0, 4000) : result.preview_header}
        {result.full_output && result.full_output.length > 4000 && "\n\n... [Output truncated for preview. Click Download for the complete dataset]"}
      </div>
    </div>
  );
}
