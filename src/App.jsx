import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';

import Login               from './pages/Login';
import Dashboard           from './pages/Dashboard';
import LiveContainerStatus from './pages/LiveContainerStatus';
import ContainerDetails    from './pages/ContainerDetails';
import LiveGPSMap          from './pages/LiveGPSMap';
import Telemetry           from './pages/Telemetry';
import ShockHistory        from './pages/ShockHistory';
import TamperHistory       from './pages/TamperHistory';
import BlockchainLogs      from './pages/BlockchainLogs';
import AlertPanel          from './pages/AlertPanel';
import Settings            from './pages/Settings';
import HitlSimulator       from './pages/HitlSimulator';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected — all wrapped in AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="dashboard"      element={<Dashboard />} />
        <Route path="containers"     element={<LiveContainerStatus />} />
        <Route path="container/:id"  element={<ContainerDetails />} />
        <Route path="map"            element={<LiveGPSMap />} />
        <Route path="telemetry"      element={<Telemetry />} />
        <Route path="shock-history"  element={<ShockHistory />} />
        <Route path="tamper-history" element={<TamperHistory />} />
        <Route path="blockchain"     element={<BlockchainLogs />} />
        <Route path="alerts"         element={<AlertPanel />} />
        <Route path="settings"       element={<Settings />} />
        <Route path="simulator"      element={<HitlSimulator />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
