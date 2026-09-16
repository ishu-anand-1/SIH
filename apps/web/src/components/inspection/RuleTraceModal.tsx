import React from 'react';
import { X, ArrowDown, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, FileText } from 'lucide-react';
import { ComplianceFinding, RuleTraceNode } from '../../types';

interface RuleTraceModalProps {
  finding: ComplianceFinding | null;
  onClose: () => void;
}

export const RuleTraceModal: React.FC<RuleTraceModalProps> = ({ finding, onClose }) => {
  if (!finding) return null;

  const traceNodes: RuleTraceNode[] = finding.rule_trace_json || [
    { step: 'IMAGE', title: 'Front Package Image', detail: 'Package front label captured' },
    { step: 'DETECTED TEXT', title: 'Raw Text Extracted', detail: `"${finding.detected_value}"` },
    { step: 'NORMALIZED FIELD', title: 'Parsed Field Value', detail: `value = ${finding.detected_value}` },
    { step: 'APPLICABLE RULE', title: `Rule ${finding.rule_id}`, detail: 'LMPC Rules Version 2026.1' },
    { step: 'EVALUATION', title: 'Statutory Verification', detail: 'Conditions checked ✓' },
    { step: 'RESULT', title: 'Compliance Determination', detail: finding.status }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-navy-sidebar/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-xl bg-surface rounded-modal border border-border shadow-modal overflow-hidden page-entry max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-surface-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-brand-blue/10 text-brand-blue">
              <FileText className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-brand-blue uppercase">EXPLAINABLE AI UX</span>
              <h2 className="text-base font-bold text-text-primary">Signature Rule Trace — {finding.rule_id}</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Vertical Evidence Chain */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-text-muted">
            Vertical evidence trace detailing how AI perception and deterministic LMPC rules derived this finding.
          </p>

          <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-brand-blue/20">
            {traceNodes.map((node, idx) => {
              const isLast = idx === traceNodes.length - 1;
              return (
                <div key={idx} className="relative flex items-start gap-4 z-10 group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-subtle border ${
                    isLast 
                      ? (finding.status === 'COMPLIANT' ? 'bg-status-success text-white border-status-success' : 'bg-status-danger text-white border-status-danger')
                      : 'bg-surface text-brand-blue border-border group-hover:border-brand-blue transition-colors'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 p-3.5 rounded-lg bg-surface border border-border hover:border-brand-blue/40 shadow-2xs transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-brand-bright uppercase tracking-wider">{node.step}</span>
                      {isLast && (
                        <span className="text-xs font-bold text-status-success">{finding.status}</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-text-primary">{node.title}</div>
                    <div className="text-xs text-text-muted mt-0.5 font-mono">{node.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-subtle flex items-center justify-between">
          <span className="text-xs font-mono text-text-muted">Legal Metrology Version 2026.1</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-btn bg-navy-primary hover:bg-navy-secondary text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
