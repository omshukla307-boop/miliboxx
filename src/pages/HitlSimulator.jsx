import { useState, useRef, useCallback } from 'react';
import {
  Cpu, Wifi, AlertTriangle, Thermometer, Droplets,
  Battery, MapPin, RotateCcw, Zap, ShieldOff, ShieldCheck, Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { postTelemetry } from '../services/api';

const GPS_LOCATIONS = [
  'Raipur', 'Delhi', 'Mumbai', 'Bangalore',
  'Hyderabad', 'Kolkata', 'Chennai', 'Pune', 'Jaipur',
];

const CITY_COORDINATES = {
  Raipur:    { lat: 21.2514, lng: 81.6296 },
  Delhi:     { lat: 28.6139, lng: 77.2090 },
  Mumbai:    { lat: 19.0760, lng: 72.8777 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Kolkata:   { lat: 22.5726, lng: 88.3639 },
  Chennai:   { lat: 13.0827, lng: 80.2707 },
  Pune:      { lat: 18.5204, lng: 73.8567 },
  Jaipur:    { lat: 26.9124, lng: 75.7873 },
};


// ── Sketchfab embed config ───────────────────────────────────────
const MODEL_ID   = '8ba1566302e242b5807d769ef0be7092';
const EMBED_BASE = `https://sketchfab.com/models/${MODEL_ID}/embed`;

// Hide ALL Sketchfab UI chrome: controls, watermark, buy, share, AR, VR buttons
const EMBED_PARAMS = new URLSearchParams({
  autostart:       '1',
  ui_controls:     '0',  // hides play/pause, share, fullscreen toolbar
  ui_infos:        '0',  // hides model title/author info panel
  ui_inspector:    '0',
  ui_stop:         '0',
  ui_watermark:    '0',  // hides "Sketchfab" watermark
  ui_ar:           '0',  // hides AR button
  ui_snapshots:    '0',  // hides screenshot button
  ui_vr:           '0',  // hides VR button
  ui_hint:         '0',  // hides the "drag to rotate" hint
  dnt:             '1',  // do not track
});

const EMBED_SRC = `${EMBED_BASE}?${EMBED_PARAMS.toString()}`;

// ── Sealed lid overlay ──────────────────────────────────────────
/**
 * When the container is SECURED, we draw a semi-transparent overlay
 * on top of the open-lid model with a padlock icon + "SEALED" text
 * so it visually reads as "lid is closed / container sealed".
 */
function SealedOverlay() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      style={{
        background: 'linear-gradient(rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%)',
        backdropFilter: 'blur(1.5px)',
        zIndex: 5,
      }}
    >
      <div
        className="flex flex-col items-center gap-3 px-6 py-4 rounded-lg"
        style={{
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(34,197,94,0.4)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Lock
          size={36}
          strokeWidth={1.5}
          style={{ color: '#22c55e', filter: 'drop-shadow(0 0 8px #22c55e60)' }}
        />
        <div className="text-center">
          <div
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: '#22c55e', letterSpacing: '0.2em' }}
          >
            CONTAINER SEALED
          </div>
          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Lid secured · Tamper sensors active
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3D Viewer component ─────────────────────────────────────────
function ContainerEmbed({ tampered, shocked }) {
  const borderColor = tampered ? '#ef4444' : shocked ? '#f59e0b' : '#22c55e';
  const statusLabel = tampered ? '⚠ TAMPER DETECTED — LID OPEN'
                    : shocked  ? '⚡ SHOCK EVENT DETECTED'
                    :            '✔ CONTAINER SECURED';
  const statusColor = tampered ? '#ef4444' : shocked ? '#f59e0b' : '#22c55e';
  const isSecured   = !tampered && !shocked;

  return (
    <div className="flex flex-col items-center w-full">
      {/* 3D Viewer wrapper */}
      <div
        className="relative w-full rounded overflow-hidden"
        style={{
          height: 340,
          border: `1.5px solid ${borderColor}`,
          boxShadow: `0 0 24px ${borderColor}28`,
          transition: 'border-color 0.4s, box-shadow 0.4s',
          background: '#0c1118',
        }}
      >
        {/* Sketchfab iframe — always rendered (keeps model loaded) */}
        <iframe
          id="sketchfab-frame"
          title="Military Chest — MilliBox Container Digital Twin"
          src={EMBED_SRC}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />

        {/* Sealed overlay — shows when container is secured */}
        {isSecured && <SealedOverlay />}

        {/* Tamper / shock tint overlay */}
        {(tampered || shocked) && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: tampered ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.06)',
              zIndex: 4,
            }}
          />
        )}

        {/* Status ribbon (bottom) */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-1.5"
          style={{
            background: `linear-gradient(transparent, ${borderColor}35)`,
            backdropFilter: 'blur(2px)',
            zIndex: 10,
          }}
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: statusColor, textShadow: `0 0 8px ${statusColor}60` }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Corner badge — Digital Twin ID */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-2xs font-semibold uppercase tracking-wider"
          style={{
            background: 'rgba(0,0,0,0.65)',
            color: 'rgba(138,155,176,0.9)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
          }}
        >
          Digital Twin · MB-SIM-001
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-2 text-2xs text-center" style={{ color: 'var(--text-muted)' }}>
        {isSecured
          ? 'Click "Tamper / Open Lid" to inspect the interior model'
          : 'Drag to rotate · Scroll to zoom · Right-click to pan'}
      </div>
    </div>
  );
}

// ── Sensor slider ───────────────────────────────────────────────
function SensorSlider({ icon: Icon, label, value, min, max, step = 1, unit, onChange, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <Icon size={13} style={{ color }} />
          {label}
        </div>
        <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-2xs" style={{ color: 'var(--text-muted)' }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function HitlSimulator() {
  const { dispatch } = useApp();
  const alertCounter = useRef(200);

  const [tampered, setTampered]   = useState(false);
  const [shocked, setShocked]     = useState(false);
  const [temp, setTemp]           = useState(22);
  const [humidity, setHumidity]   = useState(45);
  const [battery, setBattery]     = useState(85);
  const [gpsLocation, setGps]     = useState('Raipur');
  const [lastEvent, setLastEvent] = useState('System initialized — container sealed');

  const fireAlert = useCallback((event, severity) => {
    alertCounter.current += 1;
    const now = new Date();
    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id:        `SIM-${alertCounter.current}`,
        container: 'MB-SIM-001',
        event,
        severity,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        location:  gpsLocation,
        status:    'UNREAD',
      },
    });
    setLastEvent(`${event} — ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
  }, [dispatch, gpsLocation]);

  const transmitPayload = useCallback(async (overrides = {}) => {
    const isTampered = overrides.tampered !== undefined ? overrides.tampered : tampered;
    const isShocked  = overrides.shocked  !== undefined ? overrides.shocked  : shocked;
    const currentTemp = overrides.temp     !== undefined ? overrides.temp     : temp;
    const currentHum  = overrides.humidity !== undefined ? overrides.humidity : humidity;
    const currentLocation = overrides.gpsLocation !== undefined ? overrides.gpsLocation : gpsLocation;

    const coords = CITY_COORDINATES[currentLocation] || { lat: 21.2514, lng: 81.6296 };

    const payload = {
      container_id: 'MB-SIM-001',
      timestamp: new Date().toISOString(),
      temperature: parseFloat(currentTemp),
      humidity: parseFloat(currentHum),
      shock_g: isShocked ? 4.5 : 1.0,
      latitude: parseFloat(coords.lat),
      longitude: parseFloat(coords.lng),
      lid_open: Boolean(isTampered),
    };

    try {
      await postTelemetry(payload);
    } catch (error) {
      console.warn('Telemetry transmission failed (backend offline or error):', error?.message || error);
    }
  }, [tampered, shocked, temp, humidity, gpsLocation]);

  const handleTamper = () => {
    const next = !tampered;
    setTampered(next);
    if (next) {
      setShocked(false);
      fireAlert('Tamper detected — lid opened', 'CRITICAL');
      transmitPayload({ tampered: true, shocked: false });
    } else {
      fireAlert('Container re-secured — lid closed', 'INFO');
      transmitPayload({ tampered: false });
    }
  };

  const handleShock = () => {
    setShocked(true);
    fireAlert('Shock / drop event detected', 'CRITICAL');
    transmitPayload({ shocked: true });
    setTimeout(() => setShocked(false), 4000);
  };

  const handleReset = () => {
    setTampered(false);
    setShocked(false);
    setTemp(22);
    setHumidity(45);
    setBattery(85);
    setGps('Raipur');
    setLastEvent('System reset — container sealed');
    transmitPayload({ tampered: false, shocked: false, temp: 22, humidity: 45, gpsLocation: 'Raipur' });
  };


  const isSecured = !tampered && !shocked;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Hardware-in-the-loop simulator — trigger sensor events and observe real-time 3D container response
        </p>
        <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5 text-xs">
          <RotateCcw size={13} /> Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Left: 3D Model ─── */}
        <div className="card px-4 py-5 flex flex-col items-center justify-center gap-4">
          <ContainerEmbed tampered={tampered} shocked={shocked} />

          {/* Sensor readouts below model */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {[
              { label: 'Temp',     value: `${temp}°C`,  color: 'var(--accent-blue)'   },
              { label: 'Humidity', value: `${humidity}%`, color: 'var(--status-normal)' },
              { label: 'Battery',  value: `${battery}%`,  color: battery < 30 ? 'var(--status-warning)' : 'var(--status-normal)' },
              { label: 'Location', value: gpsLocation,  color: 'var(--text-secondary)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card px-2 py-2 text-center">
                <div className="text-2xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="text-xs font-semibold mt-0.5 font-mono" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Controls ── */}
        <div className="card px-5 py-5 space-y-5">
          <div
            className="text-sm font-semibold pb-3"
            style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-border)' }}
          >
            Virtual Sensor Controls
          </div>

          {/* Trigger buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tamper / Secure button */}
            <button
              id="tamper-trigger"
              onClick={handleTamper}
              className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded text-sm font-semibold transition-all border"
              style={tampered ? {
                background: 'var(--status-critical)',
                color: '#fff',
                border: '1px solid var(--status-critical)',
              } : {
                background: 'var(--status-critical-bg)',
                color: 'var(--status-critical)',
                border: '1px solid var(--status-critical-dim)',
              }}
            >
              {tampered
                ? <><ShieldCheck size={18} /><span>Secure Container</span></>
                : <><ShieldOff   size={18} /><span>Tamper / Open Lid</span></>
              }
            </button>

            {/* Shock button */}
            <button
              id="shock-trigger"
              onClick={handleShock}
              disabled={shocked}
              className={`flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded text-sm font-semibold transition-all border ${shocked ? 'animate-pulse' : ''}`}
              style={shocked ? {
                background: 'var(--status-warning)',
                color: '#fff',
                border: '1px solid var(--status-warning)',
              } : {
                background: 'var(--status-warning-bg)',
                color: 'var(--status-warning)',
                border: '1px solid var(--status-warning-dim)',
              }}
            >
              <Zap size={18} />
              <span>{shocked ? 'Shock Active…' : 'Simulate Shock'}</span>
            </button>
          </div>

          {/* Container state indicator */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded text-xs"
            style={{
              background: isSecured ? 'var(--status-normal-bg)' : 'var(--status-critical-bg)',
              border: `1px solid ${isSecured ? 'var(--status-normal-dim)' : 'var(--status-critical-dim)'}`,
              color: isSecured ? 'var(--status-normal)' : 'var(--status-critical)',
            }}
          >
            {isSecured
              ? <><ShieldCheck size={13} /> Container sealed — lid overlay active in 3D view</>
              : <><ShieldOff   size={13} /> Container open — lid overlay removed</>
            }
          </div>

          {/* Sensor sliders */}
          <div className="space-y-5">
            <SensorSlider
              icon={Thermometer} label="Temperature" value={temp}
              min={-10} max={60} unit="°C" color="var(--accent-blue)"
              onChange={(v) => {
                setTemp(v);
                if (v > 30)      fireAlert(`Temperature critical: ${v}°C`, 'CRITICAL');
                else if (v > 25) fireAlert(`Temperature warning: ${v}°C`,  'WARNING');
                transmitPayload({ temp: v });
              }}
            />
            <SensorSlider
              icon={Droplets} label="Humidity" value={humidity}
              min={0} max={100} unit="%" color="var(--status-normal)"
              onChange={(v) => {
                setHumidity(v);
                if (v > 85) fireAlert(`Humidity critical: ${v}%`, 'CRITICAL');
                transmitPayload({ humidity: v });
              }}
            />
            <SensorSlider
              icon={Battery} label="Battery" value={battery}
              min={0} max={100} unit="%" color="var(--status-warning)"
              onChange={(v) => {
                setBattery(v);
                if (v < 10)      fireAlert(`Battery critical: ${v}%`,  'CRITICAL');
                else if (v < 30) fireAlert(`Battery low: ${v}%`,       'WARNING');
                transmitPayload();
              }}
            />
          </div>

          {/* GPS location selector */}
          <div>
            <label className="input-label flex items-center gap-1.5">
              <MapPin size={11} /> GPS Location Simulation
            </label>
            <select
              className="input"
              value={gpsLocation}
              onChange={(e) => {
                const loc = e.target.value;
                setGps(loc);
                fireAlert(`GPS update: moved to ${loc}`, 'INFO');
                transmitPayload({ gpsLocation: loc });
              }}
            >
              {GPS_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Status footer bar */}
      <div className="card px-4 py-3">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Cpu size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-2xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ESP32</span>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="status-dot animate-pulse-dot" style={{ background: 'var(--status-normal)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--status-normal)' }}>ONLINE</span>
            </span>
          </div>
          <div className="h-4 w-px" style={{ background: 'var(--bg-border)' }} />
          <div className="flex items-center gap-2">
            <Wifi size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-2xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Simulator</span>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="status-dot animate-pulse-dot" style={{ background: 'var(--status-normal)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--status-normal)' }}>Active</span>
            </span>
          </div>
          <div className="h-4 w-px" style={{ background: 'var(--bg-border)' }} />
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-2xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Event</span>
            <span className="font-mono text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{lastEvent}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
