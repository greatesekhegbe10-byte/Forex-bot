import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart2, Gauge } from 'lucide-react';
import { MarketAnalysis, Trend, SignalType } from '../../types';
import { Card } from '../ui/Card';

interface SignalPanelProps {
  analysis: MarketAnalysis;
}

export const SignalPanel: React.FC<SignalPanelProps> = ({ analysis }) => {
  const digits = analysis.pair.includes('JPY') ? 2 : 4;

  const getTrendColor = (trend: Trend) => {
    switch (trend) {
      case Trend.BULLISH: return 'text-emerald-400';
      case Trend.BEARISH: return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const getSignalBadge = (signal: SignalType) => {
    switch (signal) {
      case SignalType.BUY: 
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      case SignalType.SELL: 
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
      default: 
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Trend Card */}
      <Card className="hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Market Structure</p>
            <h2 className={`text-2xl font-bold mt-2 flex items-center gap-2 ${getTrendColor(analysis.trend)}`}>
              {analysis.trend}
              {analysis.trend === Trend.BULLISH && <TrendingUp size={20} />}
              {analysis.trend === Trend.BEARISH && <TrendingDown size={20} />}
              {analysis.trend === Trend.NEUTRAL && <Minus size={20} />}
            </h2>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <BarChart2 className="text-slate-400" size={18} />
          </div>
        </div>
        <div className="mt-5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${
            analysis.trend === Trend.BULLISH ? 'bg-emerald-500 w-3/4 shadow-[0_0_10px_#10b981]' : 
            analysis.trend === Trend.BEARISH ? 'bg-rose-500 w-3/4 shadow-[0_0_10px_#f43f5e]' : 'bg-slate-500 w-1/2'
          }`} />
        </div>
      </Card>

      {/* Signal Card */}
      <Card className="hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Algo Signal</p>
            <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold mt-2 tracking-wide ${getSignalBadge(analysis.signal)}`}>
              {analysis.signal}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Confidence</p>
            <p className="text-xl font-mono font-bold text-white mt-1">{analysis.confidence}%</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 flex items-center gap-1.5 opacity-70">
          <Activity size={10} /> MA Convergence • RSI Divergence
        </p>
      </Card>

      {/* RSI Card */}
      <Card className="hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">RSI (14)</p>
          <Gauge className="text-slate-400" size={18} />
        </div>
        <div className="flex items-end gap-2">
          <h2 className={`text-3xl font-mono font-bold ${
            analysis.rsi > 70 ? 'text-rose-400' : analysis.rsi < 30 ? 'text-emerald-400' : 'text-white'
          }`}>
            {analysis.rsi.toFixed(1)}
          </h2>
          <span className="text-[10px] mb-1.5 font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
            {analysis.rsi > 70 ? 'Overbought' : analysis.rsi < 30 ? 'Oversold' : 'Neutral'}
          </span>
        </div>
        <div className="relative w-full bg-slate-800 h-1 rounded-full mt-4">
          <div className="absolute left-[30%] h-full w-[1px] bg-slate-600" />
          <div className="absolute left-[70%] h-full w-[1px] bg-slate-600" />
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              analysis.rsi > 70 ? 'bg-rose-500' : 
              analysis.rsi < 30 ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${analysis.rsi}%` }}
          />
        </div>
      </Card>

      {/* Price Card */}
      <Card className="hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Live Price</p>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
             <span className="text-[9px] text-emerald-400 font-bold tracking-wide">LIVE</span>
          </div>
        </div>
        <h2 className="text-3xl font-mono font-bold text-white mt-1 tracking-tighter">
          {analysis.currentPrice.toFixed(digits)}
        </h2>
        <div className="mt-3 flex justify-between items-center text-xs border-t border-white/5 pt-3">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider">MA 50 Gap</span>
            <span className={`font-mono ${analysis.currentPrice > analysis.ma50 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(analysis.currentPrice - analysis.ma50).toFixed(digits)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider">MA 200 Gap</span>
            <span className={`font-mono ${analysis.currentPrice > analysis.ma200 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(analysis.currentPrice - analysis.ma200).toFixed(digits)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};