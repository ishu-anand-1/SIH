import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Search, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Product } from '../types';

export const ProductRepository: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listProducts().then(setProducts).catch(console.warn);
  }, []);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-entry">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Product Repository</h1>
          <p className="text-xs text-text-muted mt-1">Intelligence database of registered commodities and violation history.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Filter products or brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-input border border-border bg-surface text-xs text-text-primary outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-xs font-semibold text-text-muted uppercase">
              <th className="py-3 px-4">Product ID</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Brand</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority Score</th>
              <th className="py-3 px-4">Repeat Findings</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-sm">
            {filtered.map(p => (
              <tr 
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="hover:bg-surface-hover/80 cursor-pointer transition-colors group"
              >
                <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-blue">{p.id}</td>
                <td className="py-3.5 px-4 font-semibold text-text-primary group-hover:text-brand-bright transition-colors">{p.name}</td>
                <td className="py-3.5 px-4 text-xs text-text-secondary">{p.brand}</td>
                <td className="py-3.5 px-4 text-xs text-text-muted">{p.category}</td>
                <td className="py-3.5 px-4 font-mono text-xs font-bold text-text-primary">
                  {p.priority_score.toFixed(1)} / 100
                </td>
                <td className="py-3.5 px-4">
                  {p.repeat_findings_count > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-dangerBg text-status-danger text-xs font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span>{p.repeat_findings_count} Repeat</span>
                    </span>
                  ) : (
                    <span className="text-xs text-status-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span>Clean</span>
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="text-xs font-semibold text-brand-blue group-hover:translate-x-0.5 inline-flex items-center gap-1 transition-transform">
                    <span>Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
