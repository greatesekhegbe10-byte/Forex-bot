
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-xl border animate-in slide-in-from-right duration-300 ${
            t.type === 'success' ? 'bg-slate-900 border-green-500/50 text-green-100' :
            t.type === 'error' ? 'bg-slate-900 border-red-500/50 text-red-100' :
            t.type === 'warning' ? 'bg-slate-900 border-yellow-500/50 text-yellow-100' :
            'bg-slate-900 border-blue-500/50 text-blue-100'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
            {t.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
            {t.type === 'warning' && <AlertTriangle size={18} className="text-yellow-500" />}
            {t.type === 'info' && <Info size={18} className="text-blue-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold mb-0.5 leading-tight">{t.title}</h4>
            <p className="text-xs opacity-90 break-words leading-relaxed">{t.message}</p>
          </div>
          <button 
            onClick={() => onRemove(t.id)} 
            className="shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
