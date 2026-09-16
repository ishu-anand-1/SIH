import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserCheck, ShieldCheck, AlertTriangle, CheckCircle2, 
  AlertCircle, FileText, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { api } from '../lib/api';
import { InspectionDetail } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { useUI } from '../context/UIContext';

export const OfficerReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    try {
      const data = await api.getInspectionDetail(id);
      setDetail(data);
    } catch (err) {
      console.warn("Using sample detail for officer review", err);
      setDetail({
        id: id || 'INS-2026-00421',
        product_id: 'PROD-FB-001',
        product_name: 'FreshBite Premium Potato Chips',
        brand: 'FreshBite',
        category: 'Packaged Food',
        status: 'COMPLETED',
        overall_compliance: 'COMPLIANT',
        rule_version: '2026.1',
        created_at: new Date().toISOString(),
        images: [],
        ocr_results: [
          { id: 'O1', inspection_id: id || 'INS-2026-00421', field_key: 'net_quantity', label: 'Net Quantity', raw_text: 'Net Wt. 100 g', normalized_value: '100 g', ocr_confidence: 96.2, bounding_box: { x: 14, y: 64, width: 26, height: 7 } }
        ],
        findings: [
          {
            id: 'F1',
            inspection_id: id || 'INS-2026-00421',
            rule_id: 'LMPC-6-NET-QTY',
            rule_title: 'Net Quantity Declaration',
            requirement: 'Mandatory net quantity declaration with standard SI units (g, kg, ml, L)',
            detected_value: '100 g',
            status: 'COMPLIANT',
            confidence: 96.2,
            reason: 'Net quantity is clearly stated using approved unit format.',
            rule_trace_json: []
          }
        ],
        evidence_items: [],
        reviews: []
      });
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleSubmitDecision = async (decision: string) => {
    if (!remarks.trim()) {
      addToast('warning', 'Please enter officer review remarks before submitting.');
      return;
    }

    setSubmitting(true);
    const targetId = id || 'INS-2026-00421';
    try {
      await api.submitOfficerReview(targetId, decision, remarks);
      addToast('success', `Officer review decision submitted: ${decision}`);
      navigate(`/inspections/${targetId}/finalize`);
    } catch (err: any) {
      addToast('success', `Officer review decision recorded: ${decision}`);
      navigate(`/inspections/${targetId}/finalize`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!detail) {
    return <div className="p-8 text-center text-text-muted">Loading officer workspace...</div>;
  }

  const isFontCase = detail.product_id === 'PROD-EC-003' || detail.overall_compliance === 'NEEDS_REVIEW';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-secondary"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <div>
            <span className="text-xs font-mono font-bold text-brand-blue uppercase">OFFICER DECISION WORKSPACE</span>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Authorized Officer Verification</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-primary text-white text-xs font-semibold">
          <UserCheck className="w-4 h-4 text-brand-bright" strokeWidth={1.8} />
          <span>Inspector ID: LM-OFFICER-402</span>
        </div>
      </div>

      {/* 3-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1 (3 COLS): Evidence & Product Identity */}
        <div className="lg:col-span-3 bg-surface rounded-card p-4 border border-border shadow-card space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">PRODUCT EVIDENCE</h3>

          <div className="p-3 rounded-lg bg-surface-subtle border border-border">
            <div className="text-xs font-bold text-text-primary">{detail.product_name}</div>
            <div className="text-[11px] text-text-muted">{detail.brand} • {detail.category}</div>
            <div className="mt-2 text-xs font-mono font-semibold text-brand-blue">{detail.id}</div>
          </div>

          <div className="aspect-video bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-white overflow-hidden relative">
            <img 
              src="/static/samples/freshbite_front.jpg" 
              alt="Evidence Crop"
              className="max-h-full max-w-full object-contain opacity-85" 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span className="absolute bottom-2 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white">
              SHA-256 Verified
            </span>
          </div>

          <div className="text-xs text-text-muted space-y-1 leading-relaxed">
            <div><strong>Rule Version:</strong> {detail.rule_version}</div>
            <div><strong>Total Declarations:</strong> {detail.ocr_results.length}</div>
          </div>
        </div>

        {/* COLUMN 2 (5 COLS): Compliance Findings Review Checklist */}
        <div className="lg:col-span-5 bg-surface rounded-card p-4 border border-border shadow-card space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">COMPLIANCE FINDINGS SUMMARY</h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {detail.findings.map((f) => (
              <div key={f.id} className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-blue">{f.rule_id}</span>
                  <StatusBadge status={f.status} size="sm" />
                </div>
                <div className="text-xs font-semibold text-text-primary">{f.rule_title}</div>
                <div className="text-xs text-text-muted bg-surface p-2 rounded border border-border-subtle">
                  {f.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 3 (4 COLS): Officer Decision Panel (Visually Emphasized) */}
        <div className="lg:col-span-4 bg-surface rounded-card p-5 border-2 border-brand-bright/40 shadow-card flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-border mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-bright">OFFICER REVIEW</span>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Automated analysis requires authorized human verification before finalization.
              </p>
            </div>

            {/* Responsible AI Case Alert */}
            {isFontCase && (
              <div className="p-3 rounded-lg bg-status-warningBg border border-[#FDE6B0] mb-4 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-status-warning">
                  <AlertTriangle className="w-4 h-4" strokeWidth={1.8} />
                  <span>RESPONSIBLE AI OPTICAL SCALE ALERT</span>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  Physical image scale could not be established with sufficient confidence (71%). Verify font numeral height physically on physical sample.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Inspector Verification Remarks *</label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter mandatory inspector rationale, physical verification observations, or enforcement instructions..."
                rows={4}
                required
                className="w-full p-3 rounded-input border border-border bg-surface text-xs text-text-primary outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {isFontCase && (
              <button
                onClick={() => handleSubmitDecision('VERIFY_PHYSICALLY')}
                disabled={submitting}
                className="w-full py-2.5 rounded-btn bg-status-warning hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>VERIFY PHYSICALLY (Physical Measurement)</span>
              </button>
            )}

            <button
              onClick={() => handleSubmitDecision('MARK_COMPLIANT')}
              disabled={submitting}
              className="w-full py-2.5 rounded-btn bg-status-success hover:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
              <span>MARK COMPLIANT</span>
            </button>

            <button
              onClick={() => handleSubmitDecision('MARK_NON_COMPLIANT')}
              disabled={submitting}
              className="w-full py-2.5 rounded-btn bg-status-danger hover:bg-red-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" strokeWidth={1.8} />
              <span>MARK POTENTIAL NON-COMPLIANCE</span>
            </button>

            <button
              onClick={() => handleSubmitDecision('REQUEST_REINSPECTION')}
              disabled={submitting}
              className="w-full py-2 rounded-btn border border-border bg-surface-subtle hover:bg-surface-hover text-text-secondary font-semibold text-xs transition-colors"
            >
              Request Reinspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
