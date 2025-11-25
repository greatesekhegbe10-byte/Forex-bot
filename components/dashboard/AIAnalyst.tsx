
import React, { useState } from 'react';
import { Bot, Loader2, Sparkles, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { MarketAnalysis, GeminiAnalysisResult } from '../../types';
import { generateMarketInsight } from '../../services/geminiService';
import { ToastType } from '../ui/Toast';

interface AIAnalystProps {
  analysis: MarketAnalysis;
  notify: (type: ToastType, title: string, message: string) => void;
  // Fix: API key is handled internally via process.env.API_KEY
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ analysis, notify }) => {
  const [insight, setInsight] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fix: Check process.env.API_KEY exclusively
      const hasKey = !!process.env.API_KEY && process.env.API_KEY.length > 0;
      setIsOfflineMode(!hasKey);

      const result = await generateMarketInsight(analysis);
      setInsight(result);
      notify('success', hasKey ? 'AI Analysis Complete' : 'Technical Report Generated', 'Insights updated based on current market structure.');
    } catch (err: any) {
      const msg = err.message || "Analysis unavailable.";
      setError(msg);
      notify('error', 'Analysis Failed', msg);
    } finally {
      setLoading(false);
    }
  };

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

      {!insight && !loading && !error && (
        <div className="text-center py-6 border-t border-[#27272a] mt-2">
          <p className="text-[#a1a1aa] mb-4 text-sm">
            Generate professional insights based on current market data.<br/>
          </p>
          <button
            onClick={handleAnalyze}
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

      {error && (
        <div className="bg-red-900/10 border border-red-900/30 rounded p-3 text-red-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
             <AlertTriangle size={16} />
             <span className="font-bold text-sm">Analysis Error</span>
          </div>
          <p className="text-xs opacity-80 mb-3">{error}</p>
          <button 
            onClick={handleAnalyze}
            className="text-xs bg-red-800/30 hover:bg-red-800/50 px-3 py-1 rounded border border-red-800/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-start border-b border-[#27272a] pb-3">
             <div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded font-bold mb-2 ${
                  insight.sentiment === 'Bullish' ? 'bg-green-900/30 text-green-400' :
                  insight.sentiment === 'Bearish' ? 'bg-red-900/30 text-red-400' : 
                  'bg-[#27272a] text-[#a1a1aa]'
                }`}>
                  {insight.sentiment.toUpperCase()}
                </span>
                <p className="text-[#d4d4d8] text-sm leading-relaxed">{insight.summary}</p>
             </div>
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
            onClick={handleAnalyze}
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] rounded transition-colors"
          >
            <RefreshCw size={12} /> Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};
