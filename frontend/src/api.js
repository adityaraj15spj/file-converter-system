const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If body is FormData, don't set Content-Type header so browser sets multipart boundary
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorDetail = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (full_name, email, password, role = "Student") =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password, role }),
    }),
  verifyOtp: (email, otp) =>
    apiRequest("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),
  resendOtp: (email) =>
    apiRequest("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  getMe: () => apiRequest("/auth/me"),
  updateProfile: (full_name) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ full_name }),
    }),
  changePassword: (current_password, new_password) =>
    apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),
  deleteAccount: () =>
    apiRequest("/auth/delete-account", {
      method: "DELETE",
    }),
  forgotPasswordSim: (email) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Conversion
  detectFormat: (formData) =>
    apiRequest("/convert/detect-format", {
      method: "POST",
      body: formData,
    }),
  inspectSchema: (formData) =>
    apiRequest("/convert/inspect-schema", {
      method: "POST",
      body: formData,
    }),
  executeConversion: (formData) =>
    apiRequest("/convert/execute", {
      method: "POST",
      body: formData,
    }),
  getDownloadUrl: (historyId) => `${API_BASE}/convert/download/${historyId}`,

  // History
  getHistory: () => apiRequest("/history"),
  deleteHistory: (id) =>
    apiRequest(`/history/${id}`, {
      method: "DELETE",
    }),
  clearHistory: () =>
    apiRequest("/history", {
      method: "DELETE",
    }),

  // Admin
  getAdminStats: () => apiRequest("/admin/stats"),
  getAdminUsers: () => apiRequest("/admin/users"),
  toggleUserStatus: (userId) =>
    apiRequest(`/admin/users/${userId}/toggle-status`, {
      method: "POST",
    }),
  updateConfig: (config) =>
    apiRequest("/admin/config", {
      method: "POST",
      body: JSON.stringify(config),
    }),

  // Samples
  getSamples: () => apiRequest("/samples"),
  getSampleContent: (id) => apiRequest(`/samples/${id}`),
};
