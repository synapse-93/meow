import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<Props> = ({ size = 'md', label }) => {
  const s = size === 'sm' ? 24 : size === 'lg' ? 64 : 40;
  const stroke = size === 'sm' ? 2 : 2.5;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg
        width={s}
        height={s}
        viewBox="0 0 50 50"
        className="animate-spin"
        style={{ animationDuration: '0.8s' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="rgba(6,182,212,0.15)"
          strokeWidth={stroke * 2}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#spinGrad)"
          strokeWidth={stroke * 2}
          strokeLinecap="round"
          strokeDasharray="100 31"
        />
        <defs>
          <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>
      {label && (
        <p className="text-sm text-slate-400 font-medium animate-pulse">{label}</p>
      )}
    </div>
  );
};
