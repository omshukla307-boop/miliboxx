import { useState } from 'react';
import { User, Bell, Sliders, Activity, Map, Monitor, Save } from 'lucide-react';
import Toggle from '../components/ui/Toggle';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card px-5 py-5 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-bg-border pb-3">
        <Icon size={15} className="text-accent-blue" />
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <div className="text-sm text-text-primary">{label}</div>
        {description && <div className="text-2xs text-text-muted mt-0.5">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ThresholdPair({ warnLabel, critLabel, warnDefault, critDefault, unit }) {
  const [warn, setWarn] = useState(warnDefault);
  const [crit, setCrit] = useState(critDefault);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="input-label">{warnLabel} ({unit})</label>
        <input
          type="number"
          className="input"
          value={warn}
          onChange={(e) => setWarn(e.target.value)}
        />
      </div>
      <div>
        <label className="input-label">{critLabel} ({unit})</label>
        <input
          type="number"
          className="input"
          value={crit}
          onChange={(e) => setCrit(e.target.value)}
        />
      </div>
    </div>
  );
}

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container max-w-3xl">
      <p className="text-xs text-text-secondary">
        System configuration for account, notifications, thresholds, and preferences
      </p>

      {/* Account */}
      <Section icon={User} title="Account Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Officer ID</label>
            <input type="text" className="input" defaultValue="OFF-001" />
          </div>
          <div>
            <label className="input-label">Name</label>
            <input type="text" className="input" defaultValue="Maj. A. Sharma" />
          </div>
          <div>
            <label className="input-label">Role</label>
            <input type="text" className="input" defaultValue="Logistics Officer" readOnly />
          </div>
          <div>
            <label className="input-label">Unit</label>
            <input type="text" className="input" defaultValue="14th Supply Bn" />
          </div>
        </div>
        <div>
          <label className="input-label">Current Password</label>
          <input type="password" className="input max-w-xs" placeholder="••••••••" />
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <SettingRow label="Email Notifications" description="Receive alert digests via email">
          <Toggle checked={true} />
        </SettingRow>
        <SettingRow label="Push Notifications" description="Browser and mobile push alerts">
          <Toggle checked={true} />
        </SettingRow>
        <SettingRow label="SMS Alerts" description="Critical alerts sent via SMS">
          <Toggle checked={false} />
        </SettingRow>
        <SettingRow label="Alert Sound" description="Play audio for critical events">
          <Toggle checked={true} />
        </SettingRow>
        <SettingRow label="Critical-Only Mode" description="Suppress non-critical notifications during operations">
          <Toggle checked={false} />
        </SettingRow>
      </Section>

      {/* Alert Thresholds */}
      <Section icon={Sliders} title="Alert Thresholds">
        <ThresholdPair
          warnLabel="Temperature Warning" critLabel="Temperature Critical"
          warnDefault={25} critDefault={30} unit="°C"
        />
        <ThresholdPair
          warnLabel="Humidity Warning" critLabel="Humidity Critical"
          warnDefault={70} critDefault={85} unit="%"
        />
        <ThresholdPair
          warnLabel="Shock Warning" critLabel="Shock Critical"
          warnDefault={3} critDefault={7} unit="g"
        />
        <ThresholdPair
          warnLabel="Battery Warning" critLabel="Battery Critical"
          warnDefault={30} critDefault={10} unit="%"
        />
      </Section>

      {/* Telemetry Configuration */}
      <Section icon={Activity} title="Telemetry Configuration">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Polling Interval (seconds)</label>
            <input type="number" className="input" defaultValue={5} min={1} max={60} />
          </div>
          <div>
            <label className="input-label">Data Retention (days)</label>
            <input type="number" className="input" defaultValue={90} min={7} max={365} />
          </div>
          <div>
            <label className="input-label">Chart Default Range</label>
            <select className="input">
              <option>Last 1 Hour</option>
              <option selected>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div>
            <label className="input-label">Sensor Resolution</label>
            <select className="input">
              <option>Low (1 sample/min)</option>
              <option selected>Medium (1 sample/30s)</option>
              <option>High (1 sample/10s)</option>
            </select>
          </div>
        </div>
        <SettingRow label="Live Telemetry Stream" description="Subscribe to WebSocket updates in real-time">
          <Toggle checked={true} />
        </SettingRow>
      </Section>

      {/* Map Settings */}
      <Section icon={Map} title="Map Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Default Map View</label>
            <select className="input">
              <option selected>India (National)</option>
              <option>Region</option>
              <option>Container</option>
            </select>
          </div>
          <div>
            <label className="input-label">Map Tile Provider</label>
            <select className="input">
              <option selected>CartoDB Dark</option>
              <option>OpenStreetMap</option>
            </select>
          </div>
        </div>
        <SettingRow label="Show Route History" description="Display dashed route polylines on map">
          <Toggle checked={true} />
        </SettingRow>
        <SettingRow label="Cluster Markers" description="Group nearby markers at low zoom levels">
          <Toggle checked={false} />
        </SettingRow>
      </Section>

      {/* System Preferences */}
      <Section icon={Monitor} title="System Preferences">
        <SettingRow label="Auto-refresh Dashboard" description="Automatically refresh KPI cards every 30s">
          <Toggle checked={true} />
        </SettingRow>
        <SettingRow label="Compact Table Rows" description="Reduce row height in container tables">
          <Toggle checked={false} />
        </SettingRow>
        <SettingRow label="24-hour Clock" description="Display timestamps in 24-hour format">
          <Toggle checked={true} />
        </SettingRow>
        <SettingRow label="Session Timeout (minutes)" description="">
          <input type="number" className="input w-20 text-right" defaultValue={30} min={5} max={120} />
        </SettingRow>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={14} /> Save Changes
        </button>
        {saved && (
          <span className="text-xs text-status-normal flex items-center gap-1.5 animate-fade-in">
            <span className="status-dot bg-status-normal" />
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
