import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number;
  trend?: string;
  comparison?: string;
  icon: LucideIcon;
  accentColor?: string;
  delayMs?: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  comparison = 'vs previous period',
  icon: Icon,
  accentColor = 'text-brand-blue',
  delayMs = 0
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 750; // 600-900ms ease-out
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(start + (end - start) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return (
    <div 
      className="bg-surface rounded-card p-5 border border-border hover:border-border-subtle hover:shadow-card transition-all duration-200 group relative overflow-hidden"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-muted tracking-wider uppercase">{title}</span>
        <div className={`p-2.5 rounded-lg bg-surface-subtle group-hover:bg-surface-hover transition-colors ${accentColor}`}>
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold tracking-tight text-text-primary font-mono">
          {displayValue}
        </span>
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-status-success">{trend}</span>
          <span className="text-text-muted">{comparison}</span>
        </div>
      )}
      
      {/* Subtle indicator bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
