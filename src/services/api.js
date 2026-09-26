import axios from 'axios';

// ─────────────────────────────────────────────────────────────────
// MilliBox API service — points to Member 2's FastAPI backend.
// Set VITE_API_BASE_URL in .env to override (default: localhost:8000)
// ─────────────────────────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://military-box-backend.onrender.com';
export const WS_URL   = import.meta.env.VITE_WS_URL || BASE_URL.replace(/^http/, 'ws');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fpxpyvfeionyxfptigmy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweHB5dmZlaW9ueXhmcHRpZ215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTI0MTksImV4cCI6MjEwMjg4ODQxOX0.DgK6kzbTFdpYGv9MsxneGDsco1THxgFdF4KVTIZQ4a8';

export const fetchSupabaseDirect = async (table, select = '*', orderField = 'created_at') => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&order=${orderField}.desc&limit=50`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[Supabase Direct] Failed fetching ${table}:`, err);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────
// Container endpoints
// ─────────────────────────────────────────────────────────────────
export const containerAPI = {
  /** GET /devices/ — returns { devices: [...] } with Supabase fallback */
  getAll: async () => {
    try {
      const res = await api.get('/devices/');
      if (res.data && (res.data.devices || res.data.containers || Array.isArray(res.data))) {
        return res;
      }
    } catch (err) {
      console.warn('[API] /devices/ failed — attempting direct Supabase query...');
    }
    const devices = await fetchSupabaseDirect('devices', '*', 'created_at');
    return { data: { devices: devices || [] } };
  },

  /** GET /devices/{id} — returns a device */
  getById: (id) => api.get(`/devices/${id}`),

  /** GET /telemetry/{id}?limit=50 */
  getTelemetry: (id, hours = 24) =>
    api.get(`/telemetry/${id}`, { params: { limit: hours } }),
};

export const telemetryAPI = {
  /** GET /telemetry/ — get all recent sensor telemetry with Supabase fallback */
  getAll: async (limit = 50) => {
    try {
      const res = await api.get('/telemetry/', { params: { limit } });
      if (res.data && (res.data.telemetry || Array.isArray(res.data))) return res;
    } catch (err) {
      console.warn('[API] /telemetry/ failed — attempting direct Supabase query...');
    }
    const telemetry = await fetchSupabaseDirect('sensor_telemetry', '*', 'timestamp');
    return { data: { telemetry: telemetry || [] } };
  },

  /** GET /telemetry/{id} */
  getByDevice: (deviceId, limit = 50) => api.get(`/telemetry/${deviceId}`, { params: { limit } }),

  /** GET /telemetry/{id}/latest */
  getLatest: (deviceId) => api.get(`/telemetry/${deviceId}/latest`),

  /** POST /api/telemetry — send telemetry payload */
  postTelemetry: (payload) => api.post('/api/telemetry', payload),
};

export const postTelemetry = (payload) => api.post('/api/telemetry', payload);


// ─────────────────────────────────────────────────────────────────
// Alert endpoints
// ─────────────────────────────────────────────────────────────────
export const alertAPI = {
  /** GET /alerts/ with Supabase fallback */
  getAll: async () => {
    try {
      const res = await api.get('/alerts/');
      if (res.data && (res.data.alerts || Array.isArray(res.data))) return res;
    } catch (err) {
      console.warn('[API] /alerts/ failed — attempting direct Supabase query...');
    }
    const alerts = await fetchSupabaseDirect('alerts', '*', 'created_at');
    return { data: { alerts: alerts || [] } };
  },

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
    api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password: password.trim(),
    }),
};

export default api;
