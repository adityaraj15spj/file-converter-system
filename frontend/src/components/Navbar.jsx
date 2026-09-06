import React from "react";
import { ArrowLeftRight, FileCode2, History, Database, ShieldCheck, User, LogOut, LogIn } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenAuthModal, onLogout }) {
  return (
    <header className="navbar">
      <div className="brand" role="button" onClick={() => setActiveTab("converter")} style={{ cursor: "pointer" }}>
        <div className="brand-logo">
          <ArrowLeftRight size={22} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <h1>NITK File Converter</h1>
          <p>CSV &harr; WEKA 3.8+ ARFF Engine</p>
        </div>
      </div>

      <nav className="nav-links">
        <button
          id="nav-tab-converter"
          className={`nav-tab ${activeTab === "converter" ? "active" : ""}`}
          onClick={() => setActiveTab("converter")}
        >
          <FileCode2 size={18} />
          <span>Converter Studio</span>
        </button>

        <button
          id="nav-tab-history"
          className={`nav-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={18} />
          <span>Conversion History</span>
        </button>

        <button
          id="nav-tab-samples"
          className={`nav-tab ${activeTab === "samples" ? "active" : ""}`}
          onClick={() => setActiveTab("samples")}
        >
          <Database size={18} />
          <span>Benchmarks</span>
        </button>

        {currentUser?.is_admin && (
          <button
            id="nav-tab-admin"
            className={`nav-tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <ShieldCheck size={18} />
            <span>Admin Panel</span>
          </button>
        )}
      </nav>

      <div className="nav-actions">
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="user-badge" onClick={onOpenAuthModal} title="View Account Profile">
              <div className="user-avatar">
                {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="user-name">{currentUser.full_name}</div>
                <div className="user-role">{currentUser.is_admin ? "Administrator" : currentUser.role || "Student"}</div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button id="btn-open-signin" className="btn btn-primary btn-sm" onClick={onOpenAuthModal}>
            <LogIn size={16} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
