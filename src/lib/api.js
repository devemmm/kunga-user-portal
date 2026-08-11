/**
 * Kunga Basics User API Client
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

let _token        = localStorage.getItem('kb_token') ?? null;
let _refreshToken = localStorage.getItem('kb_refresh') ?? null;
let _refreshing   = null;

export function setToken(token, refreshToken) {
  _token = token;
  if (token) localStorage.setItem('kb_token', token);
  else localStorage.removeItem('kb_token');
  if (refreshToken !== undefined) {
    _refreshToken = refreshToken;
    if (refreshToken) localStorage.setItem('kb_refresh', refreshToken);
    else localStorage.removeItem('kb_refresh');
  }
}

export function getToken() { return _token; }
export function isLoggedIn() { return !!_token; }

export function logout() {
  setToken(null, null);
  window.location.href = '/login';
}

async function silentRefresh() {
  if (!_refreshToken) return false;
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Platform': 'web' },
        body: JSON.stringify({ refreshToken: _refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) { setToken(data.accessToken, data.refreshToken ?? _refreshToken); return true; }
      return false;
    } catch { return false; }
    finally { _refreshing = null; }
  })();
  return _refreshing;
}

async function request(path, opts = {}) {
  const doFetch = (token) => fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Platform': 'web',
      ...opts.headers,
    },
  });

  let res = await doFetch(_token);
  if (res.status === 401 && _refreshToken) {
    const ok = await silentRefresh();
    if (ok) res = await doFetch(_token);
    else { logout(); return; }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? 'Request failed'), { status: res.status, data: err });
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:           (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, platform: 'web' }) }),
  register:        (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, platform: 'web' }) }),
  googleAuth:      (idToken) => request('/auth/google', { method: 'POST', body: JSON.stringify({ idToken, platform: 'web' }) }),
  forgotPassword:  (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword:   (token, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  me:              () => request('/auth/me'),
  updateProfile:   (data) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword:  (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  updatePhoto:     (formData) => request('/auth/me/photo', { method: 'POST', body: formData, headers: {} }),
  removePhoto:     () => request('/auth/me/photo', { method: 'DELETE' }),
  // MFA login flow
  mfaVerify:  (mfaToken, otp) => request('/auth/mfa/verify',  { method: 'POST', body: JSON.stringify({ mfaToken, otp }) }),
  mfaResend:  (mfaToken)      => request('/auth/mfa/resend',  { method: 'POST', body: JSON.stringify({ mfaToken }) }),
  // MFA setup (enable)
  mfaSetupSend:   ()          => request('/auth/mfa/setup/send',   { method: 'POST', body: '{}' }),
  mfaSetupVerify: (otp)       => request('/auth/mfa/setup/verify', { method: 'POST', body: JSON.stringify({ otp }) }),
  // MFA disable
  mfaDisableSend:   ()        => request('/auth/mfa/disable/send',   { method: 'POST', body: '{}' }),
  mfaDisableVerify: (otp)     => request('/auth/mfa/disable/verify', { method: 'POST', body: JSON.stringify({ otp }) }),
};

// ── Preferences ───────────────────────────────────────────────────────────────
export const preferencesApi = {
  get:    ()     => request('/preferences'),
  update: (data) => request('/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Modules ───────────────────────────────────────────────────────────────────
export const modulesApi = {
  getGroups: () => request('/modules/groups'),
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/modules${q ? '?' + q : ''}`);
  },
  getById: (id) => request(`/modules/${id}`),
  listResources: (id) => request(`/modules/${id}/resources`),
  submitFeedback: (moduleId, data) => request(`/modules/${moduleId}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Videos ────────────────────────────────────────────────────────────────────
export const videosApi = {
  getStreamUrl: (id) => request(`/videos/${id}/stream`),
  bookmark: (id) => request(`/videos/${id}/bookmark`, { method: 'POST', body: '{}' }),
  getNotes: (id) => request(`/videos/${id}/notes`),
  addNote: (id, data) => request(`/videos/${id}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (noteId, data) => request(`/videos/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNote: (noteId) => request(`/videos/notes/${noteId}`, { method: 'DELETE' }),
};

// ── Progress ──────────────────────────────────────────────────────────────────
export const progressApi = {
  get: () => request('/progress'),
  update: (data) => request('/progress', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Assessments ───────────────────────────────────────────────────────────────
export const assessmentsApi = {
  list: () => request('/assessments'),
  getById: (id) => request(`/assessments/${id}`),
  submit: (id, data) => request(`/assessments/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  history: () => request('/assessments/history'),
};

// ── Ask Dr. Gad ───────────────────────────────────────────────────────────────
export const askGadApi = {
  list: () => request('/ask-gad'),
  submit: (data) => request('/ask-gad', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getStatus: () => request('/subscriptions/status'),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  myHistory: () => request('/payments/my-history'),
};

// ── Manual Payments ───────────────────────────────────────────────────────────
export const manualPaymentsApi = {
  plans:   ()      => request('/manual-payments/plans'),
  my:      ()      => request('/manual-payments/my'),
  // submit uses raw fetch (multipart) — handled directly in ManualPayment.jsx
};

// ── Routine ───────────────────────────────────────────────────────────────────
export const routineApi = {
  getDate:    (date)                      => request(`/routine/${date}`),
  toggle:     (date, category, taskKey, completed) =>
    request(`/routine/${date}/${category}/${taskKey}`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
  streak:     ()                          => request('/routine/streak/current'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request('/users/me/notifications'),
};

// ── Announcements ─────────────────────────────────────────────────────────────
export const announcementsApi = {
  getActive:   ()    => request('/announcements'),
  getBanner:   ()    => request('/announcements/active-banner'),
  dismiss:     (id)  => request(`/announcements/${id}/dismiss`, { method: 'POST', body: '{}' }),
};
