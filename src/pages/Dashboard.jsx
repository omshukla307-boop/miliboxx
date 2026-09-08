import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Truck, AlertTriangle, XCircle, CheckCircle2,
  Clock, MapPin, Thermometer, Droplets, Lock,
} from 'lucide-react';
import { MapContainer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useApp } from '../context/AppContext';
import KPICard from '../components/ui/KPICard';
import StatusBadge from '../components/ui/StatusBadge';
import ThemedTileLayer from '../components/ui/ThemedTileLayer';
import { STATUS } from '../services/mockData';


// Severity color for alert entries
const SEVERITY_CFG = {
  CRITICAL: { cls: 'text-status-critical', bar: 'bg-status-critical', label: 'CRITICAL' },
  WARNING:  { cls: 'text-status-warning',  bar: 'bg-status-warning',  label: 'WARNING' },
  INFO:     { cls: 'text-status-info',     bar: 'bg-status-info',     label: 'INFO' },
  RESOLVED: { cls: 'text-status-normal',   bar: 'bg-status-normal',   label: 'RESOLVED' },
};

// Map marker color by status
function markerColor(status) {
  if (status === STATUS.CRITICAL || status === STATUS.TAMPERED || status === STATUS.SHOCK) return '#ef4444';
  if (status === STATUS.WARNING) return '#f59e0b';
  if (status === STATUS.OFFLINE) return '#4f6070';
  return '#22c55e';
}

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { containers, alerts } = state;

  // KPI computations
  const total     = containers.length;
  const inTransit = containers.filter((c) => c.speed > 0).length;
  const unread    = alerts.filter((a) => a.status === 'UNREAD').length;
  const critical  = containers.filter((c) =>
    c.status === STATUS.CRITICAL || c.status === STATUS.TAMPERED
  ).length;

  const recentAlerts = useMemo(() => alerts.slice(0, 6), [alerts]);
  const recentContainers = useMemo(() => containers.slice(0, 10), [containers]);

  const mapCenter = [20.5937, 78.9629]; // India

  const tempDisplay = (v) => v != null ? `${v}°C` : '—';
  const humDisplay  = (v) => v != null ? `${v}%`  : '—';

  return (
    <div className="page-container">
      {/* Sub-title */}
      <div>
        <p className="text-xs text-text-secondary">Real-time supply container monitoring — {new Date().toLocaleString()}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="Total Containers" value={total}      icon={Package}       variant="muted" />
        <KPICard label="Active / In Transit" value={inTransit} icon={Truck}       variant="info" sub={`${total - inTransit} stationary`} />
        <KPICard label="Active Alerts"     value={unread}    icon={AlertTriangle} variant={unread > 0 ? 'warning' : 'normal'} />
        <KPICard label="Critical Issues"   value={critical}  icon={XCircle}       variant={critical > 0 ? 'critical' : 'normal'} />
        <KPICard label="System Status"     value="OPER."     icon={CheckCircle2}  variant="normal" sub="All systems nominal" />
      </div>

      {/* Map + Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Map */}
        <div className="lg:col-span-3 card overflow-hidden" style={{ minHeight: 320 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
            <span className="section-header">Live Container Overview</span>
            <span className="text-2xs text-text-muted">{containers.length} containers tracked</span>
          </div>
          <MapContainer
            center={mapCenter}
            zoom={5}
            style={{ height: 300, width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={false}
          >
            <ThemedTileLayer />
            {containers.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.location.lat, c.location.lng]}
                radius={7}
                pathOptions={{
                  fillColor: markerColor(c.status),
                  color: markerColor(c.status),
                  fillOpacity: 0.85,
                  weight: 1.5,
                }}
                eventHandlers={{
                  click: () => navigate(`/container/${c.id}`),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{c.id}</div>
                    <div className="text-text-secondary">{c.location.name}</div>
                    <StatusBadge status={c.status} size="xs" />
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-2 card flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
            <span className="section-header">Recent Alerts</span>
            <button onClick={() => navigate('/alerts')} className="text-2xs text-accent-blue hover:underline">
              View all
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-bg-border/50">
            {recentAlerts.map((a) => {
              const sev = SEVERITY_CFG[a.severity] ?? SEVERITY_CFG.INFO;
              return (
                <div key={a.id} className="flex gap-3 px-4 py-3 hover:bg-bg-elevated/30 transition-colors animate-slide-in">
                  <div className={`w-0.5 rounded-full flex-shrink-0 mt-0.5 ${sev.bar}`} style={{ minHeight: 32 }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-2xs font-bold uppercase ${sev.cls}`}>{sev.label}</span>
                      <span className="text-2xs text-text-muted">{a.timestamp}</span>
                    </div>
                    <div className="text-xs font-medium text-text-primary">{a.container}</div>
                    <div className="text-xs text-text-secondary truncate">{a.event}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Container Activity Table */}
      <div className="card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
          <span className="section-header">Recent Container Activity</span>
          <button onClick={() => navigate('/containers')} className="text-2xs text-accent-blue hover:underline">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Container ID</th>
                <th>Location</th>
                <th><Thermometer size={11} className="inline mr-1" />Temp</th>
                <th><Droplets size={11} className="inline mr-1" />Humidity</th>
                <th><Lock size={11} className="inline mr-1" />Lock</th>
                <th>Status</th>
                <th><Clock size={11} className="inline mr-1" />Last Update</th>
              </tr>
            </thead>
            <tbody>
              {recentContainers.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/container/${c.id}`)}>
                  <td className="font-mono text-xs font-medium text-accent-blue">{c.id}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-text-muted" />
                      <span>{c.location.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={c.temp != null && c.temp > 28 ? 'text-status-warning' : 'text-text-primary'}>
                      {tempDisplay(c.temp)}
                    </span>
                  </td>
                  <td>
                    <span className={c.humidity != null && c.humidity > 70 ? 'text-status-warning' : 'text-text-primary'}>
                      {humDisplay(c.humidity)}
                    </span>
                  </td>
                  <td>
                    <span className={c.lock === 'OPEN' ? 'text-status-critical font-semibold' : 'text-text-secondary'}>
                      {c.lock}
                    </span>
                  </td>
                  <td><StatusBadge status={c.status} size="xs" /></td>
                  <td className="text-text-muted text-xs">{c.updatedAgo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
