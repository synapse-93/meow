import React from 'react';
import { cn } from '@/utils/cn';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  glow?: string;
  sub?: string;
  className?: string;
  badge?: string;
  badgeColor?: string;
}

export const MetricCard: React.FC<Props> = ({
  label, value, unit, icon, color = '#06b6d4', glow, sub, className, badge, badgeColor,
}) => {
  return (
    <div
      className={cn(
        'glass-card rounded-[18px] p-4 flex flex-col gap-2 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]',
        className
      )}
      style={glow ? { boxShadow: `0 0 24px ${glow}, 0 0 48px ${glow}33` } : undefined}
    >
      {/* Gradient accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${color}88, ${color}22)` }}
      />

      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</span>
        {badge && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${badgeColor || color}22`, color: badgeColor || color }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-end gap-1">
        {icon && <span className="mb-0.5 opacity-80">{icon}</span>}
        <span
          className="text-3xl font-bold tracking-tight leading-none"
          style={{ color }}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-slate-400 mb-0.5">{unit}</span>}
      </div>

      {sub && <p className="text-xs text-slate-500 leading-relaxed">{sub}</p>}
    </div>
  );
};
