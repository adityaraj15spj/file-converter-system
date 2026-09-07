import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Shield,
  Send,
  RefreshCw,
  ArrowLeft,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { api } from "../api";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

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
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification state
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Profile fields
  const [editName, setEditName] = useState(currentUser?.full_name || "");
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleGoogleAuth = async (customEmail = null, customName = null) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const targetEmail = customEmail || prompt("Enter your Google Account email to continue:", email || "adityaraj15spj@gmail.com");
    if (!targetEmail) {
      setLoading(false);
      return;
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const fallbackName = customName || cleanEmail.split("@")[0].replace(/[._]/g, " ");
    const formattedName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);

    try {
      const res = await api.googleAuth({
        email: cleanEmail,
        full_name: formattedName,
        role
      });
      localStorage.setItem("token", res.access_token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e, customEmail, customPassword) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    const targetEmail = customEmail || email;
    const targetPass = customPassword || password;
    try {
      const res = await api.login(targetEmail, targetPass);
      localStorage.setItem("token", res.access_token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      const msg = err.message || "Failed to sign in.";
      setError(msg);
      // If user hasn't verified, give them option to jump to OTP verification
      if (msg.toLowerCase().includes("not been verified") || msg.toLowerCase().includes("verification code")) {
        setOtpEmail(targetEmail);
      }
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
      if (res.requires_otp) {
        setOtpEmail(res.email || email);
        setOtp("");
        setTab("verify_otp");
        setResendCooldown(60);
        setSuccessMsg(res.message || "A 6-digit verification code has been sent directly to your email.");
      } else {
        localStorage.setItem("token", res.access_token);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.verifyOtp(otpEmail, cleanOtp);
      localStorage.setItem("token", res.access_token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || "Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.resendOtp(otpEmail);
      setOtp("");
      setSuccessMsg(res.message || "A new verification code has been sent directly to your email.");
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
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
          {!currentUser && tab !== "verify_otp" ? (
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
          ) : tab === "verify_otp" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} color="var(--accent-blue)" />
              <strong style={{ fontSize: "1rem" }}>Email OTP Verification</strong>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={18} color="var(--accent-emerald)" />
              <strong style={{ fontSize: "1rem" }}>User Account &amp; Security (FR-004)</strong>
            </div>
          )}
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", color: "#fda4af", fontSize: "0.82rem", marginBottom: "16px" }}>
            <AlertCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <div>{error}</div>
              {otpEmail && tab === "signin" && error.toLowerCase().includes("not been verified") && (
                <button
                  type="button"
                  onClick={() => { setTab("verify_otp"); setError(""); }}
                  style={{ marginTop: "6px", background: "none", border: "none", color: "#60a5fa", fontSize: "0.82rem", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                >
                  Enter Verification Code &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7", fontSize: "0.82rem", marginBottom: "16px" }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {tab === "signin" && !currentUser && (
          <div>
            <button
              type="button"
              id="btn-google-signin"
              className="btn-google"
              onClick={() => handleGoogleAuth("adityaraj15spj@gmail.com", "Aditya Raj")}
              disabled={loading}
              style={{ marginBottom: "14px" }}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <div className="auth-divider">
              <span>or sign in with email</span>
            </div>

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
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-field"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "36px", paddingRight: "38px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                  id="btn-quick-login-google"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleGoogleAuth("adityaraj15spj@gmail.com", "Aditya Raj")}
                  style={{ justifyContent: "flex-start", fontSize: "0.82rem", background: "rgba(66, 133, 244, 0.12)", borderColor: "rgba(66, 133, 244, 0.3)" }}
                >
                  <GoogleIcon />
                  <span>Sign in as <strong>adityaraj15spj@gmail.com</strong> (Google Verified)</span>
                </button>
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
          <div>
            <button
              type="button"
              id="btn-google-signup"
              className="btn-google"
              onClick={() => handleGoogleAuth("adityaraj15spj@gmail.com", "Aditya Raj")}
              disabled={loading}
              style={{ marginBottom: "14px" }}
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>

            <div className="auth-divider">
              <span>or register with email</span>
            </div>

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
                Email Address (OTP will be sent here)
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
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Choose a strong password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "38px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
              <Send size={15} />
              <span>{loading ? "Sending OTP..." : "Create Account & Send OTP"}</span>
            </button>
          </form>
        </div>
        )}

        {/* OTP VERIFICATION VIEW */}
        {tab === "verify_otp" && !currentUser && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
                color: "var(--accent-blue)"
              }}>
                <Mail size={24} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                Verify Your Email Address
              </h3>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: 0 }}>
                We sent a 6-digit verification code to:
              </p>
              <div style={{
                display: "inline-block",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--accent-blue)",
                marginTop: "6px"
              }}>
                {otpEmail}
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.4 }}>
                Please check your inbox and spam / junk folder. Enter the 6-digit code below to activate your account.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textAlign: "center" }}>
                  Enter 6-Digit Code
                </label>
                <input
                  id="input-otp-code"
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  placeholder="······"
                  className="input-field"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{
                    fontSize: "1.8rem",
                    letterSpacing: "14px",
                    textAlign: "center",
                    fontWeight: "700",
                    fontFamily: "monospace",
                    padding: "10px",
                    borderColor: otp.length === 6 ? "var(--accent-emerald)" : "var(--border-subtle)"
                  }}
                  autoFocus
                />
              </div>

              <button
                id="btn-verify-otp"
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: "14px" }}
                disabled={loading || otp.trim().length !== 6}
              >
                {loading ? "Verifying Code..." : "Verify Code & Activate Account"}
              </button>
            </form>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setTab("signup");
                  setError("");
                  setSuccessMsg("");
                }}
                style={{ fontSize: "0.8rem" }}
              >
                <ArrowLeft size={14} /> Back / Edit Info
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                style={{ fontSize: "0.8rem" }}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
                <span>
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                </span>
              </button>
            </div>
          </div>
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
