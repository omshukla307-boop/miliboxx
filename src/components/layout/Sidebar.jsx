import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, List, Package, MapPin, Activity,
  Zap, ShieldAlert, Database, Bell, Settings, Cpu,
  ChevronRight, Radio, LogOut, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/containers',          icon: List,            label: 'Live Container Status' },
  { to: '/container/ALPHA-001', icon: Package,         label: 'Container Details' },
  { to: '/map',                 icon: MapPin,          label: 'Live GPS Map' },
  { to: '/telemetry',           icon: Activity,        label: 'Telemetry' },
  { to: '/shock-history',       icon: Zap,             label: 'Shock History' },
  { to: '/tamper-history',      icon: ShieldAlert,     label: 'Tamper History' },
  { to: '/blockchain',          icon: Database,        label: 'Blockchain Logs' },
  { to: '/alerts',              icon: Bell,            label: 'Alerts' },
  { to: '/settings',            icon: Settings,        label: 'Settings' },
  { to: '/simulator',           icon: Cpu,             label: 'HITL Simulator' },
];

/**
 * Sidebar
 * Props:
 *   mobileOpen     — boolean: shows on mobile as an overlay
 *   onMobileClose  — close mobile overlay
 *   expanded       — boolean: desktop expanded (full) vs collapsed (icon-only)
 *   onToggleExpand — toggle desktop expand/collapse
 */
export default function Sidebar({ mobileOpen, onMobileClose, expanded = true, onToggleExpand }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarStyle = {
    backgroundColor: 'var(--bg-surface)',
    borderRight:     '1px solid var(--bg-border)',
  };

  // Width classes
  const widthClass = expanded ? 'w-56' : 'w-14';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={onMobileClose}
        />
      )}

      {/*
        On mobile: show/hide as overlay (always expanded when open)
        On desktop: always visible, width toggles between expanded/collapsed
      */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-30 flex flex-col flex-shrink-0
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0 w-56' : '-translate-x-full w-56'}
          lg:translate-x-0 lg:static lg:h-full
          ${!mobileOpen ? `lg:${widthClass}` : ''}
        `}
        style={sidebarStyle}
      >
        {/* ── Logo / Brand ──────────────────────── */}
        <div
          className="flex items-center flex-shrink-0 overflow-hidden"
          style={{
            padding: expanded ? '1rem' : '0.875rem',
            borderBottom: '1px solid var(--bg-border)',
            minHeight: 56,
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: expanded ? '0.625rem' : 0,
          }}
        >
          {/* Logo icon */}
          <div
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            <Radio size={14} className="text-white" />
          </div>

          {/* Text — hidden when collapsed */}
          {expanded && (
            <div className="min-w-0 overflow-hidden">
              <div className="text-sm font-bold tracking-wide truncate" style={{ color: 'var(--text-primary)' }}>
                MilliBox
              </div>
              <div className="text-2xs truncate" style={{ color: 'var(--text-muted)' }}>
                Supply Chain Monitor
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5"
          style={{ padding: expanded ? '0.75rem 0.5rem' : '0.75rem 0.375rem' }}
        >
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center rounded text-sm transition-colors group relative
                ${expanded ? 'gap-2.5 px-3 py-2' : 'justify-center px-0 py-2.5'}
                ${isActive ? 'nav-active' : 'nav-inactive'}`
              }
              title={!expanded ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={expanded ? 14 : 16}
                    style={{
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                      flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                  />

                  {/* Label — only when expanded */}
                  {expanded && (
                    <>
                      <span
                        className="truncate"
                        style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
                      >
                        {label}
                      </span>
                      {isActive && (
                        <ChevronRight
                          size={12}
                          className="ml-auto"
                          style={{ color: 'var(--accent-blue)', opacity: 0.6 }}
                        />
                      )}
                    </>
                  )}

                  {/* Collapsed tooltip on hover */}
                  {!expanded && (
                    <span
                      className="absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                                 pointer-events-none opacity-0 group-hover:opacity-100 z-50 transition-opacity"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border:          '1px solid var(--bg-border)',
                        color:           'var(--text-primary)',
                        boxShadow:       '0 4px 12px rgba(0,0,0,0.25)',
                      }}
                    >
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────── */}
        <div
          className="flex-shrink-0 space-y-2"
          style={{
            borderTop: '1px solid var(--bg-border)',
            padding: expanded ? '0.75rem' : '0.625rem 0.375rem',
          }}
        >
          {/* Expand/Collapse toggle button — desktop only */}
          <button
            onClick={onToggleExpand}
            className={`w-full hidden lg:flex items-center rounded px-2 py-1.5 text-2xs font-medium
                        transition-colors group ${expanded ? 'gap-2' : 'justify-center'}`}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded
              ? <><ChevronsLeft size={13} /><span>Collapse</span></>
              : <ChevronsRight size={13} />
            }
          </button>

          {/* System status (only when expanded) */}
          {expanded && (
            <div className="flex items-center gap-2 px-2">
              <span className="status-dot animate-pulse-dot" style={{ background: 'var(--status-normal)' }} />
              <span className="text-2xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                System Online
              </span>
            </div>
          )}

          {/* User + logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded px-2 py-1.5 transition-colors group
                        ${expanded ? 'gap-2' : 'justify-center'}`}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={expanded ? 'Logout' : `${user?.name ?? 'Officer'} — Logout`}
          >
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'var(--accent-blue-muted)',
                border:          '1px solid var(--accent-blue-dim)',
              }}
            >
              <span className="text-2xs font-bold" style={{ color: 'var(--accent-blue)' }}>
                {user?.name?.charAt(0) ?? 'O'}
              </span>
            </div>

            {/* Name + role (only when expanded) */}
            {expanded && (
              <>
                <div className="text-left min-w-0 flex-1">
                  <div className="text-2xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user?.name ?? 'Officer'}
                  </div>
                  <div className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                    {user?.role ?? 'Logistics Officer'}
                  </div>
                </div>
                <LogOut size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
