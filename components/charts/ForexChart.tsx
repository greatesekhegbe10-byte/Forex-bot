import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Candle } from '../../types';

interface ForexChartProps {
  data: Candle[];
  pair: string;
}

const CustomTooltip = ({ active, payload, label, digits }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded shadow-xl text-xs backdrop-blur-sm z-50">
        <p className="text-slate-400 mb-1">{new Date(label).toLocaleString()}</p>
        <p className="text-white font-bold">Close: {data.close.toFixed(digits + 1)}</p>
        <p className="text-blue-400">MA50: {data.ma50?.toFixed(digits + 1)}</p>
        <p className="text-purple-400">MA200: {data.ma200?.toFixed(digits + 1)}</p>
        <p className="text-yellow-400">RSI: {data.rsi?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export const ForexChart: React.FC<ForexChartProps> = ({ data, pair }) => {
  // Determine decimal places based on pair (JPY uses 2, others 4)
  const digits = pair.includes('JPY') ? 2 : 4;

  // Optimize performance by taking a slice if data is too large
  const chartData = data.slice(-100); 
  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));
  
  return (
    <div className="w-full h-[400px] md:h-[500px] flex flex-col gap-4">
      {/* Price Chart */}
      <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={[minPrice * 0.999, maxPrice * 1.001]} 
              orientation="right" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(val) => val.toFixed(digits)}
              width={50}
            />
            <Tooltip content={<CustomTooltip digits={digits} />} />
            
            <Line 
              type="monotone" 
              dataKey="ma50" 
              stroke="#60a5fa" 
              strokeWidth={1.5} 
              dot={false} 
              name="MA 50"
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="ma200" 
              stroke="#c084fc" 
              strokeWidth={1.5} 
              dot={false} 
              name="MA 200"
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#22c55e" 
              strokeWidth={2} 
              dot={false}
              name="Price"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Chart */}
      <div className="h-[120px] md:h-[150px] bg-slate-800/50 rounded-lg border border-slate-700 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
             <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
             <XAxis 
              dataKey="time" 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(val) => new Date(val).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             />
             <YAxis 
              domain={[0, 100]} 
              orientation="right" 
              ticks={[30, 50, 70]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              width={50}
             />
             <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
             <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
             <Line 
              type="monotone" 
              dataKey="rsi" 
              stroke="#facc15" 
              strokeWidth={1.5} 
              dot={false}
              isAnimationActive={false}
             />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};