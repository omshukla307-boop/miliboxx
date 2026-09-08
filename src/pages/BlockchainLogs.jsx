import { useState } from 'react';
import { Database, Search, CheckCircle2, Clock, Link } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { blockchainLogs } from '../services/mockData';

export default function BlockchainLogs() {
  const [query, setQuery] = useState('');

  const filtered = blockchainLogs.filter((l) =>
    !query ||
    l.container.toLowerCase().includes(query.toLowerCase()) ||
    l.event.toLowerCase().includes(query.toLowerCase()) ||
    l.hash.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page-container">
      <p className="text-xs text-text-secondary">
        Immutable audit trail — all container events recorded on-chain for tamper-proof verification
      </p>

      {/* Blockchain status bar */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2.5">
          <Database size={15} className="text-accent-blue" />
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wider">Blockchain Status</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="status-dot bg-status-normal animate-pulse-dot" />
              <span className="text-xs font-semibold text-status-normal">Connected</span>
            </div>
          </div>
        </div>
        <div className="h-6 w-px bg-bg-border" />
        <div>
          <div className="text-2xs text-text-muted uppercase tracking-wider">Ledger Integrity</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 size={12} className="text-status-normal" />
            <span className="text-xs font-semibold text-status-normal">Verified</span>
          </div>
        </div>
        <div className="h-6 w-px bg-bg-border" />
        <div>
          <div className="text-2xs text-text-muted uppercase tracking-wider">Total Blocks</div>
          <div className="text-xs font-semibold text-text-primary mt-0.5">{blockchainLogs[0]?.block ?? '—'}</div>
        </div>
        <div className="h-6 w-px bg-bg-border" />
        <div>
          <div className="text-2xs text-text-muted uppercase tracking-wider">Last Sync</div>
          <div className="text-xs font-semibold text-text-primary mt-0.5">2 minutes ago</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          className="input pl-8"
          placeholder="Search logs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Log table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th><Link size={11} className="inline mr-1" />Block</th>
                <th><Clock size={11} className="inline mr-1" />Timestamp</th>
                <th>Container</th>
                <th>Event</th>
                <th>Transaction Hash</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs text-text-secondary font-medium">#{log.block}</td>
                  <td className="font-mono text-xs text-text-secondary">{log.timestamp}</td>
                  <td className="font-mono text-xs font-semibold text-accent-blue">{log.container}</td>
                  <td>
                    <span className="font-mono text-xs text-text-primary bg-bg-surface border border-bg-border px-2 py-0.5 rounded">
                      {log.event}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-text-muted tracking-wider">
                      {log.hash}
                    </span>
                  </td>
                  <td><StatusBadge status={log.verification} size="xs" /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-text-muted py-8">
                    No log entries match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-bg-border text-2xs text-text-muted">
          <span>Total Blocks: {blockchainLogs[0]?.block ?? '—'} · Showing {filtered.length} entries</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-status-normal" />
            Ledger Integrity Verified
          </span>
        </div>
      </div>
    </div>
  );
}
