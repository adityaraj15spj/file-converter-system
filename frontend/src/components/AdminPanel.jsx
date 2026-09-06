import React, { useState, useEffect } from "react";
import { ShieldAlert, Users, Settings2, Activity, CheckCircle, Ban, RefreshCw, Save } from "lucide-react";
import { api } from "../api";

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configForm, setConfigForm] = useState({
    max_upload_size_mb: 50,
    nominal_threshold: 20
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
      if (statsData?.config) {
        setConfigForm(statsData.config);
      }
    } catch (err) {
      setError(err.message || "Failed to load administrative data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to toggle user status.");
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMsg("");
    try {
      await api.updateConfig(configForm);
      setConfigMsg("Configuration updated successfully.");
      setTimeout(() => setConfigMsg(""), 3000);
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to update configuration.");
    } finally {
      setConfigSaving(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading administrative dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert size={24} color="var(--accent-indigo)" />
          <div>
            <h2 style={{ fontSize: "1.3rem" }}>System Administration (FR-018)</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Manage accounts, configure system thresholds, and review conversion metrics
            </p>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchData}>
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 18px", borderRadius: "10px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fda4af", marginBottom: "20px", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Aggregate Statistics (FR-018) */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">TOTAL CONVERSIONS</div>
          <div className="value" style={{ color: "#60a5fa" }}>{stats?.conversions?.total || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {stats?.conversions?.csv_to_arff || 0} CSV&rarr;ARFF &bull; {stats?.conversions?.arff_to_csv || 0} ARFF&rarr;CSV
          </div>
        </div>

        <div className="stat-card">
          <div className="label">CONVERSION SUCCESS RATE</div>
          <div className="value" style={{ color: "#34d399" }}>{stats?.conversions?.success_rate || 100}%</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {stats?.conversions?.successful || 0} Successful &bull; {stats?.conversions?.failed || 0} Failed
          </div>
        </div>

        <div className="stat-card">
          <div className="label">REGISTERED USERS</div>
          <div className="value" style={{ color: "#c084fc" }}>{stats?.users?.total || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {stats?.users?.active || 0} Active &bull; {stats?.users?.suspended || 0} Suspended
          </div>
        </div>
      </div>

      {/* System Limits Configuration (FR-018) */}
      <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Settings2 size={18} color="var(--accent-blue)" />
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>System Limits &amp; Thresholds Configuration</h4>
        </div>

        <form onSubmit={handleSaveConfig} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              Max Upload Size (MB) (NF-002)
            </label>
            <input
              type="number"
              min="1"
              max="500"
              className="input-field"
              value={configForm.max_upload_size_mb}
              onChange={(e) => setConfigForm({ ...configForm, max_upload_size_mb: parseInt(e.target.value) || 50 })}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              Nominal Inferrer Threshold (Distinct Values) (FR-009)
            </label>
            <input
              type="number"
              min="2"
              max="100"
              className="input-field"
              value={configForm.nominal_threshold}
              onChange={(e) => setConfigForm({ ...configForm, nominal_threshold: parseInt(e.target.value) || 20 })}
            />
          </div>

          <div>
            <button id="btn-save-admin-config" type="submit" className="btn btn-primary" disabled={configSaving}>
              <Save size={15} />
              <span>{configSaving ? "Saving..." : "Save Configuration"}</span>
            </button>
            {configMsg && (
              <span style={{ marginLeft: "12px", fontSize: "0.8rem", color: "#34d399", fontWeight: 600 }}>
                {configMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* User Accounts Management Table (FR-018) */}
      <div className="glass-panel" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Users size={18} color="var(--accent-purple)" />
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Registered User Accounts</h4>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Conversions</th>
                <th>Account Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                  <td>
                    <span className="badge" style={{ background: u.is_admin ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)", color: u.is_admin ? "#a5b4fc" : "var(--text-secondary)" }}>
                      {u.role || (u.is_admin ? "Admin" : "Student")}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{u.conversions_count}</td>
                  <td>
                    {u.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-failed">Suspended</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {!u.is_admin && (
                      <button
                        className={`btn ${u.is_active ? "btn-danger" : "btn-success"} btn-sm`}
                        onClick={() => handleToggleStatus(u.id)}
                        style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                      >
                        {u.is_active ? "Suspend" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
