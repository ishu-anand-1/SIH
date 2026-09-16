import React, { useState, useEffect } from 'react';
import { Search, X, Box, FileText, ShieldAlert, FileCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUI();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!commandPaletteOpen) return null;

  const items = [
    { type: 'Products', title: 'FreshBite Premium Potato Chips', subtitle: 'PROD-FB-001 • Packaged Food', path: '/products/PROD-FB-001', icon: Box },
    { type: 'Products', title: 'HomeCare Active Clean Detergent', subtitle: 'PROD-HC-002 • Household Cleaning (Repeat Issues)', path: '/products/PROD-HC-002', icon: Box },
    { type: 'Inspections', title: 'INS-2026-00421 — FreshBite Chips', subtitle: 'Finalized • Compliant', path: '/inspections/INS-2026-00421', icon: FileCheck },
    { type: 'Inspections', title: 'INS-2026-00422 — HomeCare Detergent', subtitle: 'Completed • Potential Non-Compliance', path: '/inspections/INS-2026-00422', icon: ShieldAlert },
    { type: 'Rules', title: 'LMPC-6-NET-QTY — Net Quantity', subtitle: 'Version 2026.1 • Rule 6(1)(c)', path: '/rules', icon: FileText },
    { type: 'Rules', title: 'LMPC-8-MRP — Maximum Retail Price', subtitle: 'Version 2026.1 • Tax Statement', path: '/rules', icon: FileText },
    { type: 'Reports', title: 'Inspection Report #421', subtitle: 'PDF / JSON Export Ready', path: '/reports/INS-2026-00421', icon: FileCheck },
  ];

  const filtered = query.trim()
    ? items.filter(i => i.title.toLowerCase().includes(query.toLowerCase()) || i.subtitle.toLowerCase().includes(query.toLowerCase()))
    : items;

  const handleSelect = (path: string) => {
    setCommandPaletteOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-sidebar/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div 
        className="w-full max-w-2xl bg-surface rounded-modal border border-border shadow-modal overflow-hidden page-entry"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-border bg-surface-subtle">
          <Search className="w-5 h-5 text-text-muted mr-3" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search METROLOGYX (Products, Inspections, Rules, Reports)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full py-4 text-sm bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted"
          />
          <button 
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-border-subtle">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              No matching products, inspections, or rules found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-surface-subtle group-hover:bg-brand-blue/10 text-brand-blue transition-colors">
                      <IconComp className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary group-hover:text-brand-blue transition-colors">{item.title}</div>
                      <div className="text-xs text-text-muted">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted group-hover:text-brand-blue transition-colors">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-surface-subtle border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>Use <strong>↑↓</strong> to navigate, <strong>ESC</strong> to dismiss</span>
          <span className="font-mono">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};
