import React from 'react';
import { Eye, FileText, ChevronRight } from 'lucide-react';
import { ComplianceFinding } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceBadge } from '../common/ConfidenceBadge';

interface ComplianceMatrixProps {
  findings: ComplianceFinding[];
  onSelectFinding: (finding: ComplianceFinding) => void;
}

export const ComplianceMatrix: React.FC<ComplianceMatrixProps> = ({ findings, onSelectFinding }) => {
  return (
    <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-subtle flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Compliance Matrix</h3>
          <p className="text-xs text-text-muted">Legal Metrology Packaged Commodities (LMPC 2026.1) statutory evaluation</p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-surface border border-border text-text-secondary">
          {findings.length} Requirements Evaluated
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-xs font-semibold text-text-muted uppercase">
              <th className="py-3 px-4">Requirement</th>
              <th className="py-3 px-4">Detected Value</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Rule</th>
              <th className="py-3 px-4 text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-sm">
            {findings.map((f) => (
              <tr
                key={f.id}
                onClick={() => onSelectFinding(f)}
                className="hover:bg-surface-hover/90 cursor-pointer transition-colors group"
              >
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-text-primary group-hover:text-brand-bright transition-colors">{f.rule_title}</div>
                  <div className="text-xs text-text-muted truncate max-w-xs">{f.requirement}</div>
                </td>
                <td className="py-3.5 px-4 font-mono text-xs font-medium text-text-primary">
                  {f.detected_value}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={f.status} size="sm" />
                </td>
                <td className="py-3.5 px-4">
                  <ConfidenceBadge confidence={f.confidence} showMeter={false} />
                </td>
                <td className="py-3.5 px-4 font-mono text-xs font-semibold text-brand-blue">
                  {f.rule_id}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-bright group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
