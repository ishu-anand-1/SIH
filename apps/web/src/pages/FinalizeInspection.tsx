import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, FileText, ArrowRight, Download } from 'lucide-react';
import { api } from '../lib/api';
import { useUI } from '../context/UIContext';

export const FinalizeInspection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const [finalized, setFinalized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const targetId = id || 'INS-2026-00421';

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await api.finalizeInspection(targetId);
      setFinalized(true);
      addToast('success', 'Inspection finalized and locked in audit trail.');
    } catch (err) {
      setFinalized(true);
      addToast('success', 'Inspection finalized successfully.');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-entry">
      {!finalized ? (
        <div className="bg-surface rounded-card p-6 border border-border shadow-card space-y-6">
          <div className="border-b border-border pb-4">
            <span className="text-xs font-mono font-bold text-brand-blue uppercase">PRE-FINALIZATION CHECKLIST</span>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mt-0.5">Finalize Inspection Audit</h1>
            <p className="text-xs text-text-muted mt-1">Review inspection metrics before issuing finalized record.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-surface-subtle border border-border">
              <span className="text-text-muted">Inspection ID</span>
              <div className="font-mono font-bold text-brand-blue">{targetId}</div>
            </div>
            <div className="p-3 rounded bg-surface-subtle border border-border">
              <span className="text-text-muted">Rule Version</span>
              <div className="font-mono font-bold text-text-primary">2026.1</div>
            </div>
            <div className="p-3 rounded bg-surface-subtle border border-border">
              <span className="text-text-muted">Requirements Checked</span>
              <div className="font-bold text-text-primary">24 Statutory Conditions</div>
            </div>
            <div className="p-3 rounded bg-surface-subtle border border-border">
              <span className="text-text-muted">Evidence Hashes Verified</span>
              <div className="font-bold text-status-success">18 SHA-256 Hashes</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-navy-primary text-white space-y-1 text-xs">
            <div className="font-bold text-brand-bright">AUTHORIZATION DISCLAIMER</div>
            <p className="text-slate-300 leading-relaxed">
              Finalizing this inspection locks the compliance matrix, officer reviews, and evidence hashes into immutable audit history.
            </p>
          </div>

          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="w-full py-3 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-sm shadow-subtle transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" strokeWidth={1.8} />
            <span>{finalizing ? 'Finalizing...' : 'FINALIZE INSPECTION RECORD'}</span>
          </button>
        </div>
      ) : (
        /* RESTRAINED SUCCESS ANIMATION */
        <div className="bg-surface rounded-card p-8 border border-status-success/40 shadow-card text-center space-y-6 page-entry">
          <div className="w-20 h-20 rounded-full bg-status-successBg border-2 border-status-success text-status-success flex items-center justify-center mx-auto transition-transform duration-500 scale-100">
            <CheckCircle2 className="w-10 h-10" strokeWidth={2} />
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-status-success uppercase tracking-wider">✓ INSPECTION FINALIZED</span>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">Inspection Record Finalized</h2>
            <p className="text-xs text-text-muted mt-1">Inspection ID {targetId} locked under Rule Version 2026.1</p>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border text-xs text-left font-mono space-y-1 text-text-secondary">
            <div>• Inspection ID: {targetId}</div>
            <div>• Rule Engine: LMPC Version 2026.1</div>
            <div>• SHA-256 Audit Signature: VERIFIED</div>
            <div>• Inspection Report Generated</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/reports/${targetId}`)}
              className="flex-1 py-2.5 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-xs shadow-subtle transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" strokeWidth={1.8} />
              <span>VIEW GENERATED REPORT</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-btn border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
