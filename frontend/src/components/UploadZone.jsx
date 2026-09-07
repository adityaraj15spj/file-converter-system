import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, FileCode, CheckCircle2, ArrowRight, ArrowLeftRight, Sparkles, RefreshCw, FileText } from "lucide-react";

export default function UploadZone({
  selectedFile,
  onFileSelect,
  sourceFormat,
  targetFormat,
  onTargetFormatChange,
  isInspecting,
  onLoadSample,
  sampleList
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const swapFormats = () => {
    const nextTarget = sourceFormat.toLowerCase() === "csv" ? "csv" : "arff";
    onTargetFormatChange(nextTarget);
  };

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Quick Benchmark Chips Carousel */}
      <div style={{
        marginBottom: "16px",
        padding: "12px 16px",
        background: "rgba(15, 23, 42, 0.45)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={15} style={{ color: "#38bdf8" }} />
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Instant Benchmark Datasets:
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {sampleList && sampleList.map((s) => (
            <button
              key={s.id}
              id={`btn-sample-${s.id.replace(".", "-")}`}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onLoadSample(s.id)}
              style={{
                fontSize: "0.78rem",
                padding: "5px 12px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                transition: "all 0.2s ease"
              }}
              title={s.description}
            >
              {s.source_format === "csv" ? (
                <FileSpreadsheet size={13} style={{ color: "#60a5fa" }} />
              ) : (
                <FileCode size={13} style={{ color: "#c084fc" }} />
              )}
              <span style={{ fontWeight: 600 }}>{s.filename}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Upload Dropzone */}
      <div
        id="upload-dropzone"
        className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        style={{
          position: "relative",
          cursor: "pointer",
          border: isDragging ? "2px dashed var(--accent-blue)" : "2px dashed rgba(99, 102, 241, 0.35)",
          borderRadius: "var(--radius-lg)",
          padding: "38px 24px",
          textAlign: "center",
          background: isDragging
            ? "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)"
            : "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isDragging ? "0 0 30px rgba(59, 130, 246, 0.25)" : "var(--shadow-md)"
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.arff,.txt,.data"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />

        <div style={{
          width: "60px",
          height: "60px",
          margin: "0 auto 16px auto",
          borderRadius: "16px",
          background: selectedFile
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)"
            : "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
          border: selectedFile
            ? "1px solid rgba(16, 185, 129, 0.4)"
            : "1px solid rgba(99, 102, 241, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: selectedFile ? "0 0 20px rgba(16, 185, 129, 0.3)" : "0 0 20px rgba(99, 102, 241, 0.3)"
        }}>
          {selectedFile ? (
            <CheckCircle2 size={32} style={{ color: "#10b981" }} />
          ) : (
            <UploadCloud size={32} style={{ color: "#818cf8" }} />
          )}
        </div>

        {selectedFile ? (
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{
                padding: "3px 10px",
                borderRadius: "14px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase"
              }}>
                {selectedFile.name.split('.').pop() || 'FILE'} Loaded
              </span>
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-primary)" }}>
              {selectedFile.name}
            </h3>
            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", margin: 0 }}>
              {(selectedFile.size / 1024).toFixed(1)} KB &bull; In-memory parsed &bull; Click or drop another dataset to switch
            </p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px" }}>
              Drop your dataset here, or <span style={{ color: "var(--accent-blue)", textDecoration: "underline" }}>browse files</span>
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "460px", margin: "0 auto 12px auto" }}>
              Upload any tabular data formatted in standard <strong>RFC 4180 CSV</strong> or <strong>WEKA 3.8+ ARFF</strong> (up to 50MB)
            </p>
            <div style={{ display: "inline-flex", gap: "8px", fontSize: "0.74rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "4px 12px", borderRadius: "12px" }}>
              <span>Allowed: .csv, .arff, .txt, .data</span>
              <span>&bull;</span>
              <span>Fast in-memory validation</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Conversion Flow Banner */}
      {selectedFile && (
        <div className="format-banner fade-in-up" style={{
          marginTop: "16px",
          padding: "16px 20px",
          borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid var(--border-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Conversion Pipeline:
            </span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span className="format-tag format-source" style={{
                padding: "4px 12px",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "0.85rem",
                background: sourceFormat === "csv" ? "rgba(59, 130, 246, 0.2)" : "rgba(168, 85, 247, 0.2)",
                color: sourceFormat === "csv" ? "#60a5fa" : "#c084fc",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                {sourceFormat.toUpperCase()}
              </span>

              <ArrowRight size={18} style={{ color: "var(--accent-indigo)" }} />

              <span className="format-tag format-target" style={{
                padding: "4px 12px",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "0.85rem",
                background: targetFormat === "arff" ? "rgba(168, 85, 247, 0.25)" : "rgba(59, 130, 246, 0.25)",
                color: targetFormat === "arff" ? "#c084fc" : "#60a5fa",
                border: "1px solid rgba(255,255,255,0.15)"
              }}>
                {targetFormat.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label htmlFor="target-format-select" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Convert Target:
            </label>
            <select
              id="target-format-select"
              className="input-field"
              value={targetFormat}
              onChange={(e) => onTargetFormatChange(e.target.value)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                background: "rgba(15, 23, 42, 0.9)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                cursor: "pointer"
              }}
            >
              <option value="arff">WEKA 3.8+ ARFF (.arff)</option>
              <option value="csv">RFC 4180 CSV (.csv)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
