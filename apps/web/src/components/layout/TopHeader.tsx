import React from 'react';
import { Search, UserCheck, Bell, Sparkles } from 'lucide-react';
import { useLocation, NavLink } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

export const TopHeader: React.FC = () => {
  const location = useLocation();
  const { setCommandPaletteOpen, addToast } = useUI();
  const { user } = useAuth();

  // Dynamic Breadcrumb computation
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 0 
    ? pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
    : 'Dashboard';

  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span className="text-text-muted">Operations</span>
        <span className="text-text-disabled">/</span>
        <span className="font-semibold text-text-primary tracking-tight">{breadcrumb}</span>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search Command Launcher */}
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-input bg-surface-subtle border border-border text-xs text-text-muted hover:text-text-primary hover:border-brand-blue/40 transition-colors shadow-2xs"
        >
          <Search className="w-3.5 h-3.5" strokeWidth={1.8} />
          <span>Search METROLOGYX...</span>
          <kbd className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">Ctrl K</kbd>
        </button>

        {/* Live System Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-status-successBg border border-[#BDE5D2] text-xs font-medium text-status-success">
          <span className="w-2 h-2 rounded-full bg-status-success pulse-dot" />
          <span>System Operational</span>
        </div>

        {/* DEMO ENVIRONMENT Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.8} />
          <span>DEMO ENVIRONMENT</span>
        </div>

        {/* Notifications */}
        <button 
          onClick={() => addToast('info', 'No new system notifications.')}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-blue" />
        </button>

        <div className="h-4 w-px bg-border" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-navy-primary text-white flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'DI'}
          </div>
          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-xs font-semibold text-text-primary leading-none">{user?.name || 'Demo Inspector'}</span>
            <span className="text-[10px] text-text-muted leading-tight">{user?.badge_number || 'LM-OFFICER-402'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
