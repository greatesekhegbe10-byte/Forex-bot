import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 ${className}`}>
      {title && (
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};