import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function AppShell() {
  // Mobile overlay open/close
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop sidebar: collapsed = icon-only, expanded = full width
  // Persist in localStorage
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('millibox_sidebar');
    return saved !== 'collapsed'; // default: expanded
  });

  useEffect(() => {
    localStorage.setItem('millibox_sidebar', sidebarExpanded ? 'expanded' : 'collapsed');
  }, [sidebarExpanded]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg)', transition: 'background-color 0.25s ease' }}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        expanded={sidebarExpanded}
        onToggleExpand={() => setSidebarExpanded((v) => !v)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav
          onMenuToggle={() => setMobileOpen((v) => !v)}
          onSidebarToggle={() => setSidebarExpanded((v) => !v)}
          sidebarExpanded={sidebarExpanded}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
