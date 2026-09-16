import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, ShieldAlert, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Product } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) {
      api.getProductDetail(id).then(setProduct).catch(console.warn);
    }
  }, [id]);

  const mockTimeline = [
    { inspection_id: 'INS-2026-00422', date: 'SEP 2026', status: 'POTENTIAL_NON_COMPLIANCE', notes: 'MRP declaration missing statutory "Inclusive of all taxes" text.' },
    { inspection_id: 'INS-2026-00318', date: 'JUN 2026', status: 'POTENTIAL_NON_COMPLIANCE', notes: 'Net quantity unit font height below Rule 10 minimum scale.' },
    { inspection_id: 'INS-2026-00204', date: 'MAR 2026', status: 'NEEDS_REVIEW', notes: 'Manufacturer pin code address format review.' },
    { inspection_id: 'INS-2026-00101', date: 'JAN 2026', status: 'COMPLIANT', notes: 'Initial registration inspection passed.' },
  ];

  if (!product) {
    return <div className="p-8 text-center text-text-muted">Loading product intelligence profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto page-entry">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-secondary">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <div>
          <span className="text-xs font-mono font-bold text-brand-blue uppercase">{product.id}</span>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">{product.name}</h1>
        </div>
      </div>

      {/* Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-card bg-surface border border-border">
          <span className="text-xs text-text-muted">Brand & Category</span>
          <div className="text-sm font-bold text-text-primary mt-0.5">{product.brand}</div>
          <div className="text-xs text-text-secondary">{product.category}</div>
        </div>
        <div className="p-4 rounded-card bg-surface border border-border">
          <span className="text-xs text-text-muted">Prototype Priority Score</span>
          <div className="text-2xl font-bold font-mono text-status-danger mt-0.5">{product.priority_score.toFixed(1)}</div>
        </div>
        <div className="p-4 rounded-card bg-surface border border-border">
          <span className="text-xs text-text-muted">Repeat Findings</span>
          <div className="text-2xl font-bold text-text-primary mt-0.5">{product.repeat_findings_count} Historical</div>
        </div>
        <div className="p-4 rounded-card bg-surface border border-border">
          <span className="text-xs text-text-muted">Manufacturer</span>
          <div className="text-xs font-medium text-text-primary mt-1 line-clamp-2">{product.manufacturer}</div>
        </div>
      </div>

      {/* Vertical Timeline Design */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-card space-y-6">
        <div>
          <h3 className="text-base font-bold text-text-primary">Historical Inspection Timeline</h3>
          <p className="text-xs text-text-muted mt-0.5">Chronological record of statutory LMPC inspections for {product.name}</p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {mockTimeline.map((item, idx) => (
            <div key={idx} className="relative group cursor-pointer" onClick={() => navigate(`/inspections/${item.inspection_id}`)}>
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-surface transition-transform group-hover:scale-125 ${
                item.status === 'COMPLIANT' ? 'border-status-success' : (item.status === 'POTENTIAL_NON_COMPLIANCE' ? 'border-status-danger' : 'border-status-warning')
              }`} />

              <div className="p-4 rounded-lg bg-surface-subtle border border-border hover:border-brand-blue/50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-brand-blue">{item.date} • {item.inspection_id}</span>
                  <StatusBadge status={item.status} size="sm" />
                </div>
                <p className="text-xs text-text-primary font-medium">{item.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
