import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<Props> = ({ message, onDismiss }) => (
  <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-2xl p-4 text-sm text-red-300">
    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
    <p className="flex-1 leading-relaxed">{message}</p>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-500 hover:text-red-300 text-xs uppercase tracking-wider font-semibold shrink-0">
        Dismiss
      </button>
    )}
  </div>
);
