import React, { useState, useEffect } from "react";
import { Database, Play, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { api } from "../api";

export default function BenchmarkView({ onLoadSampleAndSwitch }) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSamples()
      .then(data => {
        setSamples(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Database size={24} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: "1.3rem" }}>Standard Benchmark Datasets &amp; Test Cases</h2>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Pre-bundled machine learning benchmarks to test conversion fidelity, nominal enumeration, and error reporting
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {samples.map((s) => (
          <div key={s.id} className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span className={`badge ${s.source_format === "csv" ? "badge-numeric" : "badge-nominal"}`}>
                  Source: {s.source_format.toUpperCase()}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {s.filename}
                </span>
              </div>

              <h3 style={{ fontSize: "1.05rem", marginBottom: "8px" }}>{s.filename}</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "18px" }}>
                {s.description}
              </p>
            </div>

            <button
              id={`btn-load-bench-${s.id.replace(".", "-")}`}
              className="btn btn-primary"
              onClick={() => onLoadSampleAndSwitch(s.id)}
              style={{ width: "100%" }}
            >
              <Play size={15} />
              <span>Load into Converter Studio</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
