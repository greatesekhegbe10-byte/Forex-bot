import React from 'react';
import { TrendingUp, TrendingDown, Minus, Gauge, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { MarketAnalysis, Trend, SignalType } from '../../types';
import { Card } from '../ui/Card';
import { getPairSettings } from '../../services/forexService';

interface SignalPanelProps {
  analysis: MarketAnalysis;
  beginnerMode: boolean;
}

export const SignalPanel: React.FC<SignalPanelProps> = ({ analysis, beginnerMode }) => {
  const { digits } = getPairSettings(analysis.pair);
  const isVolatile = analysis.marketCondition === 'VOLATILE';
  const isTrending = analysis.marketCondition === 'TRENDING';

  if (beginnerMode) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#27272a] border-none">
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-lg shrink-0 ${
              analysis.signal === SignalType.BUY ? 'bg-green-500/20 text-green-400' :
              analysis.signal === SignalType.SELL ? 'bg-red-500/20 text-red-400' :
              'bg-[#3f3f46] text-[#a1a1aa]'
            }`}>
              {analysis.signal === SignalType.BUY ? <TrendingUp size={32} /> :
               analysis.signal === SignalType.SELL ? <TrendingDown size={32} /> :
               <Minus size={32} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[#a1a1aa] text-xs font-bold uppercase">Current Strategy</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isVolatile ? 'bg-red-900 text-red-300' : 
                  isTrending ? 'bg-blue-900 text-blue-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {analysis.marketCondition} MODE
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {analysis.signal === SignalType.BUY ? "Buying Opportunity" :
                 analysis.signal === SignalType.SELL ? "Selling Opportunity" :
                 "Wait / Hold"}
              </h2>
              <p className="text-[#d4d4d8] text-sm">
                {analysis.signal === SignalType.BUY ? 
                  `The market for ${analysis.pair} shows strong bullish confluence.` :
                 analysis.signal === SignalType.SELL ? 
                  `The market for ${analysis.pair} indicates bearish momentum.` :
                  `Market is undecided or too volatile. Recommended to wait for a clearer signal.`}
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[#3f3f46] grid grid-cols-3 gap-4">
            <div>
               <span className="text-xs text-[#a1a1aa] block mb-1">Confidence</span>
               <div className="flex items-center gap-2">
                 <ShieldCheck size={16} className={analysis.confidence > 75 ? 'text-green-400' : analysis.confidence > 50 ? 'text-yellow-400' : 'text-red-400'} />
                 <span className="font-bold text-white">{analysis.confidence}%</span>
               </div>
            </div>
            <div>
               <span className="text-xs text-[#a1a1aa] block mb-1">Trend</span>
               <span className="font-medium text-white">
                 {analysis.trend === Trend.BULLISH ? 'Upwards' : 
                  analysis.trend === Trend.BEARISH ? 'Downwards' : 'Sideways'}
               </span>
            </div>
            <div>
               <span className="text-xs text-[#a1a1aa] block mb-1">Price</span>
               <span className="font-mono font-bold text-white">{analysis.currentPrice.toFixed(digits)}</span>
            </div>
          </div>
        </Card>

        <Card className="border-none bg-[#18181b]">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="text-[#a1a1aa]" size={18} />
            <h3 className="font-bold text-white text-sm">RSI Indicator</h3>
          </div>
          <div className="relative pt-2">
             <div className="flex justify-between text-xs text-[#71717a] mb-2">
               <span>0</span>
               <span>50</span>
               <span>100</span>
             </div>
             <div className="w-full h-3 bg-[#27272a] rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-500 ${
                   analysis.rsi > 70 ? 'bg-red-500' : analysis.rsi < 30 ? 'bg-green-500' : 'bg-blue-500'
                 }`}
                 style={{ width: `${analysis.rsi}%` }}
               />
             </div>
             <div className="mt-4 text-center">
               <span className="text-2xl font-bold text-white">{analysis.rsi.toFixed(0)}</span>
               <p className="text-xs text-[#a1a1aa] mt-1">
                 {analysis.rsi > 70 ? 'Overbought' : analysis.rsi < 30 ? 'Oversold' : 'Neutral'}
               </p>
             </div>
          </div>
        </Card>
      </div>
    );
  }

  // Advanced Mode
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Card noPadding className="bg-[#18181b]">
        <div className="p-4">
          <p className="text-[#71717a] text-xs font-medium uppercase mb-1">Condition</p>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg font-bold ${
              isVolatile ? 'text-red-400' : isTrending ? 'text-blue-400' : 'text-slate-400'
            }`}>
              {analysis.marketCondition}
            </h2>
            <Activity size={18} className="text-[#71717a]" />
          </div>
        </div>
      </Card>
      
      <Card noPadding className="bg-[#18181b]">
        <div className="p-4">
          <p className="text-[#71717a] text-xs font-medium uppercase mb-1">Trend</p>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-bold ${
              analysis.trend === Trend.BULLISH ? 'text-green-400' :
              analysis.trend === Trend.BEARISH ? 'text-red-400' : 'text-[#e4e4e7]'
            }`}>
              {analysis.trend}
            </h2>
          </div>
        </div>
      </Card>
      
      <Card noPadding className="bg-[#18181b]">
        <div className="p-4">
          <p className="text-[#71717a] text-xs font-medium uppercase mb-1">Signal</p>
          <h2 className={`text-xl font-bold ${
            analysis.signal === SignalType.BUY ? 'text-green-400' :
            analysis.signal === SignalType.SELL ? 'text-red-400' : 'text-[#e4e4e7]'
          }`}>
            {analysis.signal}
          </h2>
        </div>
      </Card>
      
      <Card noPadding className="bg-[#18181b]">
        <div className="p-4">
          <p className="text-[#71717a] text-xs font-medium uppercase mb-1">Oscillators</p>
          <div className="flex flex-col gap-0.5">
             <div className="flex justify-between text-xs">
                 <span className="text-[#a1a1aa]">RSI</span>
                 <span className="text-white font-mono">{analysis.rsi.toFixed(1)}</span>
             </div>
             <div className="flex justify-between text-xs">
                 <span className="text-[#a1a1aa]">MACD</span>
                 <span className={`font-mono ${analysis.macd && analysis.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.macd ? analysis.macd.histogram.toFixed(4) : '0.00'}
                 </span>
             </div>
          </div>
        </div>
      </Card>

      <Card noPadding className="bg-[#18181b]">
        <div className="p-4">
          <p className="text-[#71717a] text-xs font-medium uppercase mb-1">Confidence</p>
          <h2 className="text-xl font-bold text-white font-mono">{analysis.confidence}%</h2>
        </div>
      </Card>
    </div>
  );
};