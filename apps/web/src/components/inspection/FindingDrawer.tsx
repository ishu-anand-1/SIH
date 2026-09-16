import React from 'react';
import { X, FileText, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { ComplianceFinding } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceBadge } from '../common/ConfidenceBadge';

interface FindingDrawerProps {
  finding: ComplianceFinding | null;
  onClose: () => void;
  onOpenRuleTrace: (finding: ComplianceFinding) => void;
}

export const FindingDrawer: React.FC<FindingDrawerProps> = ({ finding, onClose, onOpenRuleTrace }) => {
  if (!finding) return null;

  return (
    <div className="fixed inset-0 z-50 bg-navy-sidebar/40 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-lg bg-surface h-full border-l border-border shadow-modal flex flex-col page-entry"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-surface-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold text-brand-blue uppercase">{finding.rule_id}</span>
            <h2 className="text-lg font-bold text-text-primary mt-0.5">{finding.rule_title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Confidence Banner */}
          <div className="p-4 rounded-lg bg-surface-subtle border border-border flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted mb-1">Status Determination</div>
              <StatusBadge status={finding.status} size="lg" />
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Extraction Confidence</div>
              <ConfidenceBadge confidence={finding.confidence} />
            </div>
          </div>

          {/* Rationale */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">WHY THIS RESULT?</h3>
            <div className="p-3.5 rounded-lg bg-surface-hover/70 border border-border-subtle text-sm text-text-primary leading-relaxed">
              {finding.reason}
            </div>
          </div>

          {/* Requirement & Detected Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-border bg-surface">
              <div className="text-[11px] font-semibold text-text-muted uppercase">Statutory Requirement</div>
              <div className="text-xs font-medium text-text-primary mt-1">{finding.requirement}</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-surface">
              <div className="text-[11px] font-semibold text-text-muted uppercase">Detected OCR Value</div>
              <div className="text-xs font-mono font-bold text-brand-blue mt-1">{finding.detected_value}</div>
            </div>
          </div>

          {/* Evidence Crop Thumbnail */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">EVIDENCE CROP</h3>
            <div className="p-3 rounded-lg border border-border bg-slate-900 text-white flex items-center gap-3">
              <div className="w-16 h-12 bg-slate-800 rounded border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-brand-bright">
                CROP
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-brand-bright">{finding.detected_value}</div>
                <div className="text-[11px] text-slate-400">SHA-256 Verified • Bounding Box Region</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface-subtle flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-btn border border-border text-xs font-semibold text-text-secondary hover:bg-surface-hover"
          >
            Close
          </button>
          <button
            onClick={() => onOpenRuleTrace(finding)}
            className="px-5 py-2 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-xs shadow-subtle flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" strokeWidth={1.8} />
            <span>View Rule Trace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
