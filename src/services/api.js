import axios from 'axios';

// ─────────────────────────────────────────────────────────────────
// MilliBox API service — points to Member 2's FastAPI backend.
// Set VITE_API_BASE_URL in .env to override (default: localhost:8000)
// ─────────────────────────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://military-box-backend.onrender.com';
export const WS_URL   = import.meta.env.VITE_WS_URL || BASE_URL.replace(/^http/, 'ws');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach auth token if available ──────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('millibox_token') || localStorage.getItem('millibox_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: uniform error handling ─────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      sessionStorage.removeItem('millibox_token');
      sessionStorage.removeItem('millibox_user');
      localStorage.removeItem('millibox_token');
      localStorage.removeItem('millibox_user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────────────────────────
// Container endpoints
// ─────────────────────────────────────────────────────────────────
export const containerAPI = {
  /** GET /devices/ — returns { devices: [...] } */
  getAll: () => api.get('/devices/'),

  /** GET /devices/{id} — returns a device */
  getById: (id) => api.get(`/devices/${id}`),

  /** GET /telemetry/{id}?limit=50 */
  getTelemetry: (id, hours = 24) =>
    api.get(`/telemetry/${id}`, { params: { limit: hours } }),
};

// ─────────────────────────────────────────────────────────────────
// Telemetry endpoints
// ─────────────────────────────────────────────────────────────────
export const telemetryAPI = {
  /** POST /api/telemetry — send telemetry payload from HITL simulator */
  postTelemetry: (payload) => api.post('/api/telemetry', payload),
};

export const postTelemetry = (payload) => api.post('/api/telemetry', payload);


// ─────────────────────────────────────────────────────────────────
// Alert endpoints
// ─────────────────────────────────────────────────────────────────
export const alertAPI = {
  /** GET /alerts/ */
  getAll: () => api.get('/alerts/'),

  /** The deployed backend has no acknowledge endpoint. */
  acknowledge: async () => undefined,

  /** PATCH /alerts/{id}/resolve */
  resolve: (id) => api.patch(`/alerts/${id}/resolve`),
};

// ─────────────────────────────────────────────────────────────────
// Blockchain / Audit
// ─────────────────────────────────────────────────────────────────
export const blockchainAPI = {
  /** GET /blockchain/status */
  getLogs: () => api.get('/blockchain/status'),
};

// ─────────────────────────────────────────────────────────────────
// Shock + Tamper history
// ─────────────────────────────────────────────────────────────────
export const historyAPI = {
  /** GET /api/shock-events */
  getShock: () => api.get('/api/shock-events'),

  /** GET /api/tamper-events */
  getTamper: () => api.get('/api/tamper-events'),
};

// ─────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────
export const authAPI = {
  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Returns: { access_token, token_type, officer: {...} }
   */
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

export default api;
