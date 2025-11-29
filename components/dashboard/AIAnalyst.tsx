import React from 'react';
import { Bot, Loader2, Sparkles, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { MarketAnalysis, GeminiAnalysisResult } from '../../types';
import { ToastType } from '../ui/Toast';

interface AIAnalystProps {
  analysis: MarketAnalysis;
  insight: GeminiAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
  notify: (type: ToastType, title: string, message: string) => void;
}

// --- Pattern Visualizer Component ---
const PatternVisualizer = ({ pattern, sentiment }: { pattern: string, sentiment: string }) => {
  const p = pattern.toLowerCase();
  
  // Helper for candle SVG
  const Candle = ({ x, y, h, type, wickH, opacity = 1 }: any) => {
    const color = type === 'bull' ? '#10b981' : '#ef4444';
    return (
      <g opacity={opacity}>
        <line x1={x + 4} y1={y - wickH} x2={x + 4} y2={y + h + wickH} stroke={color} strokeWidth="1.5" />
        <rect x={x} y={y} width="8" height={h} fill={color} rx="1" />
      </g>
    );
  };

  let content;
  
  if (p.includes('engulfing')) {
    const isBull = sentiment === 'Bullish' || p.includes('bull');
    content = (
      <>
        <Candle x={4} y={12} h={10} type={isBull ? 'bear' : 'bull'} wickH={3} />
        <Candle x={16} y={6} h={22} type={isBull ? 'bull' : 'bear'} wickH={4} />
      </>
    );
  } else if (p.includes('hammer') || p.includes('hanging')) {
    const isBull = sentiment === 'Bullish';
    content = (
      <>
        <Candle x={4} y={12} h={14} type={isBull ? 'bear' : 'bull'} wickH={3} />
        <g>
           <line x1={20} y1={14} x2={20} y2={28} stroke={isBull ? '#10b981' : '#ef4444'} strokeWidth="1.5" />
           <rect x={16} y={10} width="8" height={6} fill={isBull ? '#10b981' : '#ef4444'} rx="1" />
        </g>
      </>
    );
  } else if (p.includes('shooting') || p.includes('star') || p.includes('inverted')) {
    const isMorning = p.includes('morning');
    if (isMorning) {
        // Morning Star
        content = (
            <>
                <Candle x={2} y={6} h={16} type="bear" wickH={2} />
                <Candle x={13} y={24} h={6} type="bull" wickH={1} />
                <Candle x={24} y={8} h={14} type="bull" wickH={2} />
            </>
        )
    } else {
        // Shooting Star
        content = (
            <>
                <Candle x={4} y={14} h={12} type="bull" wickH={2} />
                <g>
                <line x1={20} y1={4} x2={20} y2={18} stroke="#ef4444" strokeWidth="1.5" />
                <rect x={16} y={18} width="8" height={6} fill="#ef4444" rx="1" />
                </g>
            </>
        );
    }
  } else if (p.includes('doji')) {
    content = (
       <>
        <Candle x={4} y={10} h={14} type={sentiment === 'Bullish' ? 'bull' : 'bear'} wickH={4} />
        <g>
           <line x1={20} y1={8} x2={20} y2={26} stroke="#e4e4e7" strokeWidth="1.5" />
           <line x1={16} y1={17} x2={24} y2={17} stroke="#e4e4e7" strokeWidth="2" />
        </g>
       </>
    );
  } else if (p.includes('cross')) {
     // Moving Average Cross Visualization
     content = sentiment === 'Bullish' ? (
        <g>
           <path d="M2 24 C 10 24, 15 15, 28 8" stroke="#10b981" strokeWidth="2" fill="none" />
           <path d="M2 12 C 10 12, 15 15, 28 20" stroke="#ef4444" strokeWidth="2" fill="none" />
           <circle cx="15" cy="15" r="3" fill="#fbbf24" fillOpacity="0.5" />
        </g>
     ) : (
        <g>
           <path d="M2 8 C 10 8, 15 15, 28 24" stroke="#ef4444" strokeWidth="2" fill="none" />
           <path d="M2 20 C 10 20, 15 15, 28 12" stroke="#10b981" strokeWidth="2" fill="none" />
           <circle cx="15" cy="15" r="3" fill="#fbbf24" fillOpacity="0.5" />
        </g>
     );
  } else if (p.includes('soldier') || p.includes('crows')) {
    const isBull = p.includes('soldier');
    content = isBull ? (
        <>
            <Candle x={2} y={18} h={8} type="bull" wickH={2} />
            <Candle x={12} y={12} h={10} type="bull" wickH={2} />
            <Candle x={22} y={6} h={12} type="bull" wickH={2} />
        </>
    ) : (
        <>
            <Candle x={2} y={6} h={8} type="bear" wickH={2} />
            <Candle x={12} y={12} h={10} type="bear" wickH={2} />
            <Candle x={22} y={18} h={12} type="bear" wickH={2} />
        </>
    );
  } else {
    // Generic Trends
    content = sentiment === 'Bullish' ? (
       <>
         <Candle x={2} y={18} h={8} type="bull" wickH={2} />
         <Candle x={12} y={12} h={12} type="bull" wickH={3} />
         <Candle x={22} y={6} h={16} type="bull" wickH={3} />
       </>
    ) : sentiment === 'Bearish' ? (
       <>
         <Candle x={2} y={6} h={14} type="bear" wickH={4} />
         <Candle x={12} y={14} h={10} type="bear" wickH={2} />
         <Candle x={22} y={18} h={8} type="bear" wickH={2} />
       </>
    ) : (
       <>
         <Candle x={2} y={12} h={10} type="bull" wickH={2} />
         <Candle x={12} y={10} h={14} type="bear" wickH={2} />
         <Candle x={22} y={12} h={10} type="bull" wickH={2} />
       </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-lg border border-slate-800 w-28 h-28 shrink-0 shadow-inner group transition-all hover:bg-slate-800/50 hover:scale-105">
      <svg width="32" height="32" viewBox="0 0 32 32" className="overflow-visible mb-3">
        {content}
      </svg>
      <span className="text-[10px] text-center text-slate-400 font-medium leading-tight line-clamp-2 group-hover:text-white transition-colors">{pattern || "Market Trend"}</span>
    </div>
  );
};

export const AIAnalyst: React.FC<AIAnalystProps> = ({ analysis, insight, loading, onAnalyze, notify }) => {
  const isOfflineMode = !process.env.API_KEY || process.env.API_KEY === '';

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Market Analyst</h3>
            {insight && (
              <span className="text-[10px] text-[#71717a] flex items-center gap-1">
                {isOfflineMode ? <WifiOff size={10} /> : <Wifi size={10} />}
                {isOfflineMode ? 'Local Engine' : 'Gemini Cloud'}
              </span>
            )}
          </div>
        </div>
      </div>

      {!insight && !loading && (
        <div className="text-center py-6 border-t border-[#27272a] mt-2">
          <p className="text-[#a1a1aa] mb-4 text-sm">
            Generate professional insights based on current market data.<br/>
          </p>
          <button
            onClick={onAnalyze}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-indigo-600/20"
          >
            <Sparkles size={16} />
            Generate Report
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-indigo-400">
          <Loader2 className="animate-spin mb-2" size={24} />
          <p className="text-sm">Analyzing market structure...</p>
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-start border-b border-[#27272a] pb-3 gap-4">
             <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                   <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded font-bold ${
                    insight.sentiment === 'Bullish' ? 'bg-green-900/30 text-green-400' :
                    insight.sentiment === 'Bearish' ? 'bg-red-900/30 text-red-400' : 
                    'bg-[#27272a] text-[#a1a1aa]'
                   }`}>
                     {insight.sentiment.toUpperCase()}
                   </span>
                </div>
                <p className="text-[#d4d4d8] text-sm leading-relaxed">{insight.summary}</p>
             </div>
             
             {/* Visual Demonstration of the Pattern */}
             <PatternVisualizer 
                pattern={insight.detectedPattern || (insight.sentiment + ' Trend')} 
                sentiment={insight.sentiment} 
             />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-[#09090b] p-3 rounded border border-[#27272a]">
              <h4 className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider mb-2">Key Levels</h4>
              <div className="flex flex-wrap gap-2">
                {insight.keyLevels.map((level, i) => (
                  <span key={i} className="text-xs bg-[#27272a] text-[#d4d4d8] px-2 py-1 rounded border border-[#3f3f46]">
                    {level}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-indigo-900/10 p-3 rounded border border-indigo-500/20">
              <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Recommendation</h4>
              <p className="text-sm text-indigo-200 italic">"{insight.actionableAdvice}"</p>
            </div>
          </div>
          
          <button 
            onClick={onAnalyze}
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] rounded transition-colors"
          >
            <RefreshCw size={12} /> Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};