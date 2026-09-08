import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, ChevronRight, Sun, Moon, Wifi, WifiOff, SunMoon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const PAGE_META = {
  '/dashboard':     { title: 'Operational Dashboard',    bc: ['Dashboard'] },
  '/containers':    { title: 'Live Container Status',    bc: ['Dashboard', 'Containers'] },
  '/map':           { title: 'Live GPS Map',             bc: ['Dashboard', 'GPS Map'] },
  '/telemetry':     { title: 'Telemetry',                bc: ['Dashboard', 'Telemetry'] },
  '/shock-history': { title: 'Shock History',            bc: ['Dashboard', 'Shock History'] },
  '/tamper-history':{ title: 'Tamper History',           bc: ['Dashboard', 'Tamper History'] },
  '/blockchain':    { title: 'Blockchain Audit Logs',    bc: ['Dashboard', 'Blockchain'] },
  '/alerts':        { title: 'Alert Panel',              bc: ['Dashboard', 'Alerts'] },
  '/settings':      { title: 'System Settings',          bc: ['Dashboard', 'Settings'] },
  '/simulator':     { title: 'HITL Simulator',           bc: ['Dashboard', 'Simulator'] },
};

// Tooltip and icon for each theme state, cycling to the next
const THEME_NEXT = {
  dark:   { label: 'Switch to Hybrid (dark bg + light cards)', icon: SunMoon },
  hybrid: { label: 'Switch to Light mode',                     icon: Sun },
  light:  { label: 'Switch to Dark mode',                      icon: Moon },
};

export default function TopNav({ onMenuToggle }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { unreadCount, state } = useApp();
  const { user }  = useAuth();
  const { theme, cycle } = useTheme();

  const isContainer = location.pathname.startsWith('/container/');
  const containerId = isContainer ? location.pathname.split('/')[2] : null;

  let meta = PAGE_META[location.pathname];
  if (isContainer) meta = { title: `Container — ${containerId}`, bc: ['Dashboard', 'Containers', containerId] };
  if (!meta) meta = { title: 'MilliBox', bc: ['Dashboard'] };

  const bgStyle   = { backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-border)' };
  const textMuted = { color: 'var(--text-muted)' };
  const textSec   = { color: 'var(--text-secondary)' };
  const textPri   = { color: 'var(--text-primary)' };

  const nextTheme = THEME_NEXT[theme] ?? THEME_NEXT.dark;
  const ThemeIcon = nextTheme.icon;

  // Small theme badge label shown next to the button
  const THEME_BADGE = { dark: 'Dark', hybrid: 'Hybrid', light: 'Light' };

  return (
    <header className="h-12 flex items-center px-4 gap-3 flex-shrink-0 z-10" style={bgStyle}>
      {/* Mobile / sidebar menu toggle */}
      <button
        onClick={onMenuToggle}
        className="p-1 rounded transition-colors"
        style={textSec}
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Title + breadcrumb */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-2xs" style={textMuted}>
          {meta.bc.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={10} />}
              <span style={i === meta.bc.length - 1 ? textSec : textMuted}>{crumb}</span>
            </span>
          ))}
        </div>
        <h1 className="text-sm font-semibold leading-tight truncate" style={textPri}>{meta.title}</h1>
      </div>

      {/* Backend status chip */}
      <div
        className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-2xs font-medium"
        style={{
          background:   state.backendOnline ? 'var(--status-normal-bg)' : 'var(--bg-elevated)',
          border:       `1px solid ${state.backendOnline ? 'var(--status-normal-dim)' : 'var(--bg-border)'}`,
          color:        state.backendOnline ? 'var(--status-normal)' : 'var(--text-muted)',
        }}
      >
        {state.backendOnline
          ? <><Wifi size={11} /> API Live</>
          : <><WifiOff size={11} /> Demo Mode</>
        }
      </div>

      {/* System online chip */}
      <div
        className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded text-2xs font-semibold uppercase tracking-wider"
        style={{ background: 'var(--status-normal-bg)', border: '1px solid var(--status-normal-dim)', color: 'var(--status-normal)' }}
      >
        <span className="status-dot animate-pulse-dot" style={{ background: 'var(--status-normal)' }} />
        Online
      </div>

      {/* Theme toggle — 3-state cycler with badge */}
      <button
        id="theme-toggle"
        onClick={cycle}
        className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-2xs font-medium"
        style={{
          color:            'var(--text-secondary)',
          backgroundColor:  'var(--bg-elevated)',
          border:           '1px solid var(--bg-border)',
        }}
        aria-label={nextTheme.label}
        title={nextTheme.label}
      >
        <ThemeIcon size={13} />
        <span>{THEME_BADGE[theme]}</span>
      </button>

      {/* Mobile theme toggle (icon only) */}
      <button
        onClick={cycle}
        className="sm:hidden p-1.5 rounded"
        style={{ color: 'var(--text-secondary)' }}
        aria-label={nextTheme.label}
      >
        <ThemeIcon size={16} />
      </button>

      {/* Alert bell */}
      <button
        onClick={() => navigate('/alerts')}
        className="relative p-1.5 rounded transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label={`${unreadCount} unread alerts`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center
                       text-white text-2xs font-bold leading-none animate-pulse-dot"
            style={{ background: 'var(--status-critical)', fontSize: '0.6rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Officer badge */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="text-right">
          <div className="text-2xs font-medium leading-none" style={textPri}>{user?.name ?? 'Officer'}</div>
          <div className="text-2xs" style={textMuted}>{user?.id ?? 'OFF-001'}</div>
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--accent-blue-muted)',
            border: '1px solid color-mix(in srgb, var(--accent-blue) 30%, transparent)',
          }}
        >
          <span className="text-xs font-bold" style={{ color: 'var(--accent-blue)' }}>
            {user?.name?.charAt(0) ?? 'O'}
          </span>
        </div>
      </div>
    </header>
  );
}
