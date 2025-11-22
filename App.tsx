import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Activity, RefreshCw, ChevronDown, Settings, LogOut, LayoutDashboard, LineChart, Sparkles } from 'lucide-react';
import { generateMarketData, analyzeMarket, fetchMetaApiCandles, executeMetaApiTrade } from './services/forexService';
import { Candle, MarketAnalysis, AuthState, MetaApiConfig, User, AppSettings, AutoTradeConfig, TradeOrder, SignalType } from './types';
import { ForexChart } from './components/charts/ForexChart';
import { SignalPanel } from './components/dashboard/SignalPanel';
import { AIAnalyst } from './components/dashboard/AIAnalyst';
import { BacktestPanel } from './components/dashboard/BacktestPanel';
import { TradePanel } from './components/dashboard/TradePanel';
import { LoginScreen } from './components/auth/LoginScreen';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastContainer, ToastMessage, ToastType } from './components/ui/Toast';
import { logger } from './services/logger';

// Define tabs
enum Tab {
  DASHBOARD = 'dashboard',
  BACKTEST = 'backtest',
}

const AVAILABLE_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'USD/CHF'];

const App: React.FC = () => {
  // Auth State
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  
  // App State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [activePair, setActivePair] = useState<string>('EUR/USD');
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Settings & Trading State
  const [showSettings, setShowSettings] = useState(false);
  const [metaApiConfig, setMetaApiConfig] = useState<MetaApiConfig | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({ appName: 'ForexBotPro', domainUrl: 'forexbot.pro' });
  const [usingLiveData, setUsingLiveData] = useState(false);
  
  // Auto Trading State
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [autoTradeConfig, setAutoTradeConfig] = useState<AutoTradeConfig>({
    lotSize: 0.01,
    stopLossPips: 30,
    takeProfitPips: 60,
    maxSpreadPips: 3
  });
  
  // Refs for Auto Trading Loop
  const lastTradeTime = useRef<number>(0);
  const lastSignalType = useRef<SignalType | null>(null);

  // Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper for notifications
  const notify = (type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    // Auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Auth & Config from LocalStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('forex_user');
    if (savedUser) {
      setAuth({ isAuthenticated: true, user: JSON.parse(savedUser) });
    }
    const savedConfig = localStorage.getItem('metaapi_config');
    if (savedConfig) {
      setMetaApiConfig(JSON.parse(savedConfig));
    }
    const savedAppSettings = localStorage.getItem('app_settings');
    if (savedAppSettings) {
      setAppSettings(JSON.parse(savedAppSettings));
    }
    const savedAutoConfig = localStorage.getItem('auto_trade_config');
    if (savedAutoConfig) {
      setAutoTradeConfig(JSON.parse(savedAutoConfig));
    }
  }, []);

  // Save Auto Config when changed
  useEffect(() => {
    localStorage.setItem('auto_trade_config', JSON.stringify(autoTradeConfig));
  }, [autoTradeConfig]);

  // Update Document Title based on App Name
  useEffect(() => {
    document.title = `${activePair} | ${appSettings.appName}`;
  }, [appSettings.appName, activePair]);

  const handleLogin = (email: string, name: string) => {
    const user: User = { id: '1', email, name };
    localStorage.setItem('forex_user', JSON.stringify(user));
    setAuth({ isAuthenticated: true, user });
    notify('success', 'Login Successful', `Welcome back, ${name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('forex_user');
    setAuth({ isAuthenticated: false, user: null });
    notify('info', 'Logged Out', 'You have been signed out securely.');
  };

  const handleSaveSettings = (config: MetaApiConfig, settings: AppSettings) => {
    setMetaApiConfig(config);
    localStorage.setItem('metaapi_config', JSON.stringify(config));
    
    setAppSettings(settings);
    localStorage.setItem('app_settings', JSON.stringify(settings));

    notify('success', 'Settings Saved', 'Configuration updated successfully.');

    // Trigger data reload with new config if it changed
    if (config.accessToken !== metaApiConfig?.accessToken) {
        loadData(activePair, config);
    }
  };

  // Data Loading Logic
  const loadData = async (pair: string, config: MetaApiConfig | null) => {
    setLoading(true);
    
    if (config && config.accessToken && config.accountId) {
      try {
        const liveData = await fetchMetaApiCandles(config, pair);
        if (liveData.length > 0) {
          setData(liveData);
          setUsingLiveData(true);
          setLoading(false);
          setLastUpdate(new Date());
          return;
        }
      } catch (err: any) {
        logger.warn("Failed to fetch live data, falling back to simulation");
        if (usingLiveData) { 
             notify('warning', 'Live Data Disconnected', 'Reverted to simulation mode due to connection error.');
        }
      }
    }

    const simData = generateMarketData(pair, 300);
    setData(simData);
    setUsingLiveData(false);
    setLoading(false);
    setLastUpdate(new Date());
  };

  // Initial Load & Pair Change
  useEffect(() => {
    if (auth.isAuthenticated) {
      loadData(activePair, metaApiConfig);
      lastTradeTime.current = 0;
      lastSignalType.current = null;
    }
  }, [activePair, auth.isAuthenticated, metaApiConfig]);

  // Simulate live ticks
  useEffect(() => {
    if (usingLiveData) return; 

    const interval = setInterval(() => {
      setData(prevData => {
        if (prevData.length === 0) return prevData;
        
        const lastCandle = prevData[prevData.length - 1];
        const volatility = activePair.includes('JPY') ? 0.05 : 0.0005;
        const newPrice = lastCandle.close + (Math.random() - 0.5) * volatility;
        
        const now = new Date();
        if (now.getTime() - new Date(lastCandle.time).getTime() > 5000) {
             const newCandle: Candle = {
                 ...lastCandle,
                 time: now.toISOString(),
                 open: lastCandle.close,
                 close: newPrice,
                 high: Math.max(lastCandle.close, newPrice),
                 low: Math.min(lastCandle.close, newPrice),
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
  }, [activePair, usingLiveData]);

  // Memoize analysis
  const currentAnalysis: MarketAnalysis | null = useMemo(() => {
    if (data.length < 2) return null;
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    return analyzeMarket(current, prev, activePair);
  }, [data, activePair]);

  // --- AUTO TRADING LOGIC ---
  useEffect(() => {
    if (!isAutoTrading || !currentAnalysis || !metaApiConfig) return;

    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000; 
    if (now - lastTradeTime.current < COOLDOWN_MS) return;
    if (currentAnalysis.confidence <= 70) return;
    if (currentAnalysis.signal === SignalType.HOLD) return;
    if (currentAnalysis.signal === lastSignalType.current) return;

    const executeAutoTrade = async () => {
      const isBuy = currentAnalysis.signal === SignalType.BUY;
      const pipValue = activePair.includes('JPY') ? 0.01 : 0.0001;
      const price = currentAnalysis.currentPrice;
      const slPrice = isBuy 
        ? price - (autoTradeConfig.stopLossPips * pipValue)
        : price + (autoTradeConfig.stopLossPips * pipValue);
      const tpPrice = isBuy
        ? price + (autoTradeConfig.takeProfitPips * pipValue)
        : price - (autoTradeConfig.takeProfitPips * pipValue);

      const order: TradeOrder = {
        symbol: activePair,
        actionType: isBuy ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
        volume: autoTradeConfig.lotSize,
        stopLoss: parseFloat(slPrice.toFixed(activePair.includes('JPY') ? 2 : 4)),
        takeProfit: parseFloat(tpPrice.toFixed(activePair.includes('JPY') ? 2 : 4)),
        comment: `AutoBot ${currentAnalysis.confidence}% Conf`
      };

      logger.info("Attempting Auto-Trade", order);
      notify('info', 'Auto-Trading', `Executing ${order.actionType} on ${activePair}...`);

      try {
        await executeMetaApiTrade(metaApiConfig, order);
        notify('success', 'Auto-Trade Executed', `${isBuy ? 'BUY' : 'SELL'} ${autoTradeConfig.lotSize} lots @ ${price.toFixed(5)}`);
        lastTradeTime.current = now;
        lastSignalType.current = currentAnalysis.signal;
      } catch (err: any) {
        logger.error("Auto-Trade Failed", err);
        notify('error', 'Auto-Trade Error', err.message || 'Execution failed');
      }
    };

    executeAutoTrade();

  }, [currentAnalysis, isAutoTrading, metaApiConfig, autoTradeConfig, activePair]);


  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={handleSaveSettings}
        currentConfig={metaApiConfig}
        currentAppSettings={appSettings}
      />

      {/* Floating Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-indigo-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-200" />
                <div className="relative p-2 bg-[#0B0F19] rounded-xl border border-white/10">
                  <Activity className="text-indigo-400" size={20} />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1">
                  {appSettings.appName} <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-[9px] text-indigo-400 font-mono">PRO</span>
                </h1>
              </div>
            </div>

            {/* Center - Pair Selector & Tabs */}
            <div className="hidden md:flex items-center gap-4 bg-[#0B0F19] p-1.5 rounded-full border border-white/5">
               {/* Pair Selector */}
               <div className="relative group px-2">
                <select 
                  value={activePair}
                  onChange={(e) => setActivePair(e.target.value)}
                  className="appearance-none bg-transparent text-white text-xs font-bold pr-6 cursor-pointer focus:outline-none"
                >
                  {AVAILABLE_PAIRS.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
              </div>

              <div className="w-px h-4 bg-white/10 mx-1"></div>

              <button 
                  onClick={() => setActiveTab(Tab.DASHBOARD)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === Tab.DASHBOARD 
                      ? 'bg-slate-800 text-white shadow-inner' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard size={12} /> Terminal
                </button>
                <button 
                  onClick={() => setActiveTab(Tab.BACKTEST)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === Tab.BACKTEST 
                      ? 'bg-slate-800 text-white shadow-inner' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LineChart size={12} /> Backtest
                </button>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 pl-4">
                <button 
                  onClick={() => {
                      loadData(activePair, metaApiConfig);
                      notify('info', 'Refreshing Data', 'Fetching latest candles...');
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  title="Refresh Data"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
                
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Mobile Navigation */}
        <div className="md:hidden grid grid-cols-2 gap-2 p-1 bg-[#0B0F19] rounded-xl border border-white/5">
           <button 
              onClick={() => setActiveTab(Tab.DASHBOARD)}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === Tab.DASHBOARD ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400'
              }`}
            >
              <LayoutDashboard size={14} /> Terminal
            </button>
            <button 
              onClick={() => setActiveTab(Tab.BACKTEST)}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === Tab.BACKTEST ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400'
              }`}
            >
              <LineChart size={14} /> Backtest
            </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
             <div className="relative">
               <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
               <RefreshCw className="relative animate-spin text-indigo-500" size={48} />
             </div>
             <p className="mt-8 text-indigo-200 text-xs font-bold tracking-[0.2em] animate-pulse">ESTABLISHING FEED...</p>
          </div>
        )}

        {!loading && currentAnalysis && (
          <>
             {/* Render Dashboard */}
             {activeTab === Tab.DASHBOARD && (
               <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
                 
                 <SignalPanel analysis={currentAnalysis} />

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                   {/* Main Chart Area */}
                   <div className="lg:col-span-8 flex flex-col gap-6">
                     <div className="bg-[#0B0F19]/70 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden relative group">
                        {/* Decorative top bar */}
                       <div className="flex justify-between items-center px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                         <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                           <Sparkles size={12} className="text-indigo-400" /> Technical Overview
                         </h3>
                         <div className="flex gap-4 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]"></div> MA 50</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7]"></div> MA 200</span>
                         </div>
                       </div>
                       <div className="p-1 relative min-h-[450px]">
                         <ForexChart data={data} pair={activePair} />
                       </div>
                     </div>
                   </div>

                   {/* Side Panel */}
                   <div className="lg:col-span-4 space-y-6">
                      <TradePanel 
                        activePair={activePair} 
                        currentPrice={currentAnalysis.currentPrice}
                        metaApiConfig={metaApiConfig}
                        onAutoTradeToggle={setIsAutoTrading}
                        isAutoTrading={isAutoTrading}
                        notify={notify}
                        autoTradeConfig={autoTradeConfig}
                        onUpdateAutoConfig={setAutoTradeConfig}
                      />

                      <AIAnalyst analysis={currentAnalysis} notify={notify} />

                      <div className="bg-[#0B0F19]/50 backdrop-blur-md border border-white/5 rounded-2xl p-5">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Connection Status</h3>
                        <div className="space-y-2">
                           <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                              <span className="text-xs text-slate-400">Data Feed</span>
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${usingLiveData ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                <span className="text-xs font-bold text-slate-200">
                                    {usingLiveData ? 'MetaAPI Live' : 'Simulation'}
                                </span>
                              </div>
                           </div>
                           <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                              <span className="text-xs text-slate-400">Last Update</span>
                              <span className="text-xs text-indigo-300 font-mono">{lastUpdate.toLocaleTimeString()}</span>
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