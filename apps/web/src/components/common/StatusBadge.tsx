import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { ComplianceStatus } from '../../types';

interface StatusBadgeProps {
  status: ComplianceStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();
  
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />;
  let label = status;

  if (norm === 'COMPLIANT' || norm === 'PASS') {
    bg = 'bg-status-successBg text-status-success border-[#BDE5D2]';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-status-success" strokeWidth={1.8} />;
    label = 'COMPLIANT';
  } else if (norm === 'NEEDS_REVIEW' || norm === 'REVIEW') {
    bg = 'bg-status-warningBg text-status-warning border-[#FDE6B0]';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-status-warning" strokeWidth={1.8} />;
    label = 'NEEDS REVIEW';
  } else if (norm === 'POTENTIAL_NON_COMPLIANCE' || norm === 'NON_COMPLIANT' || norm === 'FAIL') {
    bg = 'bg-status-dangerBg text-status-danger border-[#F9C2C2]';
    icon = <AlertCircle className="w-3.5 h-3.5 text-status-danger" strokeWidth={1.8} />;
    label = 'POTENTIAL NON-COMPLIANCE';
  } else if (norm === 'FINALIZED') {
    bg = 'bg-[#0B1F33] text-white border-[#0B1F33]';
    icon = <ShieldCheck className="w-3.5 h-3.5 text-brand-bright" strokeWidth={1.8} />;
    label = 'FINALIZED';
  } else if (norm === 'PROCESSING') {
    bg = 'bg-status-infoBg text-status-info border-[#BCE0FD]';
    icon = <Clock className="w-3.5 h-3.5 text-status-info animate-spin" strokeWidth={1.8} />;
    label = 'PROCESSING';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : (size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium');

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${px} tracking-wide shadow-2xs transition-colors duration-150`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};
