import {
  createContext, useContext, useReducer, useEffect,
  useRef, useCallback,
} from 'react';
import { containerAPI, alertAPI, telemetryAPI } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';

const AppContext = createContext(null);

// ── Reducer ───────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CONTAINERS':
      return { ...state, containers: action.payload, containersLoaded: true };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload, alertsLoaded: true };
    case 'ADD_ALERT':
      // Avoid duplicate IDs
      if (state.alerts.some((a) => a.id === action.payload.id)) return state;
      return { ...state, alerts: [action.payload, ...state.alerts] };
    case 'ACK_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.id ? { ...a, status: 'ACKNOWLEDGED' } : a
        ),
      };
    case 'RESOLVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.id ? { ...a, status: 'RESOLVED' } : a
        ),
      };
    case 'UPDATE_CONTAINER':
      return {
        ...state,
        containers: state.containers.map((c) =>
          c.id === action.id ? { ...c, ...action.payload } : c
        ),
      };
    case 'SET_BACKEND_STATUS':
      return { ...state, backendOnline: action.payload };
    default:
      return state;
  }
}

const initialState = {
  containers:      [],
  alerts:          [],
  containersLoaded: false,
  alertsLoaded:    false,
  backendOnline:   true,
};

// ── Helpers ───────────────────────────────────
// Normalise a container object from FastAPI → internal shape
function normalizeContainer(raw) {
  const id = raw.device_id ?? raw.id ?? raw.container_id ?? 'BOX-001';
  const rawStatus = (raw.status ?? 'SECURED').toUpperCase();
  const status = (rawStatus === 'ACTIVE' || rawStatus === 'ONLINE') ? 'SECURED' : rawStatus;
  const locName = raw.location_label ?? raw.location_name ?? raw.location?.name ?? 'Tactical Base';
  const lat = raw.latitude ?? raw.location?.lat ?? (id.includes('02') ? 19.0760 : 28.6139);
  const lng = raw.longitude ?? raw.location?.lng ?? (id.includes('02') ? 72.8777 : 77.2090);

  return {
    id: id,
    name: raw.name ?? id,
    status: status,
    lock: raw.lock_status ?? raw.lock ?? 'SECURED',
    temp: raw.temperature ?? raw.temp ?? 24.2,
    humidity: raw.humidity ?? 55,
    battery: raw.battery ?? 92,
    speed: raw.speed ?? 0,
    location: {
      name: locName,
      lat: lat,
      lng: lng,
    },
    route: raw.route ?? [],
    lastEvent: raw.last_event ?? raw.lastEvent ?? 'Normal monitoring',
    updatedAgo: raw.updated_ago ?? raw.updatedAgo ?? (raw.last_seen ? new Date(raw.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'),
  };
}

// Normalise an alert object from FastAPI → internal shape
function normalizeAlert(raw) {
  const isResolved = raw.resolved === true || raw.status === 'RESOLVED';
  const status = isResolved ? 'RESOLVED' : (raw.status ? String(raw.status).toUpperCase() : 'UNREAD');
  const timestamp = raw.created_at
    ? new Date(raw.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : (raw.timestamp ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  return {
    id: raw.id ?? raw.alert_id ?? `ALT-${Date.now()}`,
    container: raw.device_id ?? raw.container ?? raw.container_id ?? 'ESP32_MILITARY_BOX_01',
    event: raw.message ?? raw.event ?? raw.alert_type ?? 'Alert detected',
    severity: (raw.severity ?? raw.level ?? 'INFO').toUpperCase(),
    timestamp: timestamp,
    location: raw.location ?? (String(raw.device_id).includes('02') ? 'Bravo Base' : 'Alpha Base'),
    status: status,
  };
}

// ── Provider ──────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const simCounter = useRef(200);

  // ── Fetch containers & live telemetry from FastAPI / Supabase ────
  const fetchContainers = useCallback(async () => {
    try {
      // 1. Fetch devices list
      let deviceList = [];
      try {
        const { data: devRes } = await containerAPI.getAll();
        deviceList = Array.isArray(devRes)
          ? devRes
          : (devRes.containers ?? devRes.devices) ?? [];
      } catch (_) {}

      // 2. Fetch live sensor telemetry records
      let telemetryList = [];
      try {
        const { data: telRes } = await telemetryAPI.getAll(50);
        telemetryList = Array.isArray(telRes) ? telRes : (telRes.telemetry ?? telRes.data) ?? [];
      } catch (_) {}

      // Map telemetry by device_id to get latest real readings
      const latestTelemetryByDevice = {};
      for (const t of telemetryList) {
        const devId = t.device_id ?? 'ESP32_MILITARY_BOX_01';
        if (!latestTelemetryByDevice[devId]) {
          latestTelemetryByDevice[devId] = t;
        }
      }

      // Build real containers list from database
      const realContainers = [];
      const processedIds = new Set();

      for (const d of deviceList) {
        const devId = d.device_id ?? d.id;
        const latestTel = latestTelemetryByDevice[devId] || {};
        const combined = { ...d, ...latestTel, device_id: devId };
        realContainers.push(normalizeContainer(combined));
        processedIds.add(devId);
      }

      // Also include any telemetry devices not yet in devices table
      for (const [devId, latestTel] of Object.entries(latestTelemetryByDevice)) {
        if (!processedIds.has(devId)) {
          realContainers.push(normalizeContainer(latestTel));
          processedIds.add(devId);
        }
      }

      if (realContainers.length > 0) {
        dispatch({ type: 'SET_CONTAINERS', payload: realContainers });
        dispatch({ type: 'SET_BACKEND_STATUS', payload: true });
      } else {
        dispatch({ type: 'SET_BACKEND_STATUS', payload: true });
      }
    } catch (err) {
      console.warn('[API] /containers fetch failed:', err.message);
      dispatch({ type: 'SET_BACKEND_STATUS', payload: false });
    }
  }, []);

  // ── Fetch alerts from FastAPI (with mock fallback) ──────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await alertAPI.getAll();
      const list = Array.isArray(data) ? data : data.alerts ?? [];
      dispatch({ type: 'SET_ALERTS', payload: list.map(normalizeAlert) });
    } catch (err) {
      console.warn('[API] /alerts failed — using mock data:', err.message);
    }
  }, []);

  // ── Acknowledge / Resolve — call API then update local state ────
  const ackAlert = useCallback(async (id) => {
    dispatch({ type: 'ACK_ALERT', id });
    try { await alertAPI.acknowledge(id); } catch (_) {}
  }, []);

  const resolveAlert = useCallback(async (id) => {
    dispatch({ type: 'RESOLVE_ALERT', id });
    try { await alertAPI.resolve(id); } catch (_) {}
  }, []);

  // ── WebSocket handler — called for every pushed alert ──────────
  const handleWsMessage = useCallback((data) => {
    if (!data || data.status === 'connected' || data.message === 'WebSocket connected') return;
    const alert = normalizeAlert(data);
    dispatch({ type: 'ADD_ALERT', payload: alert });
  }, []);

  // WebSocket enabled when backend is online
  useWebSocket('/ws', handleWsMessage, state.backendOnline);

  // ── Refresh containers every 30 seconds ────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('millibox_token') || localStorage.getItem('millibox_token');
    if (!token && window.location.pathname === '/login') return;

    fetchContainers();
    fetchAlerts();
    const interval = setInterval(fetchContainers, 30000);
    return () => clearInterval(interval);
  }, [fetchContainers, fetchAlerts]);

  const unreadCount = state.alerts.filter((a) => a.status === 'UNREAD').length;

  return (
    <AppContext.Provider
      value={{ state, dispatch, unreadCount, ackAlert, resolveAlert }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
