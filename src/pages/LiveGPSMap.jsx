import { useState } from 'react';
import { MapContainer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Clock, Gauge } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/ui/StatusBadge';
import ThemedTileLayer from '../components/ui/ThemedTileLayer';
import { STATUS } from '../services/mockData';

function markerColor(status) {
  if (status === STATUS.CRITICAL || status === STATUS.TAMPERED) return '#ef4444';
  if (status === STATUS.WARNING) return '#f59e0b';
  if (status === STATUS.OFFLINE) return '#4f6070';
  return '#22c55e';
}

// Component to fly to selected container
function MapFlyTo({ center }) {
  const map = useMap();
  if (center) map.flyTo(center, 9, { duration: 1.2 });
  return null;
}

export default function LiveGPSMap() {
  const { state } = useApp();
  const { containers } = state;
  const [selectedId, setSelectedId] = useState(() => containers[0]?.id);

  const selected = containers.find((c) => c.id === selectedId) || containers[0];
  const mapCenter = [20.5937, 78.9629];
  const routePositions = selected?.route ? selected.route.map((r) => [r.lat, r.lng]) : [];

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Full-height map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={5}
          style={{ height: '100%', width: '100%', minHeight: 400 }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <ThemedTileLayer />
          <MapFlyTo center={selected ? [selected.location.lat, selected.location.lng] : null} />

          {/* Route for selected */}
          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: '#3b7dd870', weight: 2, dashArray: '8 5' }}
            />
          )}

          {/* All container markers */}
          {containers.map((c) => {
            const isSelected = c.id === selected?.id;
            return (
              <CircleMarker
                key={c.id}
                center={[c.location.lat, c.location.lng]}
                radius={isSelected ? 11 : 7}
                pathOptions={{
                  fillColor: markerColor(c.status),
                  color: isSelected ? '#ffffff' : markerColor(c.status),
                  fillOpacity: isSelected ? 1 : 0.8,
                  weight: isSelected ? 2 : 1,
                }}
                eventHandlers={{ click: () => setSelectedId(c.id) }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{c.id}</div>
                    <div className="text-text-secondary">{c.location.name}</div>
                    <StatusBadge status={c.status} size="xs" />
                    {c.speed > 0 && (
                      <div className="text-text-muted">{c.speed} km/h</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Map legend overlay */}
        <div className="absolute bottom-4 left-4 z-[400] card px-3 py-2 space-y-1.5">
          {[
            { color: '#22c55e', label: 'Secured / Normal' },
            { color: '#f59e0b', label: 'Warning' },
            { color: '#ef4444', label: 'Critical / Tampered' },
            { color: '#4f6070', label: 'Offline' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-2xs text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-60 border-l border-bg-border bg-bg-surface flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-bg-border">
          <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-1">
            Selected Container
          </div>
          <div className="font-mono text-sm font-bold text-accent-blue">{selected?.id}</div>
          <div className="mt-1"><StatusBadge status={selected?.status} size="xs" /></div>
        </div>

        {/* Details */}
        <div className="px-4 py-4 space-y-4 flex-1">
          {[
            { icon: MapPin,     label: 'Location',    value: selected?.location.name },
            { icon: Navigation, label: 'Coordinates', value: `${selected?.location.lat.toFixed(4)}°N\n${selected?.location.lng.toFixed(4)}°E` },
            { icon: Gauge,      label: 'Speed',       value: selected?.speed > 0 ? `${selected.speed} km/h` : 'Stationary' },
            { icon: Clock,      label: 'Last Update', value: selected?.updatedAgo },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 text-2xs text-text-muted uppercase tracking-wider mb-1">
                <Icon size={11} />{label}
              </div>
              <div className="text-sm text-text-primary whitespace-pre-line">{value ?? '—'}</div>
            </div>
          ))}
        </div>

        {/* Container list */}
        <div className="border-t border-bg-border px-4 py-3">
          <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            All Containers
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {containers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors
                  ${c.id === selected?.id
                    ? 'bg-accent-blue-muted text-accent-blue'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
              >
                <span
                  className="status-dot flex-shrink-0"
                  style={{ background: markerColor(c.status) }}
                />
                <span className="font-mono">{c.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
