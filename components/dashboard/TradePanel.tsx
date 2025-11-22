
import React, { useState, useEffect } from 'react';
import { Zap, Clipboard, PlayCircle, AlertOctagon, Calculator, CheckCircle2, Bell, Trash2, Settings2 } from 'lucide-react';
import { MetaApiConfig, TradeOrder, AutoTradeConfig } from '../../types';
import { parseSignalText, executeMetaApiTrade } from '../../services/forexService';
import { ToastType } from '../ui/Toast';

interface TradePanelProps {
  activePair: string;
  currentPrice: number;
  metaApiConfig: MetaApiConfig | null;
  onAutoTradeToggle: (enabled: boolean) => void;
  isAutoTrading: boolean;
  notify: (type: ToastType, title: string, message: string) => void;
  autoTradeConfig: AutoTradeConfig;
  onUpdateAutoConfig: (config: AutoTradeConfig) => void;
}

interface PriceAlert {
  id: string;
  pair: string;
  target: number;
  condition: 'ABOVE' | 'BELOW';
}

export const TradePanel: React.FC<TradePanelProps> = ({ 
  activePair, 
  currentPrice, 
  metaApiConfig,
  onAutoTradeToggle,
  isAutoTrading,
  notify,
  autoTradeConfig,
  onUpdateAutoConfig
}) => {
  const [tab, setTab] = useState<'manual' | 'parser' | 'auto' | 'alerts'>('manual');
  
  // Trade Form State
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Parser State
  const [pasteText, setPasteText] = useState('');

  // Calculator State
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [slPips, setSlPips] = useState(50);

  // Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [alertTarget, setAlertTarget] = useState<string>('');

  // Update SL/TP defaults when pair/price changes
  useEffect(() => {
    if (activePair && currentPrice) {
      const pip = activePair.includes('JPY') ? 0.01 : 0.0001;
      setStopLoss((currentPrice - 50 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
      setTakeProfit((currentPrice + 100 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
      setAlertTarget(currentPrice.toFixed(activePair.includes('JPY') ? 2 : 4));
    }
  }, [activePair, currentPrice]);

  // Monitor Alerts
  useEffect(() => {
    if (!currentPrice) return;

    setPriceAlerts(prev => {
      const nextAlerts = prev.filter(alert => {
        // Only check alerts for the active pair currently being streamed
        if (alert.pair !== activePair) return true;

        const hit = 
          (alert.condition === 'ABOVE' && currentPrice >= alert.target) ||
          (alert.condition === 'BELOW' && currentPrice <= alert.target);

        if (hit) {
          notify('info', 'Price Alert Triggered', `${alert.pair} hit ${alert.target}`);
          // Play sound effect optionally?
          return false; // Remove from list
        }
        return true; // Keep
      });

      return nextAlerts.length !== prev.length ? nextAlerts : prev;
    });
  }, [currentPrice, activePair, notify]);

  const handleExecute = async (type: 'BUY' | 'SELL') => {
    if (!metaApiConfig) {
      notify('error', 'Configuration Missing', 'Please configure Broker Connection in Settings.');
      return;
    }
    
    setIsExecuting(true);

    try {
      const order: TradeOrder = {
        symbol: activePair,
        actionType: type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
        volume: lotSize,
        stopLoss: parseFloat(stopLoss) || undefined,
        takeProfit: parseFloat(takeProfit) || undefined
      };

      await executeMetaApiTrade(metaApiConfig, order);
      notify('success', 'Trade Executed', `${type} Order placed successfully on ${activePair}`);
    } catch (error: any) {
      notify('error', 'Trade Failed', error.message || 'Unknown error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleParseSignal = () => {
    const signal = parseSignalText(pasteText);
    
    if (!signal.symbol && !signal.type) {
        notify('warning', 'Parse Error', 'Could not identify symbol or direction from text.');
        return;
    }

    if (signal.sl) setStopLoss(signal.sl.toString());
    if (signal.tp) setTakeProfit(signal.tp.toString());
    if (signal.type) {
        notify('success', 'Signal Parsed', `Identified ${signal.type} signal. Review details before execution.`);
    }
  };

  const calculateRisk = () => {
    const riskAmount = accountBalance * (riskPercent / 100);
    const estimatedLot = riskAmount / (slPips * 10);
    setLotSize(parseFloat(estimatedLot.toFixed(2)));
    notify('info', 'Risk Calculated', `Suggested Lot Size: ${estimatedLot.toFixed(2)}`);
  };

  const handleSetAlert = () => {
    const target = parseFloat(alertTarget);
    if (!target || isNaN(target)) {
      notify('warning', 'Invalid Price', 'Please enter a valid target price.');
      return;
    }

    const condition = target > currentPrice ? 'ABOVE' : 'BELOW';
    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      pair: activePair,
      target,
      condition
    };

    setPriceAlerts(prev => [...prev, newAlert]);
    notify('success', 'Alert Set', `Notify when ${activePair} goes ${condition} ${target}`);
  };

  const deleteAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Helper to update auto config fields
  const updateAutoConfig = (field: keyof AutoTradeConfig, value: number) => {
    onUpdateAutoConfig({
      ...autoTradeConfig,
      [field]: value
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-700">
        <button 
          onClick={() => setTab('manual')}
          className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === 'manual' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750'
          }`}
        >
          Trade
        </button>
        <button 
          onClick={() => setTab('parser')}
          className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === 'parser' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750'
          }`}
        >
          Parser
        </button>
        <button 
          onClick={() => setTab('auto')}
          className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === 'auto' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750'
          }`}
        >
          Auto
        </button>
        <button 
          onClick={() => setTab('alerts')}
          className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === 'alerts' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750'
          }`}
        >
          Alerts
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        
        {/* MANUAL TRADE TAB */}
        {tab === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg">
              <span className="text-slate-400 text-sm">Symbol</span>
              <span className="text-white font-bold">{activePair}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Lot Size</label>
                 <input 
                   type="number" 
                   step="0.01"
                   value={lotSize}
                   onChange={(e) => setLotSize(parseFloat(e.target.value))}
                   className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-right font-mono"
                 />
               </div>
               <div className="flex items-end pb-2">
                  <button 
                    onClick={() => setTab('auto')} // Redirect to calculator
                    className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                  >
                    <Calculator size={12} /> Calculate
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Stop Loss</label>
                 <input 
                   type="number" 
                   step="0.0001"
                   value={stopLoss}
                   onChange={(e) => setStopLoss(e.target.value)}
                   className="w-full bg-slate-900 border border-red-900/50 rounded p-2 text-red-400 text-right font-mono"
                 />
               </div>
               <div>
                 <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Take Profit</label>
                 <input 
                   type="number" 
                   step="0.0001"
                   value={takeProfit}
                   onChange={(e) => setTakeProfit(e.target.value)}
                   className="w-full bg-slate-900 border border-green-900/50 rounded p-2 text-green-400 text-right font-mono"
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => handleExecute('SELL')}
                disabled={isExecuting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded shadow-lg shadow-red-600/20 transition-all flex justify-center items-center gap-2"
              >
                 {isExecuting ? 'Processing...' : 'SELL'}
              </button>
              <button
                onClick={() => handleExecute('BUY')}
                disabled={isExecuting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded shadow-lg shadow-green-600/20 transition-all flex justify-center items-center gap-2"
              >
                 {isExecuting ? 'Processing...' : 'BUY'}
              </button>
            </div>
          </div>
        )}

        {/* SIGNAL PARSER TAB */}
        {tab === 'parser' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Paste a signal text. The bot will extract entry, SL, and TP levels.
            </p>
            <textarea
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g., BUY EURUSD @ 1.0500 SL 1.0450 TP 1.0600"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <button
              onClick={handleParseSignal}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Clipboard size={16} />
              Extract Signal
            </button>
          </div>
        )}

        {/* AUTO BOT TAB */}
        {tab === 'auto' && (
          <div className="space-y-6">
            
            {/* Bot Configuration */}
            <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
               <h4 className="text-xs text-slate-400 font-bold uppercase mb-3 flex items-center gap-2">
                 <Settings2 size={14} /> Bot Risk Settings
               </h4>
               <div className="space-y-3">
                 <div>
                    <label className="text-[10px] text-slate-500 uppercase">Fixed Lot Size</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={autoTradeConfig.lotSize} 
                      onChange={e => updateAutoConfig('lotSize', parseFloat(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="text-[10px] text-slate-500 uppercase">SL (Pips)</label>
                      <input 
                        type="number" 
                        value={autoTradeConfig.stopLossPips} 
                        onChange={e => updateAutoConfig('stopLossPips', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] text-slate-500 uppercase">TP (Pips)</label>
                      <input 
                        type="number" 
                        value={autoTradeConfig.takeProfitPips} 
                        onChange={e => updateAutoConfig('takeProfitPips', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm"
                      />
                   </div>
                 </div>
               </div>
            </div>

            {/* Auto Trade Toggle */}
            <div className="bg-slate-900/50 p-4 rounded border border-slate-700 flex items-center justify-between">
               <div>
                 <h4 className="text-sm font-bold text-white flex items-center gap-2">
                   <Zap size={16} className={isAutoTrading ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'} />
                   Auto-Trading
                 </h4>
                 <p className="text-xs text-slate-500 mt-1">
                   {isAutoTrading ? 'Bot executing >70% confidence signals.' : 'Bot execution paused.'}
                 </p>
               </div>
               <button
                 onClick={() => {
                    onAutoTradeToggle(!isAutoTrading);
                    notify('info', isAutoTrading ? 'Auto-Trading Disabled' : 'Auto-Trading Enabled', isAutoTrading ? 'Bot will no longer execute trades.' : 'Bot is now scanning for high-confidence signals.');
                 }}
                 className={`w-12 h-6 rounded-full p-1 transition-colors ${isAutoTrading ? 'bg-green-500' : 'bg-slate-700'}`}
               >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isAutoTrading ? 'translate-x-6' : 'translate-x-0'}`} />
               </button>
            </div>

            <div className="bg-slate-900/20 p-3 rounded border border-slate-800 text-[10px] text-slate-500">
               Disclaimer: Auto-trading carries significant risk. Ensure your Broker API connection is stable and SL/TP settings match your risk appetite.
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
              <h4 className="text-xs text-slate-400 font-bold uppercase mb-3 flex items-center gap-2">
                <Bell size={14} /> Set Price Alert
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Target Price</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.0001"
                      value={alertTarget} 
                      onChange={e => setAlertTarget(e.target.value)} 
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm font-mono" 
                    />
                    <button 
                      onClick={handleSetAlert}
                      className="px-4 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold"
                    >
                      Set
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Current: {currentPrice.toFixed(activePair.includes('JPY') ? 2 : 4)}. 
                    Alert will trigger when price crosses {parseFloat(alertTarget) || 'target'}.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs text-slate-400 font-bold uppercase">Active Alerts ({activePair})</h4>
              {priceAlerts.filter(a => a.pair === activePair).length === 0 && (
                <p className="text-xs text-slate-600 italic text-center py-4">No alerts set for this pair.</p>
              )}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {priceAlerts.filter(a => a.pair === activePair).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${alert.condition === 'ABOVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-mono">{alert.target}</span>
                      <span className="text-[10px] text-slate-500 uppercase bg-slate-900 px-1 rounded">{alert.condition}</span>
                    </div>
                    <button 
                      onClick={() => deleteAlert(alert.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
