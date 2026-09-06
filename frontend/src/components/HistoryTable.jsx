import React, { useState } from "react";
import { History, Download, Trash2, ArrowRight, Search, CheckCircle2, AlertCircle } from "lucide-react";

export default function HistoryTable({
  historyItems,
  onDownloadItem,
  onDeleteItem,
  onClearAll,
  isLoading
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = historyItems.filter((item) =>
    item.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.source_format.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.target_format.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <History size={20} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Audit Trail &amp; Conversion History (FR-017)</h3>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            Stored per-user conversion logs listed in reverse chronological order
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search filename or format..."
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "32px", fontSize: "0.82rem", width: "220px", padding: "7px 12px 7px 32px" }}
            />
          </div>

          {historyItems.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={onClearAll} title="Clear All History">
              <Trash2 size={14} color="#fda4af" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading conversion history...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px dashed var(--border-subtle)" }}>
          <History size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
          <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "4px" }}>No conversions found</h4>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {searchTerm ? "No records match your search filter." : "Perform a dataset conversion in the Converter Studio to view records here."}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>File Name</th>
                <th>Flow</th>
                <th>Records / Cols</th>
                <th>Status</th>
                <th>Duration</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "0.85rem" }}>
                      {item.file_name}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600 }}>
                      <span style={{ color: "#60a5fa" }}>{item.source_format}</span>
                      <ArrowRight size={12} color="var(--text-muted)" />
                      <span style={{ color: "#34d399" }}>{item.target_format}</span>
                    </span>
                  </td>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {item.instance_count} rows &bull; {item.attribute_count} cols
                  </td>
                  <td>
                    {item.status === "SUCCESS" ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={11} />
                        SUCCESS
                      </span>
                    ) : (
                      <span className="badge badge-failed">
                        <AlertCircle size={11} />
                        FAILED
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {item.duration_ms} ms
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      {item.status === "SUCCESS" && (
                        <button
                          id={`btn-download-history-${item.id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => onDownloadItem(item.id)}
                          title="Download Converted File"
                          style={{ padding: "4px 8px" }}
                        >
                          <Download size={14} color="#34d399" />
                        </button>
                      )}
                      <button
                        id={`btn-delete-history-${item.id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => onDeleteItem(item.id)}
                        title="Delete Record"
                        style={{ padding: "4px 8px" }}
                      >
                        <Trash2 size={14} color="#fda4af" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
