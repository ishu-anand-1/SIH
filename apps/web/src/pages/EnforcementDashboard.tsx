import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { EnforcementItem } from '../types';

export const EnforcementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<EnforcementItem[]>([]);

  useEffect(() => {
    api.getEnforcementQueue().then(setItems).catch(console.warn);
  }, []);

  return (
    <div className="space-y-6 page-entry">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-status-danger mb-1">
          <ShieldAlert className="w-4 h-4 text-status-danger" strokeWidth={1.8} />
          <span>COMMAND CENTER</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Enforcement Intelligence</h1>
        <p className="text-xs text-text-muted mt-1">Evidence-backed prioritization across inspection activity.</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-card bg-surface border border-border shadow-subtle">
          <span className="text-xs text-text-muted">High Priority Queue</span>
          <div className="text-2xl font-bold font-mono text-status-danger mt-1">4 Products</div>
        </div>
        <div className="p-4 rounded-card bg-surface border border-border shadow-subtle">
          <span className="text-xs text-text-muted">Repeat Violation Rate</span>
          <div className="text-2xl font-bold font-mono text-status-warning mt-1">14.2%</div>
        </div>
        <div className="p-4 rounded-card bg-surface border border-border shadow-subtle">
          <span className="text-xs text-text-muted">Pending Field Verifications</span>
          <div className="text-2xl font-bold font-mono text-brand-blue mt-1">8 Records</div>
        </div>
        <div className="p-4 rounded-card bg-surface border border-border shadow-subtle">
          <span className="text-xs text-text-muted">Legal Notices Issued</span>
          <div className="text-2xl font-bold font-mono text-status-success mt-1">19 Issued</div>
        </div>
      </div>

      {/* Operational Priority Queue Table */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-subtle flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Operational Enforcement Queue</h3>
            <p className="text-xs text-text-muted">Deterministic prototype priority scoring based on repeat violations and non-compliance severity</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-xs font-semibold text-text-muted uppercase">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Violation Rationale</th>
                <th className="py-3 px-4">Prototype Priority Score</th>
                <th className="py-3 px-4">Repeat Issues</th>
                <th className="py-3 px-4 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {items.map(item => (
                <tr 
                  key={item.product_id}
                  onClick={() => navigate(`/products/${item.product_id}`)}
                  className="hover:bg-surface-hover/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-text-muted">#{item.rank}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.priority === 'HIGH' ? 'bg-status-dangerBg text-status-danger border border-[#F9C2C2]' : 'bg-status-warningBg text-status-warning'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary group-hover:text-brand-bright transition-colors">{item.product_name}</td>
                  <td className="py-3.5 px-4 text-xs text-text-secondary max-w-xs">{item.reason}</td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-status-danger">
                    {item.prototype_priority_score.toFixed(1)} / 100
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-xs text-text-primary">{item.repeat_findings} Violations</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-xs font-semibold text-brand-blue group-hover:translate-x-0.5 inline-flex items-center gap-1 transition-transform">
                      Action <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
