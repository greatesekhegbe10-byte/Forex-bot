import React, { useEffect, useState, useMemo } from 'react';
import { Activity, RefreshCw, ChevronDown } from 'lucide-react';
import { generateMarketData, analyzeMarket } from './services/forexService';
import { Candle, MarketAnalysis } from './types';
import { ForexChart } from './components/charts/ForexChart';
import { SignalPanel } from './components/dashboard/SignalPanel';
import { AIAnalyst } from './components/dashboard/AIAnalyst';
import { BacktestPanel } from './components/dashboard/BacktestPanel';

// Define tabs
enum Tab {
  DASHBOARD = 'dashboard',
  BACKTEST = 'backtest',
}

const AVAILABLE_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'USD/CHF'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [activePair, setActivePair] = useState<string>('EUR/USD');
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load initial data when pair changes
  useEffect(() => {
    setLoading(true);
    const initData = generateMarketData(activePair, 300);
    setData(initData);
    setLoading(false);
  }, [activePair]);

  // Simulate live market updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        if (prevData.length === 0) return prevData;
        
        // Simulate new tick
        const lastCandle = prevData[prevData.length - 1];
        const volatility = activePair.includes('JPY') ? 0.05 : 0.0005;
        const newPrice = lastCandle.close + (Math.random() - 0.5) * volatility;
        
        // Append new candle occasionally to simulate time passing
        const now = new Date();
        if (now.getTime() - new Date(lastCandle.time).getTime() > 5000) {
             const newCandle: Candle = {
                 ...lastCandle,
                 time: now.toISOString(),
                 open: lastCandle.close,
                 close: newPrice,
                 high: Math.max(lastCandle.close, newPrice),
                 low: Math.min(lastCandle.close, newPrice),
                 // Indicators simplified for demo - reusing previous for smoothness
                 ma50: lastCandle.ma50, 
                 ma200: lastCandle.ma200,
                 rsi: lastCandle.rsi
             };
             setLastUpdate(now);
             return [...prevData.slice(1), newCandle];
        }
        return prevData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activePair]);

  // Memoize analysis to prevent unneeded re-renders
  const currentAnalysis: MarketAnalysis | null = useMemo(() => {
    if (data.length < 2) return null;
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    return analyzeMarket(current, prev, activePair);
  }, [data, activePair]);

  const handleRefresh = () => {
    setLoading(true);
    const newData = generateMarketData(activePair, 300);
    setData(newData);
    setLoading(false);
    setLastUpdate(new Date());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight hidden sm:block">ForexBot<span className="text-blue-500">Pro</span></h1>
              <h1 className="font-bold text-white text-lg tracking-tight sm:hidden">FB<span className="text-blue-500">Pro</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Pair Selector */}
            <div className="relative">
              <select 
                value={activePair}
                onChange={(e) => setActivePair(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-white text-sm font-bold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-750 transition-colors"
              >
                {AVAILABLE_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* Tabs */}
            <div className="hidden md:flex items-center space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setActiveTab(Tab.DASHBOARD)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === Tab.DASHBOARD ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Dashboard
              </button>
              <button 
                onClick={() => setActiveTab(Tab.BACKTEST)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === Tab.BACKTEST ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Strategy Backtest
              </button>
            </div>

            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              title="Reset Data"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Tabs */}
        <div className="md:hidden flex mb-6 p-1 bg-slate-800/50 rounded-lg border border-slate-700">
           <button 
              onClick={() => setActiveTab(Tab.DASHBOARD)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === Tab.DASHBOARD ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab(Tab.BACKTEST)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === Tab.BACKTEST ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Backtest
            </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
             <RefreshCw className="animate-spin text-blue-500" size={48} />
          </div>
        )}

        {!loading && currentAnalysis && (
          <>
             {/* Render Dashboard */}
             {activeTab === Tab.DASHBOARD && (
               <div className="space-y-6 animate-in fade-in duration-500">
                 
                 <SignalPanel analysis={currentAnalysis} />

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                     <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-4">
                       <div className="flex justify-between items-center mb-4 px-2">
                         <h3 className="text-slate-400 text-sm font-bold uppercase">{activePair} Price Action</h3>
                         <div className="flex gap-2 text-xs">
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400"></span> MA 50</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-400"></span> MA 200</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500"></span> Price</span>
                         </div>
                       </div>
                       <ForexChart data={data} pair={activePair} />
                     </div>
                   </div>

                   <div className="lg:col-span-1 space-y-6">
                      <AIAnalyst analysis={currentAnalysis} />

                      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6">
                        <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">Bot Statistics</h3>
                        <div className="space-y-4">
                           <div className="flex justify-between border-b border-slate-700 pb-2">
                              <span className="text-slate-400">Uptime</span>
                              <span className="text-white font-mono">24h 12m</span>
                           </div>
                           <div className="flex justify-between border-b border-slate-700 pb-2">
                              <span className="text-slate-400">Pair</span>
                              <span className="text-white font-bold">{activePair}</span>
                           </div>
                           <div className="flex justify-between border-b border-slate-700 pb-2">
                              <span className="text-slate-400">Last Tick</span>
                              <span className="text-white font-mono text-sm">{lastUpdate.toLocaleTimeString()}</span>
                           </div>
                        </div>
                      </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Render Backtest */}
             {activeTab === Tab.BACKTEST && (
               <BacktestPanel data={data} />
             )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;