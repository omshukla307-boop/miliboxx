import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import TelemetryLineChart from '../components/charts/TelemetryLineChart';
import { generateTelemetry } from '../services/mockData';

const TIME_RANGES = ['Last 1 Hour', 'Last 6 Hours', 'Last 24 Hours', 'Last 7 Days'];
const SENSORS = ['All', 'Temperature', 'Humidity', 'Shock'];

export default function Telemetry() {
  const { state } = useApp();
  const { containers } = state;
  const [container, setContainer] = useState(() => containers[0]?.id || 'ALPHA-001');
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [sensor, setSensor] = useState('All');

  const hours = timeRange === 'Last 1 Hour' ? 1
    : timeRange === 'Last 6 Hours' ? 6
    : timeRange === 'Last 7 Days' ? 168
    : 24;

  const points = hours <= 1 ? 60 : hours <= 6 ? 72 : hours <= 24 ? 48 : 84;
  const telemetry = useMemo(() => generateTelemetry(container || containers[0]?.id, hours, points), [container, containers, hours, points]);

  const tempData  = telemetry.map((p) => ({ label: p.label, value: p.temp }));
  const humData   = telemetry.map((p) => ({ label: p.label, value: p.humidity }));
  const shockData = telemetry.map((p) => ({ label: p.label, value: p.shock }));

  const showTemp  = sensor === 'All' || sensor === 'Temperature';
  const showHum   = sensor === 'All' || sensor === 'Humidity';
  const showShock = sensor === 'All' || sensor === 'Shock';

  return (
    <div className="page-container">
      <p className="text-xs text-text-secondary">Sensor monitoring across time — select container, range, and sensor type</p>

      {/* Controls */}
      <div className="card px-4 py-3">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="input-label">Container</label>
            <select
              className="input w-44"
              value={container}
              onChange={(e) => setContainer(e.target.value)}
            >
              {containers.map((c) => (
                <option key={c.id} value={c.id}>{c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Time Range</label>
            <select
              className="input w-40"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {TIME_RANGES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Sensor</label>
            <div className="flex gap-1">
              {SENSORS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSensor(s)}
                  className={sensor === s ? 'filter-tab-active' : 'filter-tab'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-3">
        {showTemp && (
          <div className="card px-4 py-4">
            <div className="flex items-center justify-between mb-1">
              <div className="section-header">Temperature</div>
              <div className="flex items-center gap-4 text-2xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed border-status-warning" />
                  Warning 25°C
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed border-status-critical" />
                  Critical 30°C
                </span>
              </div>
            </div>
            <TelemetryLineChart
              data={tempData}
              label="Temperature"
              color="#3b7dd8"
              unit="°C"
              warnLevel={25}
              critLevel={30}
              height={200}
            />
          </div>
        )}

        {showHum && (
          <div className="card px-4 py-4">
            <div className="flex items-center justify-between mb-1">
              <div className="section-header">Humidity</div>
              <div className="flex items-center gap-4 text-2xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed border-status-warning" />
                  Warning 70%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed border-status-critical" />
                  Critical 85%
                </span>
              </div>
            </div>
            <TelemetryLineChart
              data={humData}
              label="Humidity"
              color="#22c55e"
              unit="%"
              warnLevel={70}
              critLevel={85}
              height={200}
            />
          </div>
        )}

        {showShock && (
          <div className="card px-4 py-4">
            <div className="flex items-center justify-between mb-1">
              <div className="section-header">Shock Intensity</div>
              <div className="flex items-center gap-4 text-2xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed border-status-warning" />
                  Warning 3.0g
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed border-status-critical" />
                  Critical 7.0g
                </span>
              </div>
            </div>
            <TelemetryLineChart
              data={shockData}
              label="Shock"
              color="#f59e0b"
              unit="g"
              warnLevel={3}
              critLevel={7}
              height={200}
            />
          </div>
        )}
      </div>
    </div>
  );
}
