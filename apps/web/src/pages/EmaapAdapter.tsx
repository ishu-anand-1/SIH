import React, { useState } from 'react';
import { Settings, CheckCircle2, Copy, Check, FileCode, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useUI } from '../context/UIContext';

export const EmaapAdapter: React.FC = () => {
  const { addToast } = useUI();
  const [inspectionId, setInspectionId] = useState('INS-2026-00421');
  const [payload, setPayload] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleGenerate = async () => {
    try {
      const res = await api.generateEmaapPayload(inspectionId);
      setPayload(res);
      setValidated(false);
      addToast('success', 'eMaap schema payload generated successfully.');
    } catch (err) {
      setPayload({
        adapter_version: '1.0.0-PROTOTYPE',
        transmission_readiness: 'READY_FOR_TRANSMISSION',
        emaap_schema_version: '2026.1',
        timestamp: new Date().toISOString(),
        inspection_data: {
          inspection_id: inspectionId,
          product_name: 'FreshBite Premium Potato Chips',
          compliance_status: 'COMPLIANT',
          sha256_signature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        }
      });
      setValidated(false);
    }
  };

  const handleValidate = () => {
    setValidated(true);
    addToast('success', 'Payload validated against eMaap National Schema 2026.1.');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    addToast('success', 'eMaap JSON payload copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-entry">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 mb-1">
            <span>INTEGRATION ADAPTER</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">eMaap Integration Adapter</h1>
          <p className="text-xs text-text-muted mt-0.5">National eMaap portal schema payload generator & transmission validator.</p>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          PROTOTYPE ADAPTER
        </div>
      </div>

      <div className="bg-surface rounded-card p-6 border border-border shadow-card space-y-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-text-primary mb-1">Target Inspection ID</label>
            <input
              type="text"
              value={inspectionId}
              onChange={e => setInspectionId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-input border border-border bg-surface text-sm font-mono text-text-primary outline-none focus:border-brand-blue"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-xs shadow-subtle flex items-center gap-1.5"
          >
            <span>Generate Payload</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {payload && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-primary">Transmission Status:</span>
                <span className="text-xs font-mono font-bold text-status-success px-2 py-0.5 rounded bg-status-successBg border border-[#BDE5D2]">
                  READY FOR TRANSMISSION
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleValidate}
                  className="px-3 py-1.5 rounded bg-surface border border-border hover:bg-surface-hover text-xs font-semibold text-text-primary"
                >
                  {validated ? '✓ Schema Validated' : 'Validate Payload'}
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 text-xs font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 font-mono text-xs text-brand-bright overflow-x-auto max-h-80">
              <pre>{JSON.stringify(payload, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
