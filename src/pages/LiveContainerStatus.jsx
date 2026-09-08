import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Thermometer, Droplets, Lock, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/ui/StatusBadge';
import { STATUS } from '../services/mockData';

const FILTERS = ['All', 'Normal', 'Warning', 'Critical', 'In Transit', 'Secured'];

function matchFilter(container, filter, query) {
  const q = query.toLowerCase();
  const idMatch = container.id.toLowerCase().includes(q) ||
                  container.location.name.toLowerCase().includes(q);
  if (!idMatch) return false;

  switch (filter) {
    case 'Normal':    return container.status === STATUS.NORMAL || container.status === STATUS.SECURED;
    case 'Warning':   return container.status === STATUS.WARNING;
    case 'Critical':  return container.status === STATUS.CRITICAL || container.status === STATUS.TAMPERED;
    case 'In Transit':return container.speed > 0;
    case 'Secured':   return container.lock === 'SECURED';
    default:          return true;
  }
}

export default function LiveContainerStatus() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState(1);

  const filtered = useMemo(() => {
    const list = state.containers.filter((c) => matchFilter(c, filter, query));
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [state.containers, filter, query, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(1); }
  };

  const SortTh = ({ colKey, children }) => (
    <th
      onClick={() => toggleSort(colKey)}
      className="cursor-pointer select-none hover:text-text-primary transition-colors"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortKey === colKey && (
          <span className="text-accent-blue">{sortDir === 1 ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="page-container">
      <div>
        <p className="text-xs text-text-secondary">Monitor all containers with real-time status filters</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            className="input pl-8"
            placeholder="Search container ID or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter size={13} className="text-text-muted mr-1" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'filter-tab-active' : 'filter-tab'}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-text-muted">
        Showing <span className="text-text-secondary font-medium">{filtered.length}</span> of {state.containers.length} containers
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh colKey="id">Container ID</SortTh>
                <SortTh colKey="status">Status</SortTh>
                <SortTh colKey="location">Location</SortTh>
                <SortTh colKey="temp"><Thermometer size={11} className="inline" /> Temp</SortTh>
                <SortTh colKey="humidity"><Droplets size={11} className="inline" /> Humidity</SortTh>
                <SortTh colKey="lock"><Lock size={11} className="inline" /> Lock</SortTh>
                <SortTh colKey="lastEvent">Last Event</SortTh>
                <SortTh colKey="updatedAgo"><Clock size={11} className="inline" /> Updated</SortTh>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/container/${c.id}`)}
                  className={
                    c.status === STATUS.CRITICAL || c.status === STATUS.TAMPERED
                      ? 'border-l-2 border-l-status-critical'
                      : c.status === STATUS.WARNING
                      ? 'border-l-2 border-l-status-warning'
                      : ''
                  }
                >
                  <td className="font-mono text-xs font-semibold text-accent-blue">{c.id}</td>
                  <td><StatusBadge status={c.status} size="xs" /></td>
                  <td>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <MapPin size={11} />
                      {c.location.name}
                    </div>
                  </td>
                  <td className={c.temp != null && c.temp > 28 ? 'text-status-warning' : ''}>
                    {c.temp != null ? `${c.temp}°C` : '—'}
                  </td>
                  <td className={c.humidity != null && c.humidity > 70 ? 'text-status-warning' : ''}>
                    {c.humidity != null ? `${c.humidity}%` : '—'}
                  </td>
                  <td>
                    <span className={c.lock === 'OPEN' ? 'text-status-critical font-semibold' : c.lock === 'SECURED' ? 'text-status-normal' : 'text-text-muted'}>
                      {c.lock}
                    </span>
                  </td>
                  <td className="text-text-secondary text-xs max-w-[180px] truncate">{c.lastEvent}</td>
                  <td className="text-text-muted text-xs">{c.updatedAgo}</td>
                  <td className="text-text-muted">
                    <ChevronRight size={14} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-text-muted py-8">
                    No containers match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
