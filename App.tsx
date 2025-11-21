
import React, { useEffect, useState, useMemo } from 'react';
import { Activity, RefreshCw, ChevronDown, Settings, LogOut } from 'lucide-react';
import { generateMarketData, analyzeMarket, fetchMetaApiCandles } from './services/forexService';
import { Candle, MarketAnalysis, AuthState, MetaApiConfig, User, AppSettings } from './types';
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
  const [isAutoTrading, setIsAutoTrading] = useState(false);

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
  }, []);

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
        // We log internal error but show user a warning
        logger.warn("Failed to fetch live data, falling back to simulation");
        if (usingLiveData) { // Only notify if we were previously live
             notify('warning', 'Live Data Disconnected', 'Reverted to simulation mode due to connection error.');
        }
      }
    }

    // Fallback to simulation
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
    }
  }, [activePair, auth.isAuthenticated, metaApiConfig]);

  // Simulate live ticks (only if using simulation data)
  useEffect(() => {
    if (usingLiveData) return; 

    const interval = setInterval(() => {
      setData(prevData => {
        if (prevData.length === 0) return prevData;
        
        const lastCandle = prevData[prevData.length - 1];
        const volatility = activePair.includes('JPY') ? 0.05 : 0.0005;
        const newPrice = lastCandle.close + (Math.random() - 0.5) * volatility;
        
        const now = new Date();
        // Create new candle every 5 seconds for demo speed
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

  // -- RENDER --

  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={handleSaveSettings}
        currentConfig={metaApiConfig}
        currentAppSettings={appSettings}
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight hidden sm:block">{appSettings.appName}</h1>
              <h1 className="font-bold text-white text-lg tracking-tight sm:hidden">Bot</h1>
              {appSettings.domainUrl && (
                <p className="text-[10px] text-slate-500 font-mono hidden sm:block">{appSettings.domainUrl}</p>
              )}
            </div>
            {usingLiveData && (
              <span className="ml-2 px-2 py-0.5 bg-green-900/50 border border-green-600/50 text-green-400 text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">
                Live MT5 Data
              </span>
            )}
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

            <div className="flex items-center border-l border-slate-700 pl-4 gap-2">
              <button 
                onClick={() => {
                    loadData(activePair, metaApiConfig);
                    notify('info', 'Refreshing Data', 'Fetching latest candles...');
                }}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-900/20 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
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
          <div className="flex flex-col items-center justify-center h-64">
             <RefreshCw className="animate-spin text-blue-500 mb-4" size={48} />
             <p className="text-slate-400">Fetching market data...</p>
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
                      <TradePanel 
                        activePair={activePair} 
                        currentPrice={currentAnalysis.currentPrice}
                        metaApiConfig={metaApiConfig}
                        onAutoTradeToggle={setIsAutoTrading}
                        isAutoTrading={isAutoTrading}
                        notify={notify}
                      />

                      <AIAnalyst analysis={currentAnalysis} notify={notify} />

                      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6">
                        <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">Bot Statistics</h3>
                        <div className="space-y-4">
                           <div className="flex justify-between border-b border-slate-700 pb-2">
                              <span className="text-slate-400">Data Source</span>
                              <span className={`font-bold ${usingLiveData ? 'text-green-400' : 'text-yellow-400'}`}>
                                {usingLiveData ? 'MetaAPI (Live)' : 'Simulation'}
                              </span>
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
