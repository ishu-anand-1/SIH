import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, FileText, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Rule } from '../types';

export const RulesLibrary: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    api.listRules().then(setRules).catch(console.warn);
  }, []);

  return (
    <div className="space-y-6 page-entry">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Legal Rules Library</h1>
          <p className="text-xs text-text-muted mt-1">Deterministic statutory engine powered by Legal Metrology (Packaged Commodities) Rules.</p>
        </div>

        {/* Rule Version Timeline */}
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg border border-border text-xs font-mono">
          <span className="px-2 py-1 rounded text-text-muted">2025.1</span>
          <span className="px-2 py-1 rounded text-text-muted">2025.2</span>
          <span className="px-2.5 py-1 rounded bg-status-successBg text-status-success font-bold border border-[#BDE5D2]">
            2026.1 ACTIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map(r => (
          <div key={r.id} className="p-5 rounded-card bg-surface border border-border shadow-card hover:border-brand-blue/40 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-brand-blue">{r.id}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-status-successBg text-status-success border border-[#BDE5D2] font-semibold">
                ACTIVE • Version {r.current_version}
              </span>
            </div>

            <h3 className="text-base font-bold text-text-primary">{r.title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{r.description}</p>

            <div className="p-3 rounded bg-surface-subtle border border-border text-xs space-y-1 font-mono">
              <div className="text-text-muted">Source Reference:</div>
              <div className="text-brand-blue font-semibold">{r.source_reference}</div>
            </div>

            <div className="text-xs text-text-muted pt-1 flex items-center justify-between border-t border-border-subtle">
              <span>Category: <strong>{r.category}</strong></span>
              <span>Effective: <strong>{r.effective_date}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
