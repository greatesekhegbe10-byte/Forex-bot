import React, { useState, useEffect } from 'react';
import { Zap, Clipboard, Copy, AlertOctagon, Calculator, CheckCircle2, Bell, Trash2, Settings2, ArrowRightLeft, Crosshair } from 'lucide-react';
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

  // Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [alertTarget, setAlertTarget] = useState<string>('');

  // Update SL/TP defaults when pair/price changes
  useEffect(() => {
    if (activePair && currentPrice) {
      const pip = activePair.includes('JPY') ? 0.01 : 0.0001;
      // Only set defaults if empty to avoid overwriting user input during live updates
      if (!stopLoss) setStopLoss((currentPrice - 50 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
      if (!takeProfit) setTakeProfit((currentPrice + 100 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
      if (!alertTarget) setAlertTarget(currentPrice.toFixed(activePair.includes('JPY') ? 2 : 4));
    }
  }, [activePair, currentPrice]);

  // Monitor Alerts
  useEffect(() => {
    if (!currentPrice) return;
    setPriceAlerts(prev => {
      const nextAlerts = prev.filter(alert => {
        if (alert.pair !== activePair) return true;
        const hit = 
          (alert.condition === 'ABOVE' && currentPrice >= alert.target) ||
          (alert.condition === 'BELOW' && currentPrice <= alert.target);
        if (hit) {
          notify('info', 'Price Alert Triggered', `${alert.pair} hit ${alert.target}`);
          return false; 
        }
        return true; 
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
        setTab('manual');
    }
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

  const updateAutoConfig = (field: keyof AutoTradeConfig, value: number) => {
    onUpdateAutoConfig({
      ...autoTradeConfig,
      [field]: value
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    notify('success', 'Copied', `${label} copied to clipboard`);
  };

  return (
    <div className="bg-[#0B0F19]/70 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full relative group">
      {/* Border Gradient on Hover */}
      <div className="absolute inset-0 border border-transparent group-hover:border-indigo-500/20 rounded-2xl transition-colors pointer-events-none" />

      {/* Navigation Tabs */}
      <div className="flex p-1.5 bg-black/40 border-b border-white/5 gap-1 mx-2 mt-2 rounded-xl">
        {[
          { id: 'manual', label: 'Manual', icon: ArrowRightLeft },
          { id: 'parser', label: 'Parser', icon: Clipboard },
          { id: 'auto', label: 'Auto Bot', icon: Zap },
          { id: 'alerts', label: 'Alerts', icon: Bell }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setTab(item.id as any)}
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
              tab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        
        {/* MANUAL TRADE TAB */}
        {tab === 'manual' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-[#020617] p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Crosshair size={16} className="text-indigo-400" />
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Active Asset</span>
                  <span className="text-white font-mono font-bold text-base tracking-tight">{activePair}</span>
                </div>
              </div>
              <div className="text-right">
                  <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Bid</span>
                  <span className="text-emerald-400 font-mono font-bold">{currentPrice.toFixed(5)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block tracking-wide">Lot Size</label>
                 <div className="relative group">
                    <input 
                      type="number" 
                      step="0.01"
                      value={lotSize}
                      onChange={(e) => setLotSize(parseFloat(e.target.value))}
                      className="w-full bg-[#020617] border border-slate-800 focus:border-indigo-500/50 rounded-lg py-3 pl-3 pr-8 text-white text-right font-mono text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                    />
                 </div>
               </div>
               <div className="flex items-end pb-1">
                  <div className="text-right w-full bg-white/5 rounded-lg p-2 border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Est. Val / Pip</span>
                    <p className="text-sm text-indigo-300 font-mono font-bold">~${(lotSize * 10).toFixed(2)}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block tracking-wide text-rose-400">Stop Loss</label>
                 <input 
                   type="number" 
                   step="0.0001"
                   value={stopLoss}
                   onChange={(e) => setStopLoss(e.target.value)}
                   className="w-full bg-[#020617] border border-rose-900/20 focus:border-rose-500/50 rounded-lg py-3 px-3 text-rose-400 text-right font-mono text-sm focus:ring-1 focus:ring-rose-500/20 outline-none transition-all"
                 />
               </div>
               <div>
                 <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block tracking-wide text-emerald-400">Take Profit</label>
                 <input 
                   type="number" 
                   step="0.0001"
                   value={takeProfit}
                   onChange={(e) => setTakeProfit(e.target.value)}
                   className="w-full bg-[#020617] border border-emerald-900/20 focus:border-emerald-500/50 rounded-lg py-3 px-3 text-emerald-400 text-right font-mono text-sm focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleExecute('SELL')}
                disabled={isExecuting}
                className="group relative bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-900/30 transition-all active:scale-[0.98]"
              >
                 <span className="relative flex justify-center items-center gap-2 text-sm tracking-wider">{isExecuting ? '...' : 'SELL'}</span>
              </button>
              <button
                onClick={() => handleExecute('BUY')}
                disabled={isExecuting}
                className="group relative bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
              >
                 <span className="relative flex justify-center items-center gap-2 text-sm tracking-wider">{isExecuting ? '...' : 'BUY'}</span>
              </button>
            </div>
          </div>
        )}

        {/* PARSER TAB */}
        {tab === 'parser' && (
          <div className="space-y-4 h-full flex flex-col animate-in fade-in duration-300">
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-3 flex gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0 h-fit">
                <Clipboard size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-indigo-200 font-bold">Smart Parser</p>
                <p className="text-[10px] text-indigo-300/70 leading-tight mt-0.5">Paste signals from Telegram/WhatsApp. AI extracts price, SL, and TP.</p>
              </div>
            </div>
            <textarea
              className="flex-1 w-full bg-[#020617] border border-slate-800 rounded-xl p-4 text-sm text-slate-300 font-mono focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all focus:border-indigo-500/50"
              placeholder="Paste signal text here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <button
              onClick={handleParseSignal}
              className="w-full bg-slate-800 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Zap size={16} /> Extract Data
            </button>
          </div>
        )}

        {/* AUTO BOT TAB */}
        {tab === 'auto' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className={`p-5 rounded-2xl border transition-all duration-500 ${isAutoTrading ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/30 border-slate-700'}`}>
               <div className="flex items-center justify-between mb-2">
                 <h4 className="text-sm font-bold text-white flex items-center gap-2">
                   <Zap size={16} className={isAutoTrading ? 'text-emerald-400 fill-emerald-400' : 'text-slate-500'} />
                   Algorithmic Execution
                 </h4>
                 <button
                   onClick={() => {
                      onAutoTradeToggle(!isAutoTrading);
                      notify('info', isAutoTrading ? 'Auto-Trading Disabled' : 'Auto-Trading Enabled', isAutoTrading ? 'Bot execution paused.' : 'Bot active.');
                   }}
                   className={`shrink-0 w-12 h-6 rounded-full p-0.5 transition-all duration-300 border ${isAutoTrading ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-950 border-slate-700'}`}
                 >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isAutoTrading ? 'translate-x-6' : 'translate-x-0.5'}`} />
                 </button>
               </div>
               <p className="text-[10px] text-slate-400">
                 {isAutoTrading ? 'Bot is analyzing price action for high-probability setups.' : 'Execution engine is offline.'}
               </p>
            </div>

            <div className="space-y-4 px-1">
                 <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                   <Settings2 size={12} /> Strategy Parameters
                 </h4>
                 <div>
                    <label className="text-[10px] text-slate-400 uppercase mb-1.5 block font-bold">Fixed Lot</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={autoTradeConfig.lotSize} 
                      onChange={e => updateAutoConfig('lotSize', parseFloat(e.target.value))}
                      className="w-full bg-[#020617] border border-slate-800 rounded-lg p-3 text-sm text-white font-mono focus:border-indigo-500/50 focus:outline-none"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-[10px] text-slate-400 uppercase mb-1.5 block font-bold">SL (Pips)</label>
                      <input 
                        type="number" 
                        value={autoTradeConfig.stopLossPips} 
                        onChange={e => updateAutoConfig('stopLossPips', parseFloat(e.target.value))}
                        className="w-full bg-[#020617] border border-slate-800 rounded-lg p-3 text-sm text-white font-mono focus:border-indigo-500/50 focus:outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] text-slate-400 uppercase mb-1.5 block font-bold">TP (Pips)</label>
                      <input 
                        type="number" 
                        value={autoTradeConfig.takeProfitPips} 
                        onChange={e => updateAutoConfig('takeProfitPips', parseFloat(e.target.value))}
                        className="w-full bg-[#020617] border border-slate-800 rounded-lg p-3 text-sm text-white font-mono focus:border-indigo-500/50 focus:outline-none"
                      />
                   </div>
                 </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === 'alerts' && (
          <div className="space-y-5 h-full flex flex-col animate-in fade-in duration-300">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
              <label className="text-[10px] text-slate-400 uppercase font-bold mb-2 block tracking-widest">Set Price Trigger</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.0001"
                  value={alertTarget} 
                  onChange={e => setAlertTarget(e.target.value)} 
                  className="w-full bg-[#020617] border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-white focus:ring-1 focus:ring-blue-500/50 outline-none" 
                  placeholder="0.00000"
                />
                <button 
                  onClick={handleSetAlert}
                  className="px-5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-xs transition-colors shadow-lg shadow-blue-900/20"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 mb-3">Active Alerts</h4>
              {priceAlerts.length === 0 && (
                 <div className="text-center py-8 opacity-50">
                   <Bell size={32} className="mx-auto mb-2 text-slate-600" />
                   <p className="text-xs text-slate-500">No active alerts</p>
                 </div>
              )}
              {priceAlerts.filter(a => a.pair === activePair).map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-[#020617] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alert.condition === 'ABOVE' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_8px_currentColor]`} />
                    <span className="text-xs font-mono font-bold text-slate-200">{alert.target}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-500 font-bold uppercase bg-white/5 px-1.5 py-0.5 rounded">{alert.condition}</span>
                    <button 
                      onClick={() => deleteAlert(alert.id)}
                      className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};