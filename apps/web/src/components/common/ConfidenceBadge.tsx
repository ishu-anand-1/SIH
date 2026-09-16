import React from 'react';
import { Info } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number;
  label?: string;
  showMeter?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, label, showMeter = true }) => {
  const val = Math.round(confidence);
  
  let color = 'text-status-success bg-status-successBg border-[#BDE5D2]';
  let barColor = 'bg-status-success';
  if (val < 75) {
    color = 'text-status-warning bg-status-warningBg border-[#FDE6B0]';
    barColor = 'bg-status-warning';
  } else if (val < 85) {
    color = 'text-status-info bg-status-infoBg border-[#BCE0FD]';
    barColor = 'bg-status-info';
  }

  return (
    <div className="inline-flex items-center gap-2 group relative">
      <div className={`px-2 py-0.5 rounded border text-xs font-semibold font-mono ${color} flex items-center gap-1`}>
        {label && <span className="font-sans text-text-secondary text-[11px] mr-1">{label}:</span>}
        <span>{val}%</span>
      </div>
      
      {showMeter && (
        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(100, Math.max(5, val))}%` }}
          />
        </div>
      )}

      {/* Diagnostic Tooltip */}
      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block z-50 w-64 p-2.5 bg-navy-primary text-white text-xs rounded-lg shadow-modal border border-navy-secondary">
        <div className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-brand-bright shrink-0 mt-0.5" strokeWidth={1.8} />
          <p className="leading-tight text-slate-300">
            Confidence reflects system perception quality, not legal certainty.
          </p>
        </div>
      </div>
    </div>
  );
};
