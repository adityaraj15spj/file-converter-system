import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, FileCode, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

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

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Quick Benchmark Pills */}
      <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
          Quick Benchmark Datasets:
        </span>
        {sampleList && sampleList.map((s) => (
          <button
            key={s.id}
            id={`btn-sample-${s.id.replace(".", "-")}`}
            className="btn btn-secondary btn-sm"
            onClick={() => onLoadSample(s.id)}
            style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: "20px" }}
          >
            {s.source_format === "csv" ? <FileSpreadsheet size={13} color="#60a5fa" /> : <FileCode size={13} color="#c084fc" />}
            <span>{s.filename}</span>
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        id="upload-dropzone"
        className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.arff"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="upload-icon-wrapper">
          {selectedFile ? (
            <CheckCircle2 size={32} color="#10b981" />
          ) : (
            <UploadCloud size={32} />
          )}
        </div>

        {selectedFile ? (
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{selectedFile.name}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click or drop another file to replace
            </p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>
              Drag & Drop your dataset here, or <span style={{ color: "var(--accent-blue)" }}>browse</span>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Supports .csv (RFC 4180) and .arff (WEKA 3.8+) datasets up to 50MB
            </p>
          </div>
        )}
      </div>

      {/* Format Detection Banner (FR-006) */}
      {selectedFile && (
        <div className="format-banner">
          <div className="format-flow">
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Detected Mode:</span>
            <span className="format-tag format-source">{sourceFormat.toUpperCase()}</span>
            <ArrowRight size={18} color="var(--accent-indigo)" />
            <span className="format-tag format-target">{targetFormat.toUpperCase()}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Format:</span>
            <select
              className="input-field"
              value={targetFormat}
              onChange={(e) => onTargetFormatChange(e.target.value)}
              style={{ padding: "6px 12px", width: "auto", fontSize: "0.85rem" }}
            >
              <option value="arff">ARFF (WEKA 3.8+)</option>
              <option value="csv">CSV (RFC 4180)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
