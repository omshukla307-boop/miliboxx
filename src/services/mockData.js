// ─────────────────────────────────────────────
// Mock data for MilliBox dashboard
// ─────────────────────────────────────────────

export const OFFICER = {
  id: 'OFF-001',
  name: 'Maj. A. Sharma',
  role: 'Logistics Officer',
  unit: '14th Supply Bn',
};

// ── Status helpers ────────────────────────────
export const STATUS = {
  NORMAL: 'NORMAL',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  SECURED: 'SECURED',
  TAMPERED: 'TAMPERED',
  SHOCK: 'SHOCK DETECTED',
  OFFLINE: 'OFFLINE',
};

const LOCATIONS = [
  { name: 'Raipur', lat: 21.2514, lng: 81.6296 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
];

// ── Containers ────────────────────────────────
export const containers = [
  { id: 'ALPHA-001', status: STATUS.SECURED, lock: 'SECURED', temp: 23.4, humidity: 54, battery: 87, speed: 42, location: LOCATIONS[0], route: [LOCATIONS[9], LOCATIONS[0]], lastEvent: 'Container secured', updatedAgo: '12 sec ago' },
  { id: 'ALPHA-023', status: STATUS.CRITICAL, lock: 'SECURED', temp: 31.2, humidity: 58, battery: 72, speed: 0, location: LOCATIONS[2], route: [LOCATIONS[8], LOCATIONS[2]], lastEvent: 'Shock detected', updatedAgo: '2 min ago' },
  { id: 'BRAVO-014', status: STATUS.WARNING, lock: 'SECURED', temp: 26.1, humidity: 71, battery: 65, speed: 38, location: LOCATIONS[3], route: [LOCATIONS[3], LOCATIONS[1]], lastEvent: 'Temp threshold exceeded', updatedAgo: '8 min ago' },
  { id: 'CHARLIE-009', status: STATUS.TAMPERED, lock: 'OPEN', temp: 24.8, humidity: 62, battery: 91, speed: 0, location: LOCATIONS[4], route: [LOCATIONS[4]], lastEvent: 'Unauthorized opening', updatedAgo: '22 min ago' },
  { id: 'DELTA-042', status: STATUS.SECURED, lock: 'SECURED', temp: 22.1, humidity: 49, battery: 94, speed: 56, location: LOCATIONS[5], route: [LOCATIONS[0], LOCATIONS[5]], lastEvent: 'Container secured', updatedAgo: '1 min ago' },
  { id: 'ECHO-018', status: STATUS.WARNING, lock: 'SECURED', temp: 24.9, humidity: 68, battery: 23, speed: 31, location: LOCATIONS[6], route: [LOCATIONS[7], LOCATIONS[6]], lastEvent: 'Battery low warning', updatedAgo: '5 min ago' },
  { id: 'FOXTROT-007', status: STATUS.WARNING, lock: 'SECURED', temp: 25.3, humidity: 72, battery: 55, speed: 0, location: LOCATIONS[7], route: [LOCATIONS[7]], lastEvent: 'Humidity threshold warning', updatedAgo: '15 min ago' },
  { id: 'GOLF-031', status: STATUS.SECURED, lock: 'SECURED', temp: 21.8, humidity: 51, battery: 88, speed: 64, location: LOCATIONS[8], route: [LOCATIONS[9], LOCATIONS[8]], lastEvent: 'GPS updated', updatedAgo: '30 sec ago' },
  { id: 'HOTEL-005', status: STATUS.SECURED, lock: 'SECURED', temp: 22.5, humidity: 55, battery: 76, speed: 47, location: LOCATIONS[1], route: [LOCATIONS[1], LOCATIONS[3]], lastEvent: 'GPS updated', updatedAgo: '45 sec ago' },
  { id: 'INDIA-022', status: STATUS.OFFLINE, lock: 'UNKNOWN', temp: null, humidity: null, battery: null, speed: 0, location: LOCATIONS[9], route: [LOCATIONS[9]], lastEvent: 'Connection lost', updatedAgo: '47 min ago' },
  { id: 'JULIET-011', status: STATUS.SECURED, lock: 'SECURED', temp: 20.9, humidity: 48, battery: 99, speed: 71, location: LOCATIONS[0], route: [LOCATIONS[2], LOCATIONS[0]], lastEvent: 'Container secured', updatedAgo: '20 sec ago' },
  { id: 'KILO-033', status: STATUS.NORMAL, lock: 'SECURED', temp: 23.1, humidity: 53, battery: 82, speed: 0, location: LOCATIONS[4], route: [LOCATIONS[4]], lastEvent: 'Scheduled check', updatedAgo: '3 min ago' },
  { id: 'LIMA-019', status: STATUS.SECURED, lock: 'SECURED', temp: 21.4, humidity: 50, battery: 91, speed: 55, location: LOCATIONS[5], route: [LOCATIONS[6], LOCATIONS[5]], lastEvent: 'GPS updated', updatedAgo: '1 min ago' },
  { id: 'MIKE-028', status: STATUS.CRITICAL, lock: 'OPEN', temp: 34.7, humidity: 81, battery: 41, speed: 0, location: LOCATIONS[3], route: [LOCATIONS[3]], lastEvent: 'Tamper detected', updatedAgo: '6 min ago' },
  { id: 'NOVEMBER-004', status: STATUS.WARNING, lock: 'SECURED', temp: 27.8, humidity: 66, battery: 68, speed: 33, location: LOCATIONS[2], route: [LOCATIONS[9], LOCATIONS[2]], lastEvent: 'Speed limit exceeded', updatedAgo: '11 min ago' },
];

// ── Alerts ────────────────────────────────────
export const initialAlerts = [
  { id: 'ALT-001', container: 'ALPHA-023', event: 'Shock detected', severity: 'CRITICAL', timestamp: '10:42:31', location: 'Delhi', status: 'UNREAD' },
  { id: 'ALT-002', container: 'BRAVO-014', event: 'Temperature threshold exceeded', severity: 'WARNING', timestamp: '10:38:15', location: 'Mumbai', status: 'UNREAD' },
  { id: 'ALT-003', container: 'CHARLIE-009', event: 'Unauthorized opening detected', severity: 'CRITICAL', timestamp: '10:23:47', location: 'Bangalore', status: 'RESOLVED' },
  { id: 'ALT-004', container: 'FOXTROT-007', event: 'Humidity threshold warning', severity: 'WARNING', timestamp: '10:35:22', location: 'Hyderabad', status: 'ACKNOWLEDGED' },
  { id: 'ALT-005', container: 'ALPHA-001', event: 'Route deviation detected', severity: 'WARNING', timestamp: '10:49:05', location: 'Raipur', status: 'UNREAD' },
  { id: 'ALT-006', container: 'NOVEMBER-004', event: 'Speed limit exceeded', severity: 'WARNING', timestamp: '10:41:18', location: 'Delhi', status: 'UNREAD' },
  { id: 'ALT-007', container: 'ECHO-018', event: 'Battery low warning', severity: 'WARNING', timestamp: '10:50:55', location: 'Kolkata', status: 'ACKNOWLEDGED' },
  { id: 'ALT-008', container: 'MIKE-028', event: 'Tamper detected — lid open', severity: 'CRITICAL', timestamp: '10:29:11', location: 'Mumbai', status: 'UNREAD' },
];

// ── Blockchain logs ───────────────────────────
export const blockchainLogs = [
  { block: 1842, timestamp: '10:42:31', container: 'ALPHA-023', event: 'SHOCK_DETECTED', hash: '0x7f3a...91c2', verification: 'VERIFIED' },
  { block: 1841, timestamp: '10:38:15', container: 'BRAVO-014', event: 'TEMP_THRESHOLD', hash: '0x4e8b...72d3', verification: 'VERIFIED' },
  { block: 1840, timestamp: '10:23:47', container: 'CHARLIE-009', event: 'UNAUTHORIZED_OPEN', hash: '0x9d5c...63e4', verification: 'VERIFIED' },
  { block: 1839, timestamp: '10:15:33', container: 'ALPHA-001', event: 'GPS_UPDATE', hash: '0xa1d6...9d05', verification: 'VERIFIED' },
  { block: 1838, timestamp: '10:10:22', container: 'DELTA-042', event: 'CONTAINER_SECURED', hash: '0x3d27c...e5f6', verification: 'VERIFIED' },
  { block: 1837, timestamp: '10:05:18', container: 'ECHO-018', event: 'BATTERY_CHECK', hash: '0xc3d1...8d67', verification: 'PENDING' },
  { block: 1836, timestamp: '09:58:44', container: 'GOLF-031', event: 'GPS_UPDATE', hash: '0xb2e4...4a1c', verification: 'VERIFIED' },
  { block: 1835, timestamp: '09:52:11', container: 'HOTEL-005', event: 'CONTAINER_SEALED', hash: '0xf9a3...2b8d', verification: 'VERIFIED' },
  { block: 1834, timestamp: '09:45:30', container: 'KILO-033', event: 'ROUTINE_CHECK', hash: '0x6c8f...9e3a', verification: 'VERIFIED' },
  { block: 1833, timestamp: '09:38:02', container: 'LIMA-019', event: 'DEPARTURE_LOGGED', hash: '0x1d4b...7f5e', verification: 'VERIFIED' },
  { block: 1832, timestamp: '09:31:19', container: 'MIKE-028', event: 'CONTAINER_SEALED', hash: '0x8a2e...c6b1', verification: 'VERIFIED' },
  { block: 1831, timestamp: '09:22:55', container: 'NOVEMBER-004', event: 'GPS_UPDATE', hash: '0x5f7c...d4a8', verification: 'VERIFIED' },
];

// ── Shock events ──────────────────────────────
export const shockEvents = [
  { timestamp: '10:42:31', container: 'ALPHA-023', level: 'HIGH', location: 'Delhi', status: 'CRITICAL', action: 'Pending Review' },
  { timestamp: '09:14:07', container: 'MIKE-028', level: 'MEDIUM', location: 'Mumbai', status: 'ACKNOWLEDGED', action: 'Under Review' },
  { timestamp: '08:55:42', container: 'BRAVO-014', level: 'LOW', location: 'Mumbai', status: 'RESOLVED', action: 'Cleared' },
  { timestamp: '08:31:18', container: 'GOLF-031', level: 'LOW', location: 'Pune', status: 'RESOLVED', action: 'Cleared' },
  { timestamp: '07:48:55', container: 'ALPHA-023', level: 'MEDIUM', location: 'Nagpur', status: 'RESOLVED', action: 'Cleared' },
  { timestamp: '06:22:11', container: 'DELTA-042', level: 'LOW', location: 'Raipur', status: 'RESOLVED', action: 'Cleared' },
  { timestamp: '05:10:34', container: 'INDIA-022', level: 'HIGH', location: 'Jaipur', status: 'OFFLINE', action: 'N/A' },
  { timestamp: '04:33:09', container: 'CHARLIE-009', level: 'MEDIUM', location: 'Bangalore', status: 'RESOLVED', action: 'Cleared' },
];

// ── Tamper events ─────────────────────────────
export const tamperEvents = [
  { timestamp: '10:23:47', container: 'CHARLIE-009', event: 'UNAUTHORIZED_OPEN', location: 'Bangalore', verification: 'UNVERIFIED' },
  { timestamp: '10:29:11', container: 'MIKE-028', event: 'LID_OPENED', location: 'Mumbai', verification: 'UNVERIFIED' },
  { timestamp: '09:08:22', container: 'ALPHA-023', event: 'CONTAINER_SECURED', location: 'Nagpur', verification: 'VERIFIED' },
  { timestamp: '08:42:15', container: 'ALPHA-001', event: 'CONTAINER_SECURED', location: 'Raipur', verification: 'VERIFIED' },
  { timestamp: '08:15:03', container: 'FOXTROT-007', event: 'LID_OPENED', location: 'Chennai', verification: 'VERIFIED' },
  { timestamp: '07:58:41', container: 'FOXTROT-007', event: 'CONTAINER_SECURED', location: 'Chennai', verification: 'VERIFIED' },
  { timestamp: '07:20:55', container: 'NOVEMBER-004', event: 'LOCK_RESTORED', location: 'Nagpur', verification: 'VERIFIED' },
  { timestamp: '06:44:18', container: 'GOLF-031', event: 'CONTAINER_SEALED', location: 'Pune', verification: 'VERIFIED' },
  { timestamp: '05:30:07', container: 'INDIA-022', event: 'UNAUTHORIZED_OPEN', location: 'Jaipur', verification: 'FAILED' },
];

// ── Telemetry generator ───────────────────────
export function generateTelemetry(containerId, hours = 24, points = 48) {
  const container = containers.find((c) => c.id === containerId) || containers[0];
  const now = Date.now();
  const interval = (hours * 3600 * 1000) / points;

  const tempBase = container.temp ?? 23;
  const humBase = container.humidity ?? 55;

  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - 1 - i) * interval);
    const jitter = (v, range) => v + (Math.random() - 0.5) * range;
    const shock =
      container.status === STATUS.CRITICAL && i === Math.floor(points * 0.9)
        ? 8.4 + Math.random() * 2
        : Math.random() < 0.05
        ? 1 + Math.random() * 3
        : Math.random() * 0.4;

    return {
      label: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(jitter(tempBase, 3) * 10) / 10,
      humidity: Math.round(jitter(humBase, 6)),
      shock: Math.round(shock * 10) / 10,
    };
  });
}

// ── Container events for details page ─────────
export function getContainerEvents(containerId) {
  const base = [
    { time: '08:42', icon: 'lock', label: 'Container secured', type: 'normal' },
    { time: '08:39', icon: 'map-pin', label: 'GPS location updated', type: 'info' },
    { time: '08:35', icon: 'thermometer', label: 'Temperature within normal range', type: 'normal' },
    { time: '08:20', icon: 'battery', label: 'Battery status checked', type: 'info' },
    { time: '08:00', icon: 'package', label: 'Container departed origin', type: 'info' },
  ];
  const container = containers.find((c) => c.id === containerId);
  if (!container) return base;
  if (container.status === STATUS.CRITICAL || container.status === STATUS.TAMPERED) {
    base.unshift({ time: '10:42', icon: 'alert-triangle', label: container.lastEvent, type: 'critical' });
  } else if (container.status === STATUS.WARNING) {
    base.unshift({ time: '10:38', icon: 'alert-circle', label: container.lastEvent, type: 'warning' });
  }
  return base;
}
