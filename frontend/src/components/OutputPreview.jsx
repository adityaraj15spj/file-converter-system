import React, { useState } from "react";
import { Download, Copy, Check, FileCheck, Zap, Layers, Database, Code, CheckCircle } from "lucide-react";

export default function OutputPreview({
  result,
  downloadUrl,
  onDownload
}) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // "preview" | "full"

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

  const extension = result.filename?.split('.').pop()?.toUpperCase() || "FILE";

  return (
    <div className="glass-panel fade-in-up" style={{
      padding: "24px 28px",
      marginBottom: "36px",
      borderColor: "rgba(16, 185, 129, 0.4)",
      background: "radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.08) 0%, rgba(18, 24, 38, 0.85) 100%)",
      boxShadow: "0 0 35px rgba(16, 185, 129, 0.15), var(--shadow-lg)"
    }}>
      {/* Top Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)"
          }}>
            <FileCheck size={20} style={{ color: "#34d399" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Dataset Conversion Studio</h3>
              <span style={{
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.18)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#6ee7b7",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase"
              }}>
                Ready to Export
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
              Generated Artifact: <strong style={{ color: "var(--text-primary)" }}>{result.filename}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            id="btn-copy-preview"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            style={{ fontSize: "0.84rem", padding: "8px 14px" }}
          >
            {copied ? <Check size={15} style={{ color: "#10b981" }} /> : <Copy size={15} />}
            <span>{copied ? "Copied Content!" : "Copy Output"}</span>
          </button>

          <button
            id="btn-download-converted"
            type="button"
            className="btn btn-success btn-sm"
            onClick={onDownload}
            style={{
              fontSize: "0.88rem",
              padding: "9px 18px",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.35)",
              fontWeight: 700
            }}
          >
            <Download size={16} />
            <span>Download {extension}</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <div style={{
          background: "rgba(15, 23, 42, 0.65)", padding: "12px 16px", borderRadius: "10px",
          border: "1px solid var(--border-subtle)", transition: "transform 0.2s ease"
        }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
            <Layers size={12} style={{ color: "#60a5fa" }} />
            <span>INSTANCES</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#60a5fa", marginTop: "4px" }}>
            {result.instance_count.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: "rgba(15, 23, 42, 0.65)", padding: "12px 16px", borderRadius: "10px",
          border: "1px solid var(--border-subtle)", transition: "transform 0.2s ease"
        }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
            <Database size={12} style={{ color: "#c084fc" }} />
            <span>ATTRIBUTES</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#c084fc", marginTop: "4px" }}>
            {result.attribute_count}
          </div>
        </div>

        <div style={{
          background: "rgba(15, 23, 42, 0.65)", padding: "12px 16px", borderRadius: "10px",
          border: "1px solid var(--border-subtle)", transition: "transform 0.2s ease"
        }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
            RELATION SPEC
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
            @{result.relation_name || "dataset"}
          </div>
        </div>

        <div style={{
          background: "rgba(15, 23, 42, 0.65)", padding: "12px 16px", borderRadius: "10px",
          border: "1px solid var(--border-subtle)", transition: "transform 0.2s ease"
        }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
            <Zap size={12} style={{ color: "#f59e0b" }} />
            <span>EXEC LATENCY</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#34d399", marginTop: "4px" }}>
            {result.duration_ms} ms
          </div>
        </div>
      </div>

      {/* View Switcher & Code Preview */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: 600,
              background: viewMode === "preview" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: viewMode === "preview" ? "#a5b4fc" : "var(--text-muted)",
              border: viewMode === "preview" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
              cursor: "pointer"
            }}
          >
            Formatted Header Preview
          </button>
          <button
            type="button"
            onClick={() => setViewMode("full")}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: 600,
              background: viewMode === "full" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: viewMode === "full" ? "#a5b4fc" : "var(--text-muted)",
              border: viewMode === "full" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
              cursor: "pointer"
            }}
          >
            Complete Stream View
          </button>
        </div>

        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          WEKA 3.8+ &amp; RFC 4180 Lossless Conformance
        </span>
      </div>

      <div className="code-preview" style={{
        maxHeight: "360px",
        overflowY: "auto",
        background: "rgba(10, 14, 23, 0.9)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        fontSize: "0.84rem",
        lineHeight: 1.6
      }}>
        {viewMode === "preview" ? (
          result.preview_header || result.full_output?.slice(0, 1500)
        ) : (
          result.full_output || result.preview_header
        )}
      </div>
    </div>
  );
}
