import React, { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { StrategyType, Candle, BacktestResult } from '../../types';
import { runBacktest } from '../../services/forexService';
import { Card } from '../ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BacktestPanelProps {
  data: Candle[];
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ data }) => {
  const [strategy, setStrategy] = useState<StrategyType>(StrategyType.COMBINED);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRun = () => {
    const res = runBacktest(data, strategy);
    setResult(res);
  };

  // Calculate cumulative equity for chart
  const equityCurve = result?.history.reduce((acc: any[], trade) => {
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : 10000;
    acc.push({
      time: trade.time,
      balance: prevBalance + trade.profit
    });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {[StrategyType.MA_CROSSOVER, StrategyType.RSI, StrategyType.COMBINED].map((s) => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                strategy === s 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button
          onClick={handleRun}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
        >
          <Play size={16} /> Run Simulation
        </button>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card title="Net Profit">
              <p className={`text-2xl font-bold ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${result.profit.toFixed(2)}
              </p>
            </Card>
            <Card title="Win Rate">
              <p className="text-2xl font-bold text-white">
                {result.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">{result.wins}W - {result.losses}L</p>
            </Card>
            <Card title="Max Drawdown">
              <p className="text-2xl font-bold text-red-400">
                {result.maxDrawdown.toFixed(2)}%
              </p>
            </Card>
            <Card title="Total Trades">
              <p className="text-2xl font-bold text-white">
                {result.totalTrades}
              </p>
            </Card>
          </div>

          <Card title="Equity Curve" className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} width={60} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(val: number) => [`$${val.toFixed(2)}`, 'Balance']}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Recent Trade Log">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Exit Price</th>
                    <th className="px-4 py-2 text-right">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {result.history.slice(-5).reverse().map((trade, i) => (
                    <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/20">
                      <td className="px-4 py-2">{new Date(trade.time).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          trade.type === 'BUY' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-4 py-2">{trade.price.toFixed(5)}</td>
                      <td className={`px-4 py-2 text-right font-mono ${
                        trade.profit > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${trade.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      
      {!result && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
          <RefreshCw size={48} className="mb-4 opacity-20" />
          <p>Select a strategy and run simulation to see performance metrics.</p>
        </div>
      )}
    </div>
  );
};
