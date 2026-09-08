import {
  createContext, useContext, useReducer, useEffect,
  useRef, useCallback,
} from 'react';
import { containerAPI, alertAPI } from '../services/api';
import {
  containers as mockContainers,
  initialAlerts as mockAlerts,
} from '../services/mockData';
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
  containers:      mockContainers,   // pre-seeded with mock; replaced by API on connect
  alerts:          mockAlerts,
  containersLoaded: false,
  alertsLoaded:    false,
  backendOnline:   false,            // true once first API call succeeds
};

// ── Helpers ───────────────────────────────────
// Normalise a container object from FastAPI → internal shape
function normalizeContainer(raw) {
  return {
    id:         raw.id          ?? raw.container_id,
    status:     raw.status,
    lock:       raw.lock_status ?? raw.lock,
    temp:       raw.temperature ?? raw.temp,
    humidity:   raw.humidity,
    battery:    raw.battery,
    speed:      raw.speed       ?? 0,
    location: {
      name: raw.location_name   ?? raw.location?.name ?? 'Unknown',
      lat:  raw.latitude        ?? raw.location?.lat  ?? 20.0,
      lng:  raw.longitude       ?? raw.location?.lng  ?? 78.0,
    },
    route:      raw.route ?? [],
    lastEvent:  raw.last_event  ?? raw.lastEvent ?? '',
    updatedAgo: raw.updated_ago ?? raw.updatedAgo ?? 'just now',
  };
}

// Normalise an alert object from FastAPI → internal shape
function normalizeAlert(raw) {
  return {
    id:        raw.id          ?? raw.alert_id,
    container: raw.container   ?? raw.container_id,
    event:     raw.event       ?? raw.message,
    severity:  (raw.severity   ?? raw.level ?? 'INFO').toUpperCase(),
    timestamp: raw.timestamp   ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    location:  raw.location    ?? '',
    status:    (raw.status     ?? 'UNREAD').toUpperCase(),
  };
}

// ── Provider ──────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const simCounter = useRef(200);

  // ── Fetch containers from FastAPI (with mock fallback) ──────────
  const fetchContainers = useCallback(async () => {
    try {
      const { data } = await containerAPI.getAll();
      const normalized = Array.isArray(data)
        ? data.map(normalizeContainer)
        : (data.containers ?? data.devices)?.map(normalizeContainer) ?? [];
      dispatch({ type: 'SET_CONTAINERS', payload: normalized });
      dispatch({ type: 'SET_BACKEND_STATUS', payload: true });
    } catch (err) {
      console.warn('[API] /containers failed — using mock data:', err.message);
      // Already seeded with mock; just mark backend offline
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
    const alert = normalizeAlert(data);
    dispatch({ type: 'ADD_ALERT', payload: alert });
  }, []);

  // WebSocket enabled when backend is online; falls back to mock interval
  useWebSocket('/ws', handleWsMessage, state.backendOnline);

  // ── Mock fallback: 12-second interval when backend is OFFLINE ──
  useEffect(() => {
    if (state.backendOnline) return; // real WS takes over

    const EVENTS = [
      { container: 'GOLF-031', event: 'GPS signal degraded',   severity: 'WARNING',  location: 'Pune'   },
      { container: 'JULIET-011',event: 'Temperature rising',   severity: 'WARNING',  location: 'Raipur' },
      { container: 'HOTEL-005', event: 'Route deviation minor', severity: 'WARNING',  location: 'Nagpur' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const e = EVENTS[idx % EVENTS.length];
      simCounter.current += 1;
      const now = new Date();
      dispatch({
        type: 'ADD_ALERT',
        payload: normalizeAlert({
          id:        `SIM-${simCounter.current}`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status:    'UNREAD',
          ...e,
        }),
      });
      idx++;
    }, 12000);
    return () => clearInterval(interval);
  }, [state.backendOnline]);

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
