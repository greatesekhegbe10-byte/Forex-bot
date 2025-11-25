
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Activity, ChevronDown, Settings, LogOut, Lock, Info } from 'lucide-react';
import { generateMarketData, analyzeMarket, fetchMetaApiCandles, executeBrokerTrade, fetchAccountInfo, fetchOpenPositions } from './services/forexService';
import { Candle, MarketAnalysis, AuthState, BrokerConfig, User, AppSettings, AutoTradeConfig, TradeOrder, SignalType, MetaAccountInfo, MetaPosition, BrokerType, SubscriptionStatus } from './types';
import { ForexChart } from './components/charts/ForexChart';
import { SignalPanel } from './components/dashboard/SignalPanel';
import { AIAnalyst } from './components/dashboard/AIAnalyst';
import { BacktestPanel } from './components/dashboard/BacktestPanel';
import { TradePanel } from './components/dashboard/TradePanel';
import { LoginScreen } from './components/auth/LoginScreen';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastContainer, ToastMessage, ToastType } from './components/ui/Toast';
import { logger } from './services/logger';
import { getStoredSubscription, checkPaymentStatus } from './services/paymentService';

// Define tabs
enum Tab {
  DASHBOARD = 'dashboard',
  BACKTEST = 'backtest',
}

const AVAILABLE_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'USD/CHF'];

const App: React.FC = () => {
  // Auth State
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(SubscriptionStatus.FREE);
  
  // App State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [activePair, setActivePair] = useState<string>('EUR/USD');
  const [timeframe, setTimeframe] = useState<string>('1h'); 
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Settings & Trading State
  const [showSettings, setShowSettings] = useState(false);
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({ 
    appName: 'ForexBot', 
    domainUrl: 'forexbot.pro',
    beginnerMode: true,
  });
  const [usingLiveData, setUsingLiveData] = useState(false);
  
  // Broker Data
  const [accountInfo, setAccountInfo] = useState<MetaAccountInfo | null>(null);
  const [positions, setPositions] = useState<MetaPosition[]>([]);

  // Auto Trading State
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [autoTradeConfig, setAutoTradeConfig] = useState<AutoTradeConfig>({
    lotSize: 0.01,
    stopLossPips: 30,
    takeProfitPips: 60,
    maxSpreadPips: 3,
    maxDailyLoss: 50,
    tradingStartHour: 0, // Expanded for 24h trading efficiency
    tradingEndHour: 24
  });
  
  // Refs for Auto Trading Loop
  const lastTradeTime = useRef<Record<string, number>>({});
  const isScanning = useRef<boolean>(false);

  // Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper for notifications
  const notify = (type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Auth & Config from LocalStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('forex_user');
      if (savedUser) {
        setAuth({ isAuthenticated: true, user: JSON.parse(savedUser) });
      }
    } catch (e) {
      localStorage.removeItem('forex_user');
    }

    try {
      const savedConfig = localStorage.getItem('broker_config');
      if (savedConfig) {
        setBrokerConfig(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.error("Failed to parse broker config", e);
    }

    try {
      const savedAppSettings = localStorage.getItem('app_settings');
      if (savedAppSettings) {
        setAppSettings(JSON.parse(savedAppSettings));
      }
    } catch (e) {
      console.error("Failed to parse app settings", e);
    }

    try {
      const savedAutoConfig = localStorage.getItem('auto_trade_config');
      if (savedAutoConfig) {
        setAutoTradeConfig(JSON.parse(savedAutoConfig));
      }
    } catch (e) {
      console.error("Failed to parse auto trade config", e);
    }
    
    const status = getStoredSubscription();
    setSubscriptionStatus(status);
  }, []);

  // Poll for payment status update if Pending
  useEffect(() => {
    if (subscriptionStatus === SubscriptionStatus.PENDING) {
      const interval = setInterval(async () => {
         const newStatus = await checkPaymentStatus();
         if (newStatus === SubscriptionStatus.PRO) {
           setSubscriptionStatus(newStatus);
           notify('success', 'Payment Verified', 'You are now a PRO user!');
         }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [subscriptionStatus]);

  useEffect(() => {
    localStorage.setItem('auto_trade_config', JSON.stringify(autoTradeConfig));
  }, [autoTradeConfig]);

  const handleLogin = (email: string, name: string) => {
    const user: User = { id: '1', email, name, subscription: subscriptionStatus };
    localStorage.setItem('forex_user', JSON.stringify(user));
    setAuth({ isAuthenticated: true, user });
    notify('success', 'Welcome!', `Great to see you, ${name}.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('forex_user');
    setAuth({ isAuthenticated: false, user: null });
    notify('info', 'Logged Out', 'See you next time!');
  };

  const handleSaveSettings = (config: BrokerConfig, settings: AppSettings) => {
    setBrokerConfig(config);
    localStorage.setItem('broker_config', JSON.stringify(config));
    
    setAppSettings(settings);
    localStorage.setItem('app_settings', JSON.stringify(settings));

    notify('success', 'Settings Saved', 'Configuration updated.');

    if (config.type === BrokerType.MT5 && config.accessToken) {
        loadData(activePair, timeframe, config);
    }
  };

  const refreshBrokerData = async () => {
      if (!brokerConfig || brokerConfig.type !== BrokerType.MT5) return;
      try {
          const info = await fetchAccountInfo(brokerConfig);
          setAccountInfo(info);
          const pos = await fetchOpenPositions(brokerConfig);
          setPositions(pos);
      } catch (e) {
          logger.warn("Failed to refresh broker data", e);
      }
  };

  const loadData = async (pair: string, tf: string, config: BrokerConfig | null) => {
    setLoading(true);
    
    if (config && config.type === BrokerType.MT5 && config.accessToken && config.accountId) {
      try {
        const timeoutPromise = new Promise<Candle[]>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 8000)
        );
        
        const dataPromise = fetchMetaApiCandles(config, pair, tf);
        const liveData = await Promise.race([dataPromise, timeoutPromise]);

        if (liveData.length > 0) {
          setData(liveData);
          setUsingLiveData(true);
          setLoading(false);
          setLastUpdate(new Date());
          refreshBrokerData(); 
          return;
        }
      } catch (err: any) {
        logger.warn("Failed to fetch live data, falling back to simulation");
      }
    }

    const simData = generateMarketData(pair, 300, tf);
    setData(simData);
    setUsingLiveData(false);
    setLoading(false);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadData(activePair, timeframe, brokerConfig);
    }
  }, [activePair, timeframe, auth.isAuthenticated, brokerConfig]);

  useEffect(() => {
      if (!usingLiveData || !brokerConfig) return;
      const interval = setInterval(refreshBrokerData, 10000); 
      return () => clearInterval(interval);
  }, [usingLiveData, brokerConfig]);

  // Live Chart Simulation (if not using broker data)
  useEffect(() => {
    if (usingLiveData) return; 

    const interval = setInterval(() => {
      setData(prevData => {
        if (prevData.length === 0) return prevData;
        const lastCandle = prevData[prevData.length - 1];
        const volatility = activePair.includes('JPY') ? 0.05 : 0.0005;
        const change = (Math.random() - 0.5) * volatility;
        let newPrice = lastCandle.close + change;
        const newHigh = Math.max(lastCandle.high, newPrice);
        const newLow = Math.min(lastCandle.low, newPrice);

        let intervalMs = 60 * 60 * 1000;
        if (timeframe === '1m') intervalMs = 60 * 1000;
        if (timeframe === '5m') intervalMs = 5 * 60 * 1000;
        if (timeframe === '15m') intervalMs = 15 * 60 * 1000;
        if (timeframe === '4h') intervalMs = 4 * 60 * 60 * 1000;
        if (timeframe === '1d') intervalMs = 24 * 60 * 60 * 1000;

        const now = new Date();
        const candleTime = new Date(lastCandle.time);
        const shouldClose = now.getTime() - candleTime.getTime() > intervalMs;
        setLastUpdate(now);

        if (shouldClose) {
             const newCandle: Candle = {
                 time: now.toISOString(),
                 open: newPrice,
                 close: newPrice,
                 high: newPrice,
                 low: newPrice,
                 volume: 0,
                 ma50: lastCandle.ma50, 
                 ma200: lastCandle.ma200,
                 rsi: lastCandle.rsi
             };
             const newData = [...prevData, newCandle];
             if (newData.length > 300) newData.shift();
             return newData;
        } else {
             const updatedCandle = { ...lastCandle, close: newPrice, high: newHigh, low: newLow };
             return [...prevData.slice(0, -1), updatedCandle];
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activePair, usingLiveData, timeframe]);

  const currentAnalysis: MarketAnalysis | null = useMemo(() => {
    if (data.length < 2) return null;
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    return analyzeMarket(current, prev, activePair);
  }, [data, activePair]);

  // --- MULTI-PAIR MARKET SCANNER & AUTO TRADER ---
  useEffect(() => {
    // Access Control
    if (subscriptionStatus !== SubscriptionStatus.PRO) {
        if (isAutoTrading) setIsAutoTrading(false);
        return;
    }

    if (!isAutoTrading || !brokerConfig) return;

    // Background Scanner Logic
    const scanMarket = async () => {
        if (isScanning.current) return;
        isScanning.current = true;

        const now = new Date();
        const currentHour = now.getHours();
        
        // Time Filter
        if (currentHour < autoTradeConfig.tradingStartHour || currentHour >= autoTradeConfig.tradingEndHour) {
             isScanning.current = false;
             return;
        }

        // Iterate through ALL pairs, not just the active one
        for (const pair of AVAILABLE_PAIRS) {
            
            // 1. Fetch Snapshot Data for Pair
            // Optimization: If using live data, we need to fetch. If sim, generate.
            let pairData: Candle[] = [];
            if (brokerConfig.type === BrokerType.MT5 && brokerConfig.accessToken) {
                try {
                    // Quick fetch, smaller dataset for speed
                    pairData = await fetchMetaApiCandles(brokerConfig, pair, timeframe, 210);
                } catch {
                    pairData = generateMarketData(pair, 210, timeframe); // Fallback
                }
            } else {
                pairData = generateMarketData(pair, 210, timeframe);
            }

            if (pairData.length < 2) continue;

            // 2. Analyze Pair
            const analysis = analyzeMarket(pairData[pairData.length - 1], pairData[pairData.length - 2], pair);

            // 3. Evaluate Trading Conditions
            const nowMs = now.getTime();
            const lastTime = lastTradeTime.current[pair] || 0;
            const COOLDOWN_MS = 3 * 60 * 1000; // 3 Min Cooldown per pair for higher efficiency

            if (nowMs - lastTime < COOLDOWN_MS) continue;

            // Confidence Threshold > 70%
            if (analysis.confidence <= 70) continue;
            if (analysis.signal === SignalType.HOLD) continue;

            // Check Existing Positions to prevent stacking risk on same pair
            if (brokerConfig.type === BrokerType.MT5) {
                const hasOpenPosition = positions.some(p => p.symbol.includes(pair.replace('/', '')) || pair.includes(p.symbol));
                if (hasOpenPosition) continue;
            }

            // 4. Execute Trade
            const isBuy = analysis.signal === SignalType.BUY;
            const pipValue = pair.includes('JPY') ? 0.01 : 0.0001;
            const price = analysis.currentPrice;
            const slPrice = isBuy 
                ? price - (autoTradeConfig.stopLossPips * pipValue)
                : price + (autoTradeConfig.stopLossPips * pipValue);
            const tpPrice = isBuy
                ? price + (autoTradeConfig.takeProfitPips * pipValue)
                : price - (autoTradeConfig.takeProfitPips * pipValue);

            const order: TradeOrder = {
                symbol: pair,
                actionType: isBuy ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
                volume: autoTradeConfig.lotSize,
                stopLoss: parseFloat(slPrice.toFixed(pair.includes('JPY') ? 2 : 4)),
                takeProfit: parseFloat(tpPrice.toFixed(pair.includes('JPY') ? 2 : 4)),
                comment: `AutoBot 70%+ Conf`
            };

            logger.info(`Scanner found opportunity on ${pair}`, order);

            try {
                await executeBrokerTrade(brokerConfig, order);
                notify('success', 'Auto-Trade Executed', `${order.actionType} on ${pair} (${analysis.confidence}% Conf)`);
                
                // Update cooldown
                lastTradeTime.current = { ...lastTradeTime.current, [pair]: nowMs };
                
                // Refresh portfolio
                refreshBrokerData();
            } catch (err: any) {
                logger.error(`Auto-Trade Failed for ${pair}`, err);
            }
        }

        isScanning.current = false;
    };

    // Run Scanner every 15 seconds
    const scannerInterval = setInterval(scanMarket, 15000);
    
    // Initial scan
    scanMarket();

    return () => clearInterval(scannerInterval);

  }, [isAutoTrading, brokerConfig, autoTradeConfig, positions, subscriptionStatus, timeframe]);

  const handleRestrictedAccess = (feature: string) => {
      notify('warning', `${feature} Locked`, 'Please upgrade to PRO to access this feature.');
      setShowSettings(true);
  };

  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans pb-10 selection:bg-blue-900/30">
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={handleSaveSettings}
        currentConfig={brokerConfig}
        currentAppSettings={appSettings}
        subscriptionStatus={subscriptionStatus}
        onSubscriptionUpdate={setSubscriptionStatus}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded text-white">
                <Activity size={20} />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-bold text-base tracking-tight leading-none text-white">
                  {appSettings.appName}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                    {appSettings.beginnerMode && (
                    <span className="text-[10px] text-[#a1a1aa] font-medium">Simple View</span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 rounded ${
                        subscriptionStatus === SubscriptionStatus.PRO ? 'bg-green-900 text-green-400' : 
                        subscriptionStatus === SubscriptionStatus.PENDING ? 'bg-yellow-900 text-yellow-400' :
                        'bg-slate-800 text-slate-400'
                    }`}>
                        {subscriptionStatus}
                    </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="hidden md:block relative">
                <select 
                  value={activePair}
                  onChange={(e) => setActivePair(e.target.value)}
                  className="appearance-none bg-[#18181b] border border-[#27272a] text-white text-sm rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                >
                  {AVAILABLE_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#71717a] pointer-events-none" size={14} />
              </div>

              <div className="h-6 w-px bg-[#27272a] hidden md:block"></div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newMode = !appSettings.beginnerMode;
                    setAppSettings({...appSettings, beginnerMode: newMode});
                    localStorage.setItem('app_settings', JSON.stringify({...appSettings, beginnerMode: newMode}));
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    appSettings.beginnerMode 
                    ? 'bg-[#18181b] text-white border border-[#27272a]' 
                    : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  {appSettings.beginnerMode ? 'Beginner' : 'Pro'}
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
                >
                  <Settings size={20} />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-6">
        <div className="flex border-b border-[#27272a] gap-8">
          <button 
              onClick={() => setActiveTab(Tab.DASHBOARD)}
              className={`pb-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === Tab.DASHBOARD 
                  ? 'border-blue-600 text-white' 
                  : 'border-transparent text-[#a1a1aa] hover:text-white'
              }`}
            >
              Market Dashboard
            </button>
            <button 
              onClick={() => {
                  if (subscriptionStatus === SubscriptionStatus.PRO) {
                      setActiveTab(Tab.BACKTEST);
                  } else {
                      handleRestrictedAccess('Strategy Backtester');
                  }
              }}
              className={`pb-3 text-sm font-medium transition-all border-b-2 flex items-center gap-1 ${
                activeTab === Tab.BACKTEST 
                  ? 'border-blue-600 text-white' 
                  : 'border-transparent text-[#a1a1aa] hover:text-white'
              }`}
            >
              Strategy Tester
              {subscriptionStatus !== SubscriptionStatus.PRO && <Lock size={12} className="text-yellow-500" />}
            </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Pair Selector */}
        <div className="md:hidden mb-6">
          <select 
            value={activePair}
            onChange={(e) => setActivePair(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-blue-600"
          >
            {AVAILABLE_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-[40vh]">
             <div className="w-8 h-8 border-2 border-[#27272a] border-t-blue-600 rounded-full animate-spin mb-4"></div>
             <h2 className="text-[#a1a1aa] text-sm">Loading Market Data...</h2>
          </div>
        )}

        {!loading && currentAnalysis && (
          <>
             {activeTab === Tab.DASHBOARD && (
               <div className="space-y-8 animate-in fade-in duration-300">
                 
                 <SignalPanel analysis={currentAnalysis} beginnerMode={appSettings.beginnerMode} />

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-8">
                     <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
                       <div className="p-5 border-b border-[#27272a] flex justify-between items-center">
                         <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                           Price Action
                         </h3>
                         {usingLiveData && (
                           <div className="flex items-center gap-1.5">
                             <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                             </span>
                             <span className="text-xs text-[#a1a1aa]">Live</span>
                           </div>
                         )}
                       </div>
                       <div className="p-5">
                         <ForexChart 
                           data={data} 
                           pair={activePair} 
                           timeframe={timeframe} 
                           onTimeframeChange={setTimeframe}
                         />
                       </div>
                     </div>

                     <div className="relative">
                        <AIAnalyst 
                            analysis={currentAnalysis} 
                            notify={notify} 
                        />
                        {subscriptionStatus !== SubscriptionStatus.PRO && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl z-10 border border-[#27272a]">
                                <Lock className="text-yellow-500 mb-2" size={32} />
                                <h3 className="text-white font-bold mb-1">AI Analyst Locked</h3>
                                <p className="text-slate-300 text-xs mb-3">Upgrade to PRO to get AI-powered insights</p>
                                <button 
                                    onClick={() => setShowSettings(true)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold"
                                >
                                    Unlock Pro Features
                                </button>
                            </div>
                        )}
                     </div>
                   </div>

                   <div className="lg:col-span-1 space-y-8">
                     <TradePanel 
                        activePair={activePair} 
                        currentPrice={currentAnalysis.currentPrice}
                        brokerConfig={brokerConfig}
                        onAutoTradeToggle={(enabled) => {
                            if (subscriptionStatus === SubscriptionStatus.PRO) {
                                setIsAutoTrading(enabled);
                            } else {
                                handleRestrictedAccess('Auto-Trading');
                            }
                        }}
                        isAutoTrading={isAutoTrading}
                        notify={notify}
                        autoTradeConfig={autoTradeConfig}
                        onUpdateAutoConfig={setAutoTradeConfig}
                        beginnerMode={appSettings.beginnerMode}
                        accountInfo={accountInfo}
                        positions={positions}
                        onRefreshBrokerData={refreshBrokerData}
                        isPro={subscriptionStatus === SubscriptionStatus.PRO}
                     />

                     {appSettings.beginnerMode && (
                       <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                         <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                           <Info size={16} className="text-blue-500" />
                           Quick Guide
                         </h4>
                         <div className="space-y-4 text-sm text-[#a1a1aa]">
                           <div className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                             <p><strong>Buy Signal:</strong> Indicates price is likely to rise. Good for entering a "Long" position.</p>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                             <p><strong>Sell Signal:</strong> Indicates price is likely to fall. Good for entering a "Short" position.</p>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}

             {activeTab === Tab.BACKTEST && subscriptionStatus === SubscriptionStatus.PRO && (
               <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                 <div className="mb-6 border-b border-[#27272a] pb-4">
                   <h2 className="text-lg font-bold text-white mb-1">Strategy Backtest</h2>
                   <p className="text-[#a1a1aa] text-sm">Simulate performance on historical data.</p>
                 </div>
                 <BacktestPanel data={data} />
               </div>
             )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
