import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.listAuditLogs().then(setLogs).catch(console.warn);
  }, []);

  return (
    <div className="space-y-6 page-entry">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Forensic Audit Logs</h1>
        <p className="text-xs text-text-muted mt-1">Immutable system event log recording all user actions, evidence hashes, and review determinations.</p>
      </div>

      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-xs font-semibold text-text-muted uppercase">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Object Reference</th>
              <th className="py-3 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-sm">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-surface-hover/80 transition-colors">
                <td className="py-3.5 px-4 font-mono text-xs text-text-muted">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-text-primary">
                  {log.user_email}
                </td>
                <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-blue">
                  {log.action}
                </td>
                <td className="py-3.5 px-4 font-mono text-xs font-semibold text-text-secondary">
                  {log.object_id}
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-text-muted">
                  {log.ip_address}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
