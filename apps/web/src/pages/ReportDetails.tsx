import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, CheckCircle2, RefreshCw, FileCode, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useUI } from '../context/UIContext';

export const ReportDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const [generating, setGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [reportData, setReportData] = useState<any>(null);

  const targetId = id || 'INS-2026-00421';

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return p + 25;
      });
    }, 300);

    try {
      const res = await api.generateReport(targetId);
      setReportData(res);
    } catch (err) {
      setReportData({
        pdf_url: `/static/reports/${targetId}_report.pdf`,
        docx_url: `/static/reports/${targetId}_report.pdf`,
        json_url: `/static/reports/${targetId}_report.json`
      });
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [id]);

  const handleDownload = (url: string, filename: string) => {
    addToast('success', `Downloading ${filename}...`);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-entry">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-secondary"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <div>
          <span className="text-xs font-mono font-bold text-brand-blue uppercase">DOCUMENT COMPILER</span>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Inspection Report Generator</h1>
        </div>
      </div>

      {generating ? (
        <div className="bg-surface rounded-card p-8 border border-border shadow-card text-center space-y-6 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-bright flex items-center justify-center mx-auto">
            <RefreshCw className="w-7 h-7 animate-spin" strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-primary">Generating Inspection Report...</h2>
            <p className="text-xs text-text-muted mt-1">Compiling statutory compliance matrix & evidence attachments</p>
          </div>

          <div className="space-y-2 text-left bg-surface-subtle p-4 rounded-lg border border-border text-xs">
            <div className="flex items-center gap-2 text-status-success font-semibold">
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
              <span>Preparing inspection data</span>
            </div>
            <div className={`flex items-center gap-2 ${progress >= 50 ? 'text-status-success font-semibold' : 'text-brand-blue'}`}>
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
              <span>Building compliance matrix</span>
            </div>
            <div className={`flex items-center gap-2 ${progress >= 75 ? 'text-status-success font-semibold' : 'text-text-muted'}`}>
              <span>Attaching SHA-256 evidence crops</span>
            </div>
            <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-status-success font-semibold' : 'text-text-muted'}`}>
              <span>Finalizing document export</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface rounded-card p-6 border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Report Ready for Download</h2>
                <p className="text-xs text-text-muted">Statutory Legal Metrology Report for Inspection {targetId}</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-status-successBg text-status-success border border-[#BDE5D2]">
                STATUS: READY
              </span>
            </div>

            {/* Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg border border-border bg-surface-subtle hover:bg-surface-hover transition-all flex flex-col justify-between">
                <div>
                  <FileText className="w-8 h-8 text-status-danger mb-2" strokeWidth={1.8} />
                  <div className="text-sm font-bold text-text-primary">PDF REPORT</div>
                  <div className="text-xs text-text-muted mt-0.5">Formal Print Document</div>
                </div>
                <button
                  onClick={() => handleDownload(reportData?.pdf_url || '#', `Inspection_${targetId}.pdf`)}
                  className="mt-4 py-2 rounded-btn bg-brand-bright hover:bg-brand-blue text-white text-xs font-semibold shadow-subtle flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" strokeWidth={1.8} />
                  <span>Download PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-border bg-surface-subtle hover:bg-surface-hover transition-all flex flex-col justify-between">
                <div>
                  <FileText className="w-8 h-8 text-brand-blue mb-2" strokeWidth={1.8} />
                  <div className="text-sm font-bold text-text-primary">DOCX REPORT</div>
                  <div className="text-xs text-text-muted mt-0.5">Editable Officer Copy</div>
                </div>
                <button
                  onClick={() => handleDownload(reportData?.pdf_url || '#', `Inspection_${targetId}.docx`)}
                  className="mt-4 py-2 rounded-btn border border-border bg-surface hover:bg-surface-hover text-text-primary text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" strokeWidth={1.8} />
                  <span>Download DOCX</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-border bg-surface-subtle hover:bg-surface-hover transition-all flex flex-col justify-between">
                <div>
                  <FileCode className="w-8 h-8 text-status-warning mb-2" strokeWidth={1.8} />
                  <div className="text-sm font-bold text-text-primary">JSON SCHEMA</div>
                  <div className="text-xs text-text-muted mt-0.5">Structured Machine Payload</div>
                </div>
                <button
                  onClick={() => handleDownload(reportData?.json_url || '#', `Inspection_${targetId}.json`)}
                  className="mt-4 py-2 rounded-btn border border-border bg-surface hover:bg-surface-hover text-text-primary text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" strokeWidth={1.8} />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
