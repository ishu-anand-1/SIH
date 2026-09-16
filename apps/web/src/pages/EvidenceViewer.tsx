import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, FileText, ZoomIn, ZoomOut, Maximize2, 
  ArrowLeft, Copy, Check, Eye 
} from 'lucide-react';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { useUI } from '../context/UIContext';

export const EvidenceViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'annotated' | 'crop' | 'original'>('annotated');
  const [copied, setCopied] = useState(false);

  const sampleHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sampleHash);
    setCopied(true);
    addToast('success', 'SHA-256 hash copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-secondary"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-brand-blue font-bold">
              <span>EVIDENCE RECORD</span>
              <span>•</span>
              <span>INSPECTION {id || 'INS-2026-00421'}</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Forensic Evidence Inspection</h1>
          </div>
        </div>

        {/* SHA-256 Integrity Verification Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-successBg border border-[#BDE5D2] text-xs font-semibold text-status-success">
          <ShieldCheck className="w-4 h-4 text-status-success" strokeWidth={1.8} />
          <span>✓ Evidence integrity verified</span>
        </div>
      </div>

      {/* 65% / 35% Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 65% (8 COLS): High-Resolution Evidence Viewer Canvas */}
        <div className="lg:col-span-8 bg-surface rounded-card p-4 border border-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('annotated')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${viewMode === 'annotated' ? 'bg-brand-blue text-white' : 'bg-surface-subtle text-text-muted hover:text-text-primary'}`}
              >
                Annotated Overlay
              </button>
              <button
                onClick={() => setViewMode('crop')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${viewMode === 'crop' ? 'bg-brand-blue text-white' : 'bg-surface-subtle text-text-muted hover:text-text-primary'}`}
              >
                Region Crop
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${viewMode === 'original' ? 'bg-brand-blue text-white' : 'bg-surface-subtle text-text-muted hover:text-text-primary'}`}
              >
                View Original
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setZoomLevel(p => Math.min(p + 0.25, 2.5))} className="p-1.5 rounded hover:bg-surface-hover text-text-muted"><ZoomIn className="w-4 h-4" strokeWidth={1.8} /></button>
              <button onClick={() => setZoomLevel(p => Math.max(p - 0.25, 0.75))} className="p-1.5 rounded hover:bg-surface-hover text-text-muted"><ZoomOut className="w-4 h-4" strokeWidth={1.8} /></button>
              <button onClick={() => setZoomLevel(1)} className="p-1.5 rounded hover:bg-surface-hover text-text-muted"><Maximize2 className="w-4 h-4" strokeWidth={1.8} /></button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="relative w-full h-[450px] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
            <div className="relative w-full h-full flex items-center justify-center transition-transform duration-300" style={{ transform: `scale(${zoomLevel})` }}>
              <img 
                src="/static/samples/freshbite_front.jpg" 
                alt="Evidence Canvas" 
                className="max-h-full max-w-full object-contain opacity-90"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />

              {/* Bounding Box Overlay */}
              {viewMode !== 'original' && (
                <div className="absolute left-[14%] top-[64%] w-[26%] h-[7%] border-2 border-brand-bright bg-brand-bright/20 rounded shadow-lg flex items-center justify-center">
                  <span className="absolute -top-6 left-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-bright text-white shadow-2xs">
                    EVD-421-01 (96.2%)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 text-[11px] text-text-muted flex items-center justify-between">
            <span>High-resolution evidence region crop with vector bounding coordinates.</span>
            <span className="font-mono text-brand-blue font-semibold">1920 × 1080 px • 24-bit RGB</span>
          </div>
        </div>

        {/* RIGHT 35% (4 COLS): Evidence Metadata Panel */}
        <div className="lg:col-span-4 bg-surface rounded-card p-5 border border-border shadow-card space-y-5">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">EVIDENCE METADATA</h3>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted text-[11px] font-semibold block">EVIDENCE ID</span>
              <span className="font-mono font-bold text-brand-blue text-sm">EVD-421-01</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted text-[11px] font-semibold block">DETECTED DECLARATION TEXT</span>
              <span className="font-mono font-bold text-text-primary text-sm">"Net Wt. 100 g"</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted text-[11px] font-semibold block mb-1">OCR EXTRACTION CONFIDENCE</span>
              <ConfidenceBadge confidence={96.2} />
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted text-[11px] font-semibold block">APPLICABLE STATUTORY RULE</span>
              <span className="font-mono font-bold text-brand-blue">LMPC-6-NET-QTY</span>
              <p className="text-[11px] text-text-secondary mt-1">Rule 6(1)(c) Net Quantity Declaration</p>
            </div>

            {/* SHA-256 Hash Card */}
            <div className="p-3 rounded-lg bg-navy-primary text-white border border-navy-secondary space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                <span>CRYPTOGRAPHIC SHA-256 HASH</span>
                <button onClick={handleCopyHash} className="p-1 text-brand-bright hover:text-white transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="font-mono text-[11px] text-brand-bright break-all">
                {sampleHash}
              </div>
              <div className="text-[10px] text-slate-400">
                Timestamp: 2026-09-15 08:30:00 UTC
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
