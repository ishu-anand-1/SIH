import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" strokeWidth={1.8} />;
        let border = 'border-status-success/30 bg-status-successBg';

        if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-status-warning shrink-0" strokeWidth={1.8} />;
          border = 'border-status-warning/30 bg-status-warningBg';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-status-danger shrink-0" strokeWidth={1.8} />;
          border = 'border-status-danger/30 bg-status-dangerBg';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-status-info shrink-0" strokeWidth={1.8} />;
          border = 'border-status-info/30 bg-status-infoBg';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-card border shadow-card text-text-primary ${border} page-entry`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="text-xs font-semibold">{toast.text}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface/50 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
