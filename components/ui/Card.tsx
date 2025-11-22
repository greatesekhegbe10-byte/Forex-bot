import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, noPadding = false }) => {
  return (
    <div className={`relative group bg-[#0B0F19]/70 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      {/* Top Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      
      {/* Subtle Hover Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/20 via-transparent to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-xl" />
      
      <div className="relative h-full flex flex-col z-10">
        {(title || action) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
            {title && (
              <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                {title}
              </h3>
            )}
            {action && <div>{action}</div>}
          </div>
        )}
        <div className={noPadding ? '' : 'p-5'}>
          {children}
        </div>
      </div>
    </div>
  );
};