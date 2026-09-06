import React, { useState } from "react";
import { X, Lock, Mail, User, KeyRound, AlertCircle, CheckCircle2, UserCheck, Shield } from "lucide-react";
import { api } from "../api";

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) {
  if (!isOpen) return null;

  const [tab, setTab] = useState(currentUser ? "profile" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Student");

  // Profile fields
  const [editName, setEditName] = useState(currentUser?.full_name || "");
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignIn = async (e, customEmail, customPassword) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.login(customEmail || email, customPassword || password);
      localStorage.setItem("token", res.access_token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.register(fullName, email, password, role);
      localStorage.setItem("token", res.access_token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.updateProfile(editName);
      onLoginSuccess(res.user);
      setSuccessMsg("Profile name updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.changePassword(currPassword, newPassword);
      setSuccessMsg("Password changed successfully.");
      setCurrPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? All saved conversion history will be permanently erased.")) {
      return;
    }
    try {
      await api.deleteAccount();
      onLogout();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleForgotSim = async () => {
    if (!email) {
      setError("Please enter your email address to request a reset link.");
      return;
    }
    try {
      const res = await api.forgotPasswordSim(email);
      setSuccessMsg(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        {/* Tab selector */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
          {!currentUser ? (
            <>
              <button
                className={`btn btn-sm ${tab === "signin" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => { setTab("signin"); setError(""); setSuccessMsg(""); }}
              >
                Sign In
              </button>
              <button
                className={`btn btn-sm ${tab === "signup" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => { setTab("signup"); setError(""); setSuccessMsg(""); }}
              >
                Register (FR-001)
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={18} color="var(--accent-emerald)" />
              <strong style={{ fontSize: "1rem" }}>User Account &amp; Security (FR-004)</strong>
            </div>
          )}
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", color: "#fda4af", fontSize: "0.82rem", marginBottom: "16px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7", fontSize: "0.82rem", marginBottom: "16px" }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {tab === "signin" && !currentUser && (
          <div>
            <form onSubmit={(e) => handleSignIn(e)}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="user@nitk.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Password</label>
                  <button
                    type="button"
                    onClick={handleForgotSim}
                    style={{ background: "none", border: "none", color: "var(--accent-blue)", fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="password"
                    required
                    className="input-field"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                  />
                </div>
              </div>

              <button id="btn-submit-signin" type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "16px" }} disabled={loading}>
                {loading ? "Authenticating..." : "Sign In to Workspace"}
              </button>
            </form>

            {/* 1-Click Fast Switcher for Grading / Demo */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px", marginTop: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Demo One-Click Logins:
              </span>
              <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                <button
                  id="btn-quick-login-student"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSignIn(null, "aditya@nitk.ac.in", "Aditya@123")}
                  style={{ justifyContent: "flex-start", fontSize: "0.82rem" }}
                >
                  <User size={14} color="#60a5fa" />
                  <span>Log in as <strong>Aditya Raj</strong> (Student / User)</span>
                </button>
                <button
                  id="btn-quick-login-admin"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSignIn(null, "admin@nitk.ac.in", "Admin@123")}
                  style={{ justifyContent: "flex-start", fontSize: "0.82rem" }}
                >
                  <Shield size={14} color="#c084fc" />
                  <span>Log in as <strong>NITK Administrator</strong> (Admin)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIGN UP FORM */}
        {tab === "signup" && !currentUser && (
          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Deepanshu Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="student@nitk.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Role
              </label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Student">Student (Data Mining Coursework)</option>
                <option value="Researcher">Researcher / Data Analyst</option>
              </select>
            </div>

            <button id="btn-submit-signup" type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Creating Account..." : "Create Account & Sign In"}
            </button>
          </form>
        )}

        {/* PROFILE VIEW (LOGGED IN) */}
        {currentUser && (
          <div>
            <div style={{ background: "rgba(0,0,0,0.25)", padding: "14px", borderRadius: "10px", marginBottom: "18px" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>AUTHENTICATED SESSION</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{currentUser.full_name}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{currentUser.email} &bull; {currentUser.role}</div>
            </div>

            {/* Change Name */}
            <form onSubmit={handleUpdateProfile} style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Update Display Name
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-secondary btn-sm" disabled={loading}>
                  Save
                </button>
              </div>
            </form>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px", marginBottom: "18px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                Change Password (FR-004)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="password"
                  placeholder="Current password"
                  className="input-field"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={loading}>
                Update Password
              </button>
            </form>

            {/* Account Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
              <button className="btn btn-secondary btn-sm" onClick={onLogout}>
                Sign Out
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>
                Delete Account (FR-004)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
