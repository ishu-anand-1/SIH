import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, SearchCheck, Box, FileSpreadsheet, 
  ShieldAlert, BookOpen, ScrollText, Settings, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useUI } from '../../context/UIContext';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUI();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Inspections', path: '/inspections', icon: SearchCheck },
    { label: 'Products', path: '/products', icon: Box },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Enforcement', path: '/enforcement', icon: ShieldAlert },
    { label: 'Rules Engine', path: '/rules', icon: BookOpen },
    { label: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
    { label: 'eMaap Adapter', path: '/integrations/emaap', icon: Settings },
    { label: 'System Health', path: '/system-health', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 bg-navy-sidebar text-white flex flex-col transition-all duration-300 border-r border-navy-secondary/40 select-none ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-navy-secondary/40">
        <NavLink to="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-navy-secondary to-brand-blue flex items-center justify-center font-bold text-white shadow-sm shrink-0">
            MX
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-lg leading-none">
                METROLOGY<span className="text-brand-bright">X</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-mono mt-0.5">INSPECTION AI</span>
            </div>
          )}
        </NavLink>

        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-secondary/50 transition-colors"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <PanelLeft className="w-4 h-4" strokeWidth={1.8} /> : <PanelLeftClose className="w-4 h-4" strokeWidth={1.8} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'text-white bg-[#2F80ED]/14 border-l-2 border-brand-bright shadow-2xs'
                    : 'text-slate-300 hover:text-white hover:bg-navy-secondary/40'
                }`
              }
            >
              <IconComponent className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-white transition-colors" strokeWidth={1.8} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Authority Disclaimer */}
      {!sidebarCollapsed && (
        <div className="p-3 m-2 rounded-lg bg-navy-secondary/30 border border-navy-secondary/50 text-slate-400 text-xs leading-relaxed">
          <div className="font-semibold text-slate-200 mb-0.5">METROLOGYX v1.0</div>
          <p className="text-[11px] text-slate-400">Deterministic LMPC Rule Engine & AI Perception</p>
        </div>
      )}
    </aside>
  );
};
