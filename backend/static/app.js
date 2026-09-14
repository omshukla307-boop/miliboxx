// Tactical Military Box IoT Command Center Client Application

const API_BASE = window.location.origin;

// State Management
let currentFilter = 'ALL';
let audioEnabled = true;
let lastAlertCount = 0;
let targetLat = 28.6139;
let targetLng = 77.2090;

// Sparkline Data Buffers
const tempHistory = [24.2, 24.5, 24.8, 25.1, 24.9, 25.3, 25.0];
const humidityHistory = [52.0, 51.5, 53.0, 52.4, 52.8, 53.2, 52.9];

// DOM Elements
const backendStatusChip = document.getElementById('backend-status-chip');
const valTemp = document.getElementById('val-temp');
const fillTemp = document.getElementById('fill-temp');
const tagTemp = document.getElementById('tag-temp');

const valHumidity = document.getElementById('val-humidity');
const fillHumidity = document.getElementById('fill-humidity');

const valVibration = document.getElementById('val-vibration');
const boxVibration = document.getElementById('box-vibration');
const tagVibration = document.getElementById('tag-vibration');

const valDoor = document.getElementById('val-door');
const boxDoor = document.getElementById('box-door');
const tagDoor = document.getElementById('tag-door');

const valBattery = document.getElementById('val-battery');
const fillBattery = document.getElementById('fill-battery');
const tagBattery = document.getElementById('tag-battery');

const valLat = document.getElementById('val-lat');
const valLng = document.getElementById('val-lng');

const simFeedback = document.getElementById('sim-feedback');
const btnSimNormal = document.getElementById('btn-sim-normal');
const btnSimAlert = document.getElementById('btn-sim-alert');
const btnRefresh = document.getElementById('btn-refresh');

const alertCountBadge = document.getElementById('alert-count');
const alertsFeed = document.getElementById('alerts-feed');
const auditFeed = document.getElementById('audit-feed');
const blockchainFeed = document.getElementById('blockchain-feed');
const deviceList = document.getElementById('device-list');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');

// Initialize Dashboard Application
document.addEventListener('DOMContentLoaded', () => {
  initRadarCanvas();
  initMapCanvas();
  initThemeSwitcher();
  
  checkBackendHealth();
  fetchLatestTelemetry();
  fetchAlerts();
  fetchAuditLogs();
  fetchDevices();
  fetchBlockchainHistory();

  // Setup periodic refresh
  setInterval(() => {
    fetchLatestTelemetry();
    fetchAlerts();
    fetchAuditLogs();
  }, 4000);

  // Event Listeners
  btnSimNormal.addEventListener('click', () => triggerSimulation(false));
  btnSimAlert.addEventListener('click', () => triggerSimulation(true));
  btnRefresh.addEventListener('click', () => {
    fetchLatestTelemetry();
    fetchAlerts();
    fetchAuditLogs();
    fetchDevices();
    fetchBlockchainHistory();
  });

  soundToggle.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    soundIcon.textContent = audioEnabled ? '🔊' : '🔇';
    soundToggle.style.opacity = audioEnabled ? '1' : '0.5';
  });

  // Filter tabs setup
  document.querySelectorAll('#alert-filter-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#alert-filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      fetchAlerts();
    });
  });
});

// Theme Switcher Logic
function initThemeSwitcher() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      const theme = e.target.getAttribute('data-theme');
      e.target.classList.add('active');
      document.body.className = `theme-${theme}`;
    });
  });
}

// Sparkline Render
function drawSparkline(canvasId, historyData, strokeColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 60;
  const h = canvas.height = 24;

  ctx.clearRect(0, 0, w, h);
  if (historyData.length < 2) return;

  const min = Math.min(...historyData);
  const max = Math.max(...historyData);
  const range = (max - min) || 1;

  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.8;

  historyData.forEach((val, index) => {
    const x = (index / (historyData.length - 1)) * w;
    const y = h - ((val - min) / range) * (h - 6) - 3;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// 1. Animated Radar Sweep Canvas
function initRadarCanvas() {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let angle = 0;

  function render() {
    ctx.clearRect(0, 0, 48, 48);
    const cx = 24, cy = 24, r = 22;

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();

    ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx, 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, cy); ctx.lineTo(46, cy); ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
    ctx.restore();

    angle += 0.05;
    requestAnimationFrame(render);
  }
  render();
}

// 2. Tactical Map Canvas
function initMapCanvas() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function renderMap() {
    const w = canvas.width = canvas.parentElement.clientWidth || 480;
    const h = canvas.height = 180;

    ctx.fillStyle = '#03060a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const beaconX = w * 0.5;
    const beaconY = h * 0.5;

    const t = (Date.now() % 2000) / 2000;
    ctx.strokeStyle = `rgba(0, 242, 254, ${1 - t})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(beaconX, beaconY, 10 + t * 25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(beaconX, beaconY, 6, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = '#ff2a6d';
    ctx.beginPath(); ctx.arc(beaconX, beaconY, 3.5, 0, Math.PI * 2); ctx.fill();

    requestAnimationFrame(renderMap);
  }
  renderMap();
}

// 3. Health Check
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await res.json();
      backendStatusChip.innerHTML = `<span class="indicator green"></span> BACKEND: ${data.status.toUpperCase()}`;
    } else {
      backendStatusChip.innerHTML = `<span class="indicator yellow"></span> BACKEND: DEGRADED`;
    }
  } catch (err) {
    backendStatusChip.innerHTML = `<span class="indicator red"></span> BACKEND: OFFLINE`;
  }
}

// 4. Fetch Telemetry
async function fetchLatestTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/telemetry/latest?limit=1`);
    if (!res.ok) return;
    const result = await res.json();
    if (result.data && result.data.length > 0) {
      updateTelemetryUI(result.data[0]);
    }
  } catch (err) {
    console.error('Telemetry fetch error:', err);
  }
}

function updateTelemetryUI(data) {
  // Temperature
  if (data.temperature !== undefined) {
    valTemp.textContent = `${data.temperature.toFixed(1)} °C`;
    const tempPct = Math.min(100, Math.max(0, (data.temperature / 60) * 100));
    fillTemp.style.width = `${tempPct}%`;

    tempHistory.push(data.temperature);
    if (tempHistory.length > 10) tempHistory.shift();
    drawSparkline('temp-sparkline', tempHistory, '#ffb703');

    if (data.temperature > 45) {
      valTemp.className = 'metric-value red-text';
      tagTemp.textContent = 'HIGH TEMP';
      tagTemp.className = 'status-tag tag-red';
    } else {
      valTemp.className = 'metric-value';
      tagTemp.textContent = 'NORMAL';
      tagTemp.className = 'status-tag tag-green';
    }
  }

  // Humidity
  if (data.humidity !== undefined) {
    valHumidity.textContent = `${data.humidity.toFixed(1)} %`;
    fillHumidity.style.width = `${data.humidity}%`;

    humidityHistory.push(data.humidity);
    if (humidityHistory.length > 10) humidityHistory.shift();
    drawSparkline('humidity-sparkline', humidityHistory, '#00f2fe');
  }

  // Vibration / Shock
  if (data.vibration_detected) {
    valVibration.textContent = '🚨 SHOCK DETECTED';
    valVibration.className = 'metric-value red-text';
    boxVibration.innerHTML = `<span class="sensor-dot dot-red"></span> VIBRATION ALARM ACTIVE`;
    tagVibration.textContent = 'TAMPERED';
    tagVibration.className = 'status-tag tag-red';
  } else {
    valVibration.textContent = 'CLEAR';
    valVibration.className = 'metric-value text-gradient-green';
    boxVibration.innerHTML = `<span class="sensor-dot dot-green"></span> NO IMPACT DETECTED`;
    tagVibration.textContent = 'STABLE';
    tagVibration.className = 'status-tag tag-green';
  }

  // Door Lock Status
  if (data.door_open) {
    valDoor.textContent = '🚨 UNLOCKED / OPEN';
    valDoor.className = 'metric-value red-text';
    boxDoor.innerHTML = `<span class="sensor-dot dot-red"></span> INTRUSION SWITCH OPEN`;
    tagDoor.textContent = 'BREACHED';
    tagDoor.className = 'status-tag tag-red';
  } else {
    valDoor.textContent = 'LOCKED';
    valDoor.className = 'metric-value text-gradient-green';
    boxDoor.innerHTML = `<span class="sensor-dot dot-green"></span> TAMPER SWITCH SEALED`;
    tagDoor.textContent = 'SECURE';
    tagDoor.className = 'status-tag tag-green';
  }

  // Battery
  if (data.battery_voltage !== undefined && data.battery_voltage !== null) {
    valBattery.textContent = `${data.battery_voltage.toFixed(2)} V`;
    const battPct = Math.min(100, Math.max(0, ((data.battery_voltage - 3.2) / 1.0) * 100));
    fillBattery.style.width = `${battPct}%`;
    tagBattery.textContent = `${Math.round(battPct)}%`;
  }

  // Geolocation
  if (data.latitude !== undefined && data.longitude !== undefined) {
    targetLat = data.latitude;
    targetLng = data.longitude;
    valLat.textContent = `${data.latitude.toFixed(4)}° N`;
    valLng.textContent = `${data.longitude.toFixed(4)}° E`;
  }
}

// 5. Fetch Security Alerts
async function fetchAlerts() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/alerts?unresolved_only=false&limit=20`);
    if (!res.ok) return;
    const result = await res.json();
    let alerts = result.alerts || [];

    if (alerts.length > lastAlertCount && lastAlertCount !== 0) {
      playSirenSound();
    }
    lastAlertCount = alerts.length;
    alertCountBadge.textContent = alerts.length;

    if (currentFilter === 'CRITICAL') {
      alerts = alerts.filter(a => a.severity === 'CRITICAL');
    } else if (currentFilter === 'WARNING') {
      alerts = alerts.filter(a => a.severity === 'WARNING');
    }

    if (alerts.length === 0) {
      alertsFeed.innerHTML = `<div class="empty-state">No security violations logged for selected filter.</div>`;
      return;
    }

    alertsFeed.innerHTML = alerts.map(a => {
      const severityClass = a.severity === 'CRITICAL' ? 'critical' : 'warning';
      const timeStr = new Date(a.created_at).toLocaleTimeString();
      return `
        <div class="feed-card ${severityClass}">
          <div><strong>[${a.alert_type}]</strong> ${a.message}</div>
          <div class="feed-meta">
            <span>Container: ${a.device_id}</span>
            <span>${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Alerts fetch error:', err);
  }
}

// 6. Fetch Security Audit Logs
async function fetchAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/security/audit-logs?limit=20`);
    if (!res.ok) return;
    const result = await res.json();
    const logs = result.audit_logs || [];

    if (logs.length === 0) {
      auditFeed.innerHTML = `<div class="empty-state">No audit logs recorded.</div>`;
      return;
    }

    auditFeed.innerHTML = logs.map(l => {
      const timeStr = new Date(l.timestamp).toLocaleTimeString();
      return `
        <div class="feed-card info">
          <div><strong>${l.event_type}</strong>: ${l.details}</div>
          <div class="feed-meta">
            <span>IP: ${l.ip_address || '127.0.0.1'}</span>
            <span>${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// 7. Fetch Device Inventory
async function fetchDevices() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/devices`);
    if (!res.ok) return;
    const result = await res.json();
    const devices = result.devices || [];

    if (devices.length === 0) {
      deviceList.innerHTML = `<div class="empty-state">No registered devices found.</div>`;
      return;
    }

    deviceList.innerHTML = devices.map(d => `
      <div class="feed-card info">
        <div><strong>BOX ID:</strong> ${d.device_id}</div>
        <div class="feed-meta">
          <span>Status: <strong style="color: var(--emerald-green);">${d.status.toUpperCase()}</strong></span>
          <span>Last Active: ${new Date(d.last_seen).toLocaleTimeString()}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Device list error:', err);
  }
}

// 8. Fetch Blockchain History
async function fetchBlockchainHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/blockchain/history?container_id=ESP32_MILITARY_BOX_01`);
    if (!res.ok) return;
    const result = await res.json();
    const records = result.records || [];

    if (records.length === 0) {
      blockchainFeed.innerHTML = `<div class="empty-state">No EVM blockchain events recorded yet.</div>`;
      return;
    }

    blockchainFeed.innerHTML = records.map(r => `
      <div class="feed-card info">
        <div><strong>[${r.event_type}]</strong> Tx: ${r.tx_hash ? r.tx_hash.substring(0, 18) + '...' : 'Signed Ledger Record'}</div>
        <div class="feed-meta">
          <span>Block: #${r.block_number || '178888'}</span>
          <span>Contract: ContainerAudit</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Blockchain history error:', err);
  }
}

// 9. Interactive Telemetry Simulator Action
async function triggerSimulation(triggerAlert = false) {
  simFeedback.innerHTML = `<span class="prompt">$</span> Transmitting HMAC-signed payload (Alert Mode = ${triggerAlert})...`;
  try {
    const res = await fetch(`${API_BASE}/api/v1/simulate?trigger_alert=${triggerAlert}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      simFeedback.innerHTML = `<span class="prompt">$</span> ✅ <strong>Success:</strong> ${data.message} | Signature: <code>${data.hmac_signature}</code>`;
      if (triggerAlert) playSirenSound();
      fetchLatestTelemetry();
      fetchAlerts();
      fetchAuditLogs();
      fetchBlockchainHistory();
    } else {
      simFeedback.innerHTML = `<span class="prompt">$</span> ❌ <strong>Failed:</strong> ${data.detail || 'Simulation error'}`;
    }
  } catch (err) {
    simFeedback.innerHTML = `<span class="prompt">$</span> ❌ <strong>Error:</strong> Could not connect to API server.`;
  }
}

// Web Audio API Synthesizer Siren Sound
function playSirenSound() {
  if (!audioEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Autoplay policy fallback
  }
}
