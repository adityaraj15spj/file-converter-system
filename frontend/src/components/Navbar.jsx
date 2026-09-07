import React from "react";
import { ArrowLeftRight, FileCode2, History, Database, ShieldCheck, User, LogOut, LogIn, Activity } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenAuthModal, onLogout }) {
  return (
    <header className="navbar">
      <div className="brand" role="button" onClick={() => setActiveTab("converter")} style={{ cursor: "pointer" }}>
        <div className="brand-logo" style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(99, 102, 241, 0.45)",
          color: "white"
        }}>
          <ArrowLeftRight size={22} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em", margin: 0 }}>
              NITK File Converter
            </h1>
            <span style={{
              fontSize: "0.68rem",
              padding: "1px 6px",
              borderRadius: "6px",
              background: "rgba(99, 102, 241, 0.2)",
              color: "#a5b4fc",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              fontWeight: 700
            }}>
              v1.0
            </span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0 }}>
            CSV &harr; WEKA 3.8+ ARFF Engine
          </p>
        </div>
      </div>

      <nav className="nav-links">
        <button
          id="nav-tab-converter"
          className={`nav-tab ${activeTab === "converter" ? "active" : ""}`}
          onClick={() => setActiveTab("converter")}
        >
          <FileCode2 size={16} />
          <span>Converter Studio</span>
        </button>

        <button
          id="nav-tab-history"
          className={`nav-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={16} />
          <span>Audit History</span>
        </button>

        <button
          id="nav-tab-samples"
          className={`nav-tab ${activeTab === "samples" ? "active" : ""}`}
          onClick={() => setActiveTab("samples")}
        >
          <Database size={16} />
          <span>Benchmarks</span>
        </button>

        {currentUser?.is_admin && (
          <button
            id="nav-tab-admin"
            className={`nav-tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <ShieldCheck size={16} />
            <span>Admin Panel</span>
          </button>
        )}
      </nav>

      <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Live Status Pill */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "14px",
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          fontSize: "0.74rem",
          color: "#34d399",
          fontWeight: 600
        }}>
          <span style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 8px #10b981",
            animation: "pulse 2s infinite"
          }} />
          <span>Online</span>
        </div>

        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="user-badge" onClick={onOpenAuthModal} title="View Account Profile">
              <div className="user-avatar" style={{
                background: currentUser.is_admin ? "var(--gradient-brand)" : "rgba(59, 130, 246, 0.3)",
                color: "#fff",
                fontWeight: 700
              }}>
                {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="user-name">{currentUser.full_name}</div>
                <div className="user-role">{currentUser.is_admin ? "Administrator" : currentUser.role || "Student"}</div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Sign Out">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button id="btn-open-signin" className="btn btn-primary btn-sm" onClick={onOpenAuthModal} style={{ fontWeight: 700 }}>
            <LogIn size={15} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
