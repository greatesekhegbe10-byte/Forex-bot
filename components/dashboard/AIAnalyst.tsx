
import React, { useState } from 'react';
import { Bot, Loader2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { MarketAnalysis, GeminiAnalysisResult } from '../../types';
import { generateMarketInsight } from '../../services/geminiService';
import { ToastType } from '../ui/Toast';

interface AIAnalystProps {
  analysis: MarketAnalysis;
  notify: (type: ToastType, title: string, message: string) => void;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ analysis, notify }) => {
  const [insight, setInsight] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMarketInsight(analysis);
      setInsight(result);
      notify('success', 'Analysis Complete', 'AI insights generated successfully.');
    } catch (err: any) {
      const msg = "AI Analysis currently unavailable.";
      setError(msg);
      notify('error', 'Analysis Failed', err.message || msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-slate-800 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Bot size={100} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
          <Sparkles size={24} />
        </div>
        <h3 className="text-lg font-bold text-white">Gemini AI Analyst</h3>
      </div>

      {!insight && !loading && !error && (
        <div className="text-center py-6">
          <p className="text-slate-400 mb-4 text-sm">
            Generate professional insights based on current technicals:<br/>
            <span className="text-indigo-400">RSI: {analysis.rsi.toFixed(1)} • Trend: {analysis.trend}</span>
          </p>
          <button
            onClick={handleAnalyze}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-indigo-500/20"
          >
            <Bot size={18} />
            Analyze Market
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-indigo-300">
          <Loader2 className="animate-spin mb-3" size={32} />
          <p className="text-sm font-medium animate-pulse">Analyzing market structure...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
             <AlertTriangle size={20} />
             <span className="font-bold">Analysis Failed</span>
          </div>
          <p className="text-xs opacity-80 mb-3">{error}</p>
          <button 
            onClick={handleAnalyze}
            className="text-xs bg-red-900/40 hover:bg-red-900/60 px-3 py-1 rounded border border-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-start">
             <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-bold mb-2 border ${
                  insight.sentiment === 'Bullish' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                  insight.sentiment === 'Bearish' ? 'bg-red-900/30 border-red-500/50 text-red-400' : 
                  'bg-slate-700/30 border-slate-500/50 text-slate-300'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                     insight.sentiment === 'Bullish' ? 'bg-green-400' :
                     insight.sentiment === 'Bearish' ? 'bg-red-400' : 'bg-slate-400'
                  }`}></div>
                  {insight.sentiment.toUpperCase()}
                </span>
                <p className="text-slate-200 text-sm leading-relaxed font-medium">{insight.summary}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-900/60 p-3 rounded border border-slate-700/50">
              <h4 className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2">Key Levels</h4>
              <div className="flex flex-wrap gap-2">
                {insight.keyLevels.map((level, i) => (
                  <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                    {level}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-indigo-900/20 p-3 rounded border border-indigo-500/20">
              <h4 className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Actionable Advice</h4>
              <p className="text-sm text-indigo-100 italic">"{insight.actionableAdvice}"</p>
            </div>
          </div>
          
          <button 
            onClick={handleAnalyze}
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-800/50 rounded transition-colors"
          >
            <RefreshCw size={12} /> Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};
