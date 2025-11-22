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
      <div className="bg-[#020617]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-xl z-50 min-w-[160px]">
        <p className="text-slate-500 mb-2 text-[10px] font-mono uppercase tracking-wide border-b border-white/5 pb-1">
            {new Date(label).toLocaleString()}
        </p>
        <div className="space-y-1 font-mono text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Close</span>
            <span className="text-white font-bold">{data.close.toFixed(digits + 1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-blue-400">MA 50</span>
            <span className="text-slate-300">{data.ma50?.toFixed(digits + 1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-purple-400">MA 200</span>
            <span className="text-slate-300">{data.ma200?.toFixed(digits + 1)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-2 border-t border-white/5 mt-1">
            <span className="text-yellow-500">RSI</span>
            <span className={`${data.rsi > 70 ? 'text-rose-400' : data.rsi < 30 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {data.rsi?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ForexChart: React.FC<ForexChartProps> = ({ data, pair }) => {
  const digits = pair.includes('JPY') ? 2 : 4;
  const chartData = data.slice(-100); 
  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));
  
  return (
    <div className="w-full h-[450px] md:h-[500px] flex flex-col gap-1">
      {/* Price Chart */}
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ right: 0, left: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="ma50Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
            <XAxis dataKey="time" hide />
            <YAxis 
              domain={[minPrice * 0.9995, maxPrice * 1.0005]} 
              orientation="right" 
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(val) => val.toFixed(digits)}
              width={60}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip digits={digits} />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            <Line 
              type="monotone" 
              dataKey="ma50" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={false} 
              name="MA 50"
              isAnimationActive={false}
              strokeOpacity={0.9}
            />
            <Line 
              type="monotone" 
              dataKey="ma200" 
              stroke="#a855f7" 
              strokeWidth={2} 
              dot={false} 
              name="MA 200"
              isAnimationActive={false}
              strokeOpacity={0.9}
            />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
              name="Price"
              isAnimationActive={false}
              strokeOpacity={1}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Chart */}
      <div className="h-[120px] border-t border-white/5 pt-2 bg-black/20">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ right: 0, left: 0 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
             <XAxis 
              dataKey="time" 
              tick={{ fill: '#475569', fontSize: 9 }}
              tickFormatter={(val) => new Date(val).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
             />
             <YAxis 
              domain={[0, 100]} 
              orientation="right" 
              ticks={[30, 50, 70]}
              tick={{ fill: '#475569', fontSize: 9 }}
              width={60}
              axisLine={false}
              tickLine={false}
             />
             <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.6} />
             <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
             <Line 
              type="monotone" 
              dataKey="rsi" 
              stroke="#eab308" 
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