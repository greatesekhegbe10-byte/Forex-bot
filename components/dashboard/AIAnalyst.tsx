
import React, { useState } from 'react';
import { Bot, Loader2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { MarketAnalysis, GeminiAnalysisResult } from '../../types';
import { generateMarketInsight } from '../../services/geminiService';
import { ToastType } from '../ui/Toast';

interface AIAnalystProps {
  analysis: MarketAnalysis;
  notify: (type: ToastType, title: string, message: string) => void;
  apiKey?: string;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ analysis, notify, apiKey }) => {
  const [insight, setInsight] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMarketInsight(analysis, apiKey);
      setInsight(result);
      notify('success', 'Analysis Complete', 'AI insights generated successfully.');
    } catch (err: any) {
      const msg = err.message || "AI Analysis unavailable.";
      setError(msg);
      notify('error', 'Analysis Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <Bot size={20} />
        </div>
        <h3 className="text-base font-bold text-white">Gemini AI Analyst</h3>
      </div>

      {!insight && !loading && !error && (
        <div className="text-center py-6 border-t border-slate-700/50 mt-2">
          <p className="text-slate-400 mb-4 text-sm">
            Generate professional insights based on current market data.<br/>
          </p>
          <button
            onClick={handleAnalyze}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold transition-colors flex items-center gap-2 mx-auto"
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
        <div className="bg-red-900/20 border border-red-900/50 rounded p-3 text-red-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
             <AlertTriangle size={16} />
             <span className="font-bold text-sm">Error</span>
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
          <div className="flex justify-between items-start border-b border-slate-700 pb-3">
             <div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded font-bold mb-2 ${
                  insight.sentiment === 'Bullish' ? 'bg-green-900/30 text-green-400' :
                  insight.sentiment === 'Bearish' ? 'bg-red-900/30 text-red-400' : 
                  'bg-slate-700 text-slate-300'
                }`}>
                  {insight.sentiment.toUpperCase()}
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{insight.summary}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Key Levels</h4>
              <div className="flex flex-wrap gap-2">
                {insight.keyLevels.map((level, i) => (
                  <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                    {level}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-indigo-900/10 p-3 rounded border border-indigo-900/30">
              <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Recommendation</h4>
              <p className="text-sm text-indigo-200 italic">"{insight.actionableAdvice}"</p>
            </div>
          </div>
          
          <button 
            onClick={handleAnalyze}
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <RefreshCw size={12} /> Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};
