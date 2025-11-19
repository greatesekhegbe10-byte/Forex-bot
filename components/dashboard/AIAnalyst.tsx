import React, { useState } from 'react';
import { Bot, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { MarketAnalysis, GeminiAnalysisResult } from '../../types';
import { generateMarketInsight } from '../../services/geminiService';

interface AIAnalystProps {
  analysis: MarketAnalysis;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ analysis }) => {
  const [insight, setInsight] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMarketInsight(analysis);
      setInsight(result);
    } catch (err) {
      setError("Could not generate insight. Check API Key or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-slate-800 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Bot size={100} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
          <Sparkles size={24} />
        </div>
        <h3 className="text-lg font-bold text-white">Gemini AI Analyst</h3>
      </div>

      {!insight && !loading && (
        <div className="text-center py-6">
          <p className="text-slate-400 mb-4">
            Ask Gemini to analyze the current technical setup (RSI: {analysis.rsi.toFixed(1)}, Trend: {analysis.trend}) and provide actionable advice.
          </p>
          <button
            onClick={handleAnalyze}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <Bot size={18} />
            Analyze Market
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-indigo-300">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p>Gemini is thinking...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded p-4 text-red-200 flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div>
            <span className={`inline-block px-2 py-1 text-xs rounded font-bold mb-2 ${
              insight.sentiment === 'Bullish' ? 'bg-green-900 text-green-300' :
              insight.sentiment === 'Bearish' ? 'bg-red-900 text-red-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {insight.sentiment.toUpperCase()}
            </span>
            <p className="text-slate-200 leading-relaxed">{insight.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-3 rounded border border-indigo-500/20">
              <h4 className="text-xs text-indigo-300 font-semibold uppercase mb-2">Key Levels</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                {insight.keyLevels.map((level, i) => (
                  <li key={i}>{level}</li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-900/50 p-3 rounded border border-indigo-500/20">
              <h4 className="text-xs text-indigo-300 font-semibold uppercase mb-2">Actionable Advice</h4>
              <p className="text-sm text-slate-300">{insight.actionableAdvice}</p>
            </div>
          </div>
          
          <button 
            onClick={handleAnalyze}
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 underline"
          >
            Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};
