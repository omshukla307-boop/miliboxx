import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Thermometer, Droplets, Lock, Battery, MapPin,
  Clock, ArrowLeft, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import ThemedTileLayer from '../components/ui/ThemedTileLayer';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/ui/StatusBadge';
import TelemetryLineChart from '../components/charts/TelemetryLineChart';
import { generateTelemetry, getContainerEvents, STATUS } from '../services/mockData';

function MetricCard({ icon: Icon, label, value, sub, variant = 'normal' }) {
  const colors = {
    normal:   'text-status-normal',
    warning:  'text-status-warning',
    critical: 'text-status-critical',
    info:     'text-accent-blue',
    muted:    'text-text-secondary',
  };
  return (
    <div className="card px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-text-muted" />
        <span className="text-2xs text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold ${colors[variant]}`}>{value}</div>
      {sub && <div className="text-2xs text-text-secondary mt-0.5">{sub}</div>}
    </div>
  );
}

function EventIcon({ type }) {
  if (type === 'critical') return <AlertTriangle size={13} className="text-status-critical" />;
  if (type === 'warning')  return <AlertTriangle size={13} className="text-status-warning" />;
  if (type === 'normal')   return <CheckCircle2  size={13} className="text-status-normal" />;
  return <Info size={13} className="text-status-info" />;
}

export default function ContainerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();

  const container = state.containers.find((c) => c.id === id) ?? state.containers[0];
  const telemetry = useMemo(() => generateTelemetry(container?.id), [container?.id]);
  const events    = useMemo(() => getContainerEvents(container?.id), [container?.id]);

  if (!container) {
    return (
      <div className="page-container">
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-text-secondary">No container details available.</p>
          <button onClick={() => navigate('/containers')} className="btn-primary">
            Back to Containers
          </button>
        </div>
      </div>
    );
  }

  const tempData = telemetry.map((p) => ({ label: p.label, value: p.temp }));
  const humData  = telemetry.map((p) => ({ label: p.label, value: p.humidity }));

  const batteryVariant = container.battery != null && container.battery < 30 ? 'warning' : 'normal';
  const tempVariant    = container.temp != null && container.temp > 28 ? 'warning' : container.temp != null && container.temp > 30 ? 'critical' : 'normal';
  const lockVariant    = container.lock === 'OPEN' ? 'critical' : 'normal';

  const routePositions = container.route ? container.route.map((r) => [r.lat, r.lng]) : [];

  return (
    <div className="page-container">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost mt-0.5 flex items-center gap-1.5 text-xs"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary font-mono">{container.id}</h2>
            <StatusBadge status={container.status} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-2xs text-text-muted">
            <Clock size={11} />
            Last updated: {container.updatedAgo}
            <span className="mx-1">·</span>
            <MapPin size={11} />
            {container.location.name}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={Thermometer}
          label="Temperature"
          value={container.temp != null ? `${container.temp}°C` : '—'}
          sub={container.temp != null && container.temp > 28 ? 'Above threshold' : 'Normal'}
          variant={tempVariant}
        />
        <MetricCard
          icon={Droplets}
          label="Humidity"
          value={container.humidity != null ? `${container.humidity}%` : '—'}
          sub={container.humidity != null && container.humidity > 70 ? 'Above threshold' : 'Normal'}
          variant={container.humidity != null && container.humidity > 70 ? 'warning' : 'normal'}
        />
        <MetricCard
          icon={Lock}
          label="Lock Status"
          value={container.lock}
          variant={lockVariant}
        />
        <MetricCard
          icon={Battery}
          label="Battery"
          value={container.battery != null ? `${container.battery}%` : '—'}
          sub={container.battery != null && container.battery < 30 ? 'Low battery' : 'Sufficient'}
          variant={batteryVariant}
        />
      </div>

      {/* Info + Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Container info */}
        <div className="card px-5 py-4 space-y-3">
          <div className="section-header mb-1">Container Information</div>
          {[
            ['Container ID', container.id],
            ['Current Location', container.location.name],
            ['Coordinates', `${container.location.lat.toFixed(4)}°N, ${container.location.lng.toFixed(4)}°E`],
            ['Speed', container.speed > 0 ? `${container.speed} km/h` : 'Stationary'],
            ['Lock', container.lock],
            ['Battery', container.battery != null ? `${container.battery}%` : '—'],
            ['Last Event', container.lastEvent],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start gap-3 text-sm">
              <span className="text-text-muted w-32 flex-shrink-0">{k}</span>
              <span className="text-text-primary font-medium">{v}</span>
            </div>
          ))}
        </div>

        {/* Mini map */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border section-header">Live Location</div>
          <MapContainer
            center={[container.location.lat, container.location.lng]}
            zoom={8}
            style={{ height: 260, width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={false}
          >
            <ThemedTileLayer />
            {routePositions.length > 1 && (
              <Polyline
                positions={routePositions}
                pathOptions={{ color: '#3b7dd880', weight: 2, dashArray: '6 4' }}
              />
            )}
            <CircleMarker
              center={[container.location.lat, container.location.lng]}
              radius={9}
              pathOptions={{
                fillColor: container.status === STATUS.CRITICAL || container.status === STATUS.TAMPERED
                  ? '#ef4444'
                  : container.status === STATUS.WARNING
                  ? '#f59e0b'
                  : '#22c55e',
                color: '#0c1118',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>{container.id}</strong><br />
                  {container.location.name}
                </div>
              </Popup>
            </CircleMarker>
          </MapContainer>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card px-4 py-4">
          <div className="section-header mb-1">Temperature — Last 24 Hours</div>
          <div className="text-2xs text-text-muted mb-3">Warning: 25°C · Critical: 30°C</div>
          <TelemetryLineChart
            data={tempData}
            label="Temperature"
            color="#3b7dd8"
            unit="°C"
            warnLevel={25}
            critLevel={30}
            height={160}
          />
        </div>
        <div className="card px-4 py-4">
          <div className="section-header mb-1">Humidity — Last 24 Hours</div>
          <div className="text-2xs text-text-muted mb-3">Warning: 70% · Critical: 85%</div>
          <TelemetryLineChart
            data={humData}
            label="Humidity"
            color="#22c55e"
            unit="%"
            warnLevel={70}
            critLevel={85}
            height={160}
          />
        </div>
      </div>

      {/* Event timeline */}
      <div className="card px-5 py-4">
        <div className="section-header mb-4">Recent Events</div>
        <div className="space-y-3">
          {events.map((ev, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5"><EventIcon type={ev.type} /></div>
              <div className="flex-1 border-b border-bg-border/50 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-primary">{ev.label}</span>
                  <span className="text-2xs text-text-muted font-mono ml-auto">{ev.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
