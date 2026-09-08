import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

/**
 * TelemetryLineChart — themed line chart for sensor data.
 * Reads CSS custom properties at render time so it responds
 * correctly to both dark and light themes.
 */
export default function TelemetryLineChart({
  data = [],
  label = 'Value',
  color = '#3b7dd8',
  unit = '',
  warnLevel,
  critLevel,
  height = 180,
}) {
  // Re-render when theme toggles
  const { isDark } = useTheme();

  // Read live CSS vars from the document root
  const css = (varName) =>
    getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

  const gridColor  = isDark ? 'rgba(36,48,71,0.5)' : 'rgba(180,196,216,0.5)';
  const tickColor  = css('--text-muted')  || '#4f6070';
  const bgCard     = css('--bg-card')     || '#1a2233';
  const bgBorder   = css('--bg-border')   || '#243047';
  const textSec    = css('--text-secondary') || '#8a9bb0';
  const textPri    = css('--text-primary')   || '#dde5f0';

  const annotations = {};
  if (warnLevel !== undefined) {
    annotations.warnLine = {
      type: 'line',
      yMin: warnLevel,
      yMax: warnLevel,
      borderColor: 'rgba(245,158,11,0.6)',
      borderWidth: 1,
      borderDash: [4, 4],
    };
  }
  if (critLevel !== undefined) {
    annotations.critLine = {
      type: 'line',
      yMin: critLevel,
      yMax: critLevel,
      borderColor: 'rgba(239,68,68,0.6)',
      borderWidth: 1,
      borderDash: [4, 4],
    };
  }

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label,
        data: data.map((d) => d.value),
        borderColor: color,
        backgroundColor: `${color}22`,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: bgCard,
        borderColor: bgBorder,
        borderWidth: 1,
        titleColor: textSec,
        bodyColor: textPri,
        padding: 8,
        callbacks: {
          label: (ctx) => `${ctx.parsed.y}${unit}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { size: 10, family: 'Inter' },
          maxTicksLimit: 8,
          maxRotation: 0,
        },
        border: { display: false },
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { size: 10, family: 'Inter' },
          callback: (v) => `${v}${unit}`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
