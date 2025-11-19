import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { MarketAnalysis, Trend, SignalType } from '../../types';
import { Card } from '../ui/Card';

interface SignalPanelProps {
  analysis: MarketAnalysis;
}

export const SignalPanel: React.FC<SignalPanelProps> = ({ analysis }) => {
  const digits = analysis.pair.includes('JPY') ? 2 : 4;

  const getTrendIcon = (trend: Trend) => {
    switch (trend) {
      case Trend.BULLISH: return <TrendingUp className="text-green-500" size={32} />;
      case Trend.BEARISH: return <TrendingDown className="text-red-500" size={32} />;
      default: return <Minus className="text-slate-500" size={32} />;
    }
  };

  const getSignalColor = (signal: SignalType) => {
    switch (signal) {
      case SignalType.BUY: return 'bg-green-500 text-white';
      case SignalType.SELL: return 'bg-red-500 text-white';
      default: return 'bg-slate-600 text-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase font-bold">Current Trend</p>
          <h2 className={`text-2xl font-bold mt-1 ${
            analysis.trend === Trend.BULLISH ? 'text-green-400' : 
            analysis.trend === Trend.BEARISH ? 'text-red-400' : 'text-slate-200'
          }`}>
            {analysis.trend}
          </h2>
        </div>
        <div className="p-3 bg-slate-900 rounded-full">
          {getTrendIcon(analysis.trend)}
        </div>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase font-bold">Bot Signal</p>
          <div className={`inline-block px-3 py-1 rounded text-sm font-bold mt-1 ${getSignalColor(analysis.signal)}`}>
            {analysis.signal}
          </div>
          <p className="text-xs text-slate-500 mt-1">Confidence: {analysis.confidence}%</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-full text-blue-400">
          <Activity size={32} />
        </div>
      </Card>

      <Card>
        <p className="text-slate-400 text-xs uppercase font-bold mb-2">RSI (14)</p>
        <div className="flex items-end gap-2">
          <h2 className="text-3xl font-bold text-white">{analysis.rsi.toFixed(2)}</h2>
          <span className="text-xs mb-1 text-slate-400">
            {analysis.rsi > 70 ? 'Overbought' : analysis.rsi < 30 ? 'Oversold' : 'Neutral'}
          </span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full mt-2">
          <div 
            className={`h-full rounded-full ${
              analysis.rsi > 70 ? 'bg-red-500' : analysis.rsi < 30 ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${analysis.rsi}%` }}
          />
        </div>
      </Card>

      <Card>
        <p className="text-slate-400 text-xs uppercase font-bold mb-2">MA Cross Status</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-blue-400">MA 50</span>
            <span className="text-white">{analysis.ma50.toFixed(digits)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-purple-400">MA 200</span>
            <span className="text-white">{analysis.ma200.toFixed(digits)}</span>
          </div>
          <div className="text-xs text-right mt-2 text-slate-500">
             Distance: {Math.abs(analysis.ma50 - analysis.ma200).toFixed(digits + 1)}
          </div>
        </div>
      </Card>
    </div>
  );
};