import React, { useState, useEffect } from 'react';
import { Zap, Clipboard, Bell, ArrowRightLeft, Briefcase, Wallet, Trash2, XCircle, RefreshCw } from 'lucide-react';
import { BrokerConfig, TradeOrder, AutoTradeConfig, MetaAccountInfo, MetaPosition } from '../../types';
import { parseSignalText, executeBrokerTrade, closeMetaApiPosition, getPairSettings } from '../../services/forexService';
import { ToastType } from '../ui/Toast';

interface TradePanelProps {
  activePair: string;
  currentPrice: number;
  brokerConfig: BrokerConfig | null;
  onAutoTradeToggle: (enabled: boolean) => void;
  isAutoTrading: boolean;
  notify: (type: ToastType, title: string, message: string) => void;
  autoTradeConfig: AutoTradeConfig;
  onUpdateAutoConfig: (config: AutoTradeConfig) => void;
  beginnerMode: boolean;
  accountInfo: MetaAccountInfo | null;
  positions: MetaPosition[];
  onRefreshBrokerData: () => void;
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
  brokerConfig,
  onAutoTradeToggle,
  isAutoTrading,
  notify,
  autoTradeConfig,
  onUpdateAutoConfig,
  beginnerMode,
  accountInfo,
  positions,
  onRefreshBrokerData
}) => {
  const [tab, setTab] = useState<'manual' | 'portfolio' | 'parser' | 'auto' | 'alerts'>('manual');
  
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [alertTarget, setAlertTarget] = useState<string>('');

  useEffect(() => {
    const { digits, pipValue } = getPairSettings(activePair);
    const basePrice = currentPrice || (activePair.includes('JPY') ? 145.00 : 1.1000);
    
    // Only set default if empty to allow typing
    if(!stopLoss) setStopLoss((basePrice - 50 * pipValue).toFixed(digits));
    if(!takeProfit) setTakeProfit((basePrice + 100 * pipValue).toFixed(digits));
    if(!alertTarget) setAlertTarget(basePrice.toFixed(digits));
  }, [activePair]); 

  // Monitor Price Alerts
  useEffect(() => {
    if (priceAlerts.length === 0) return;
    
    setPriceAlerts(prev => {
      const remaining: PriceAlert[] = [];
      prev.forEach(alert => {
        if (alert.pair !== activePair) {
          remaining.push(alert);
          return;
        }

        let triggered = false;
        if (alert.condition === 'ABOVE' && currentPrice >= alert.target) triggered = true;
        if (alert.condition === 'BELOW' && currentPrice <= alert.target) triggered = true;

        if (triggered) {
          notify('info', 'Price Alert', `${activePair} reached ${alert.target}`);
        } else {
          remaining.push(alert);
        }
      });
      return remaining;
    });
  }, [currentPrice, activePair, notify]);

  const validateOrder = (type: 'BUY' | 'SELL'): boolean => {
      if (lotSize <= 0) {
          notify('error', 'Invalid Volume', 'Lot size must be greater than 0');
          return false;
      }
      
      const sl = parseFloat(stopLoss);
      const tp = parseFloat(takeProfit);

      if (stopLoss && !isNaN(sl)) {
          if (sl < 0) {
             notify('error', 'Invalid SL', 'Stop Loss cannot be negative');
             return false;
          }
          if (type === 'BUY' && sl >= currentPrice) {
              notify('warning', 'Risk Warning', 'For BUY orders, SL should typically be below current price.');
              // We allow it but warn, as buy stop orders exist, but this is market execution context usually
          }
          if (type === 'SELL' && sl <= currentPrice) {
              notify('warning', 'Risk Warning', 'For SELL orders, SL should typically be above current price.');
          }
      }

      if (takeProfit && !isNaN(tp)) {
          if (tp < 0) {
             notify('error', 'Invalid TP', 'Take Profit cannot be negative');
             return false;
          }
      }

      return true;
  };

  const handleExecute = async (type: 'BUY' | 'SELL') => {
    if (!brokerConfig) {
      notify('error', 'Configuration Missing', 'Please connect your broker account in Settings.');
      return;
    }
    
    if (!validateOrder(type)) return;

    setIsExecuting(true);
    try {
      const order: TradeOrder = {
        symbol: activePair,
        actionType: type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
        volume: lotSize,
        stopLoss: parseFloat(stopLoss) || undefined,
        takeProfit: parseFloat(takeProfit) || undefined
      };
      await executeBrokerTrade(brokerConfig, order);
      notify('success', 'Order Sent', `Successfully sent ${type} request to ${brokerConfig.type}.`);
      onRefreshBrokerData();
    } catch (error: any) {
      notify('error', 'Trade Failed', error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClosePosition = async (id: string) => {
      if (!brokerConfig) return;
      try {
          await closeMetaApiPosition(brokerConfig, id);
          notify('success', 'Position Closed', 'Trade closed successfully.');
          onRefreshBrokerData();
      } catch (e: any) {
          notify('error', 'Close Failed', e.message);
      }
  };

  const handleParseSignal = () => {
    const signal = parseSignalText(pasteText);
    if (!signal.symbol && !signal.type) {
        notify('warning', 'Parse Error', 'Could not find symbol or direction.');
        return;
    }
    if (signal.symbol) {
       notify('info', 'Signal Pair', `Detected signal for ${signal.symbol}`);
    }
    if (signal.sl) setStopLoss(signal.sl.toString());
    if (signal.tp) setTakeProfit(signal.tp.toString());
    if (signal.entry) notify('info', 'Entry Price', `Signal entry at ${signal.entry}`);
    
    if (signal.type) {
        notify('success', 'Signal Parsed', `Identified ${signal.type}. Params applied.`);
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
    const newAlert: PriceAlert = { id: Math.random().toString(36).substr(2, 9), pair: activePair, target, condition };
    setPriceAlerts(prev => [...prev, newAlert]);
    notify('success', 'Alert Set', `Notification set for ${target}`);
  };

  const deleteAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  };

  const updateAutoConfig = (field: keyof AutoTradeConfig, value: number) => {
    onUpdateAutoConfig({ ...autoTradeConfig, [field]: value });
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden flex flex-col h-full">
      
      {/* Account Summary Header - Always show if configured or just structure */}
      <div className="px-4 py-2 bg-[#09090b] border-b border-[#27272a] flex justify-between items-center text-xs">
          {accountInfo ? (
              <>
                <div className="flex items-center gap-2">
                    <Wallet size={12} className="text-blue-500" />
                    <span className="text-[#a1a1aa]">Balance:</span>
                    <span className="font-mono text-white">${accountInfo.balance.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#a1a1aa]">Equity:</span>
                    <span className={`font-mono font-bold ${accountInfo.equity >= accountInfo.balance ? 'text-green-400' : 'text-red-400'}`}>
                        ${accountInfo.equity.toFixed(2)}
                    </span>
                    <button 
                        onClick={onRefreshBrokerData}
                        className="ml-2 p-1.5 bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] rounded transition-colors"
                        title="Manually Refresh Account Info"
                    >
                        <RefreshCw size={12} />
                    </button>
                </div>
              </>
          ) : (
              <div className="flex justify-between w-full items-center">
                  <span className="text-[#71717a] italic">Broker Not Connected</span>
                   <button 
                        onClick={onRefreshBrokerData}
                        className="ml-2 p-1.5 bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] rounded transition-colors"
                        title="Retry Connection"
                    >
                        <RefreshCw size={12} />
                    </button>
              </div>
          )}
      </div>

      <div className="flex p-1 border-b border-[#27272a]">
        {[
          { id: 'manual', label: 'Trade', icon: ArrowRightLeft },
          { id: 'portfolio', label: 'Positions', icon: Briefcase },
          { id: 'parser', label: 'Parser', icon: Clipboard },
          { id: 'auto', label: 'Auto', icon: Zap },
          { id: 'alerts', label: 'Alerts', icon: Bell }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setTab(item.id as any)}
            className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1.5 relative ${
              tab === item.id 
                ? 'text-blue-500 bg-[#27272a]' 
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50'
            }`}
          >
            <item.icon size={16} />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        
        {tab === 'manual' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-xs font-medium">Current Price</p>
                <p className="text-2xl font-bold font-mono text-white">{currentPrice.toFixed(5)}</p>
              </div>
              <div className="text-right">
                <p className="text-[#a1a1aa] text-xs font-medium">Pair</p>
                <p className="text-lg font-bold text-white">{activePair}</p>
              </div>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-xs font-medium text-[#a1a1aa]">Volume (Lots / Amount)</label>
               {beginnerMode ? (
                 <div className="grid grid-cols-3 gap-2">
                    {[0.01, 0.05, 0.10].map(size => (
                      <button 
                        key={size}
                        onClick={() => setLotSize(size)} 
                        className={`py-2 text-xs font-medium rounded border ${lotSize === size ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#27272a] border-[#3f3f46] text-[#d4d4d8]'}`}
                      >
                        {size}
                      </button>
                    ))}
                 </div>
               ) : (
                 <input 
                   type="number" 
                   step="0.01"
                   min="0.01"
                   value={lotSize}
                   onChange={(e) => setLotSize(parseFloat(e.target.value))}
                   className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white text-sm focus:border-blue-600 outline-none font-mono"
                 />
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-[#a1a1aa]">Stop Loss</label>
                 <input 
                   type="number" 
                   value={stopLoss}
                   onChange={(e) => setStopLoss(e.target.value)}
                   className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-rose-400 text-sm focus:border-rose-500 outline-none font-mono"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-[#a1a1aa]">Take Profit</label>
                 <input 
                   type="number" 
                   value={takeProfit}
                   onChange={(e) => setTakeProfit(e.target.value)}
                   className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-emerald-400 text-sm focus:border-emerald-500 outline-none font-mono"
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleExecute('SELL')}
                disabled={isExecuting}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-lg transition-colors text-sm"
              >
                 {isExecuting ? 'Sending...' : 'Sell / Put'}
              </button>
              <button
                onClick={() => handleExecute('BUY')}
                disabled={isExecuting}
                className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 font-bold py-3 rounded-lg transition-colors text-sm"
              >
                 {isExecuting ? 'Sending...' : 'Buy / Call'}
              </button>
            </div>
          </div>
        )}

        {tab === 'portfolio' && (
            <div className="flex-1 flex flex-col h-[300px] overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white">Open Positions</h3>
                    <button onClick={onRefreshBrokerData} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                        <RefreshCw size={10} /> Refresh
                    </button>
                </div>
                {positions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#71717a]">
                        <Briefcase size={24} className="mb-2 opacity-20" />
                        <p className="text-xs">No active trades</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto pr-2 space-y-2">
                        {positions.map(pos => (
                            <div key={pos.id} className="bg-[#09090b] border border-[#27272a] rounded p-3 text-xs flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">{pos.symbol}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            pos.type.includes('BUY') ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                                        }`}>
                                            {pos.type.includes('BUY') ? 'BUY' : 'SELL'}
                                        </span>
                                    </div>
                                    <p className="text-[#a1a1aa] font-mono">{pos.volume} lots @ {pos.openPrice}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono font-bold mb-1 ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}
                                    </p>
                                    <button 
                                        onClick={() => handleClosePosition(pos.id)}
                                        className="text-[10px] text-[#71717a] hover:text-red-400 flex items-center justify-end gap-1"
                                    >
                                        <XCircle size={10} /> Close
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {tab === 'parser' && (
        <div className="space-y-4">
            <textarea 
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste signal text here...&#10;e.g. BUY EURUSD @ 1.1050 SL 1.1000 TP 1.1200"
            className="w-full h-32 bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white text-xs resize-none focus:border-blue-600 outline-none"
            />
            <button
            onClick={handleParseSignal}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm transition-colors"
            >
            Parse & Apply
            </button>
        </div>
        )}

        {tab === 'auto' && (
        <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
            <div className="flex items-center justify-between bg-[#27272a] p-3 rounded-lg">
            <span className="text-sm font-bold text-white">Master Switch</span>
            <button 
                onClick={() => onAutoTradeToggle(!isAutoTrading)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAutoTrading ? 'bg-green-500' : 'bg-[#3f3f46]'
                }`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAutoTrading ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </button>
            </div>

            {isAutoTrading && (
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2 animate-in fade-in">
                    <RefreshCw size={16} className="text-blue-400 animate-spin mt-0.5" />
                    <div>
                        <h5 className="text-xs font-bold text-blue-100">Multi-Pair Scanner Active</h5>
                        <p className="text-[10px] text-blue-300/80">
                            Bot is actively scanning all 6 major pairs for >70% confidence signals.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#71717a] uppercase">Risk Parameters</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-[#a1a1aa] block mb-1">Lot Size</label>
                        <input 
                        type="number" step="0.01"
                        value={autoTradeConfig.lotSize}
                        onChange={(e) => updateAutoConfig('lotSize', parseFloat(e.target.value))}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded p-2 text-white text-xs"
                        />
                    </div>
                        <div>
                        <label className="text-[10px] text-[#a1a1aa] block mb-1">Stop Loss (Pips)</label>
                        <input 
                        type="number"
                        value={autoTradeConfig.stopLossPips}
                        onChange={(e) => updateAutoConfig('stopLossPips', parseFloat(e.target.value))}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded p-2 text-white text-xs"
                        />
                    </div>
                </div>
            </div>
        </div>
        )}

        {tab === 'alerts' && (
        <div className="space-y-4">
            <div className="flex gap-2">
            <input 
                type="number" 
                value={alertTarget}
                onChange={(e) => setAlertTarget(e.target.value)}
                placeholder="Target Price"
                className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white text-sm outline-none focus:border-blue-600"
            />
            <button 
                onClick={handleSetAlert}
                className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold"
            >
                Set
            </button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {priceAlerts.length === 0 && (
                <p className="text-xs text-[#71717a] text-center py-4">No active price alerts.</p>
            )}
            {priceAlerts.map(alert => (
                <div key={alert.id} className="bg-[#09090b] border border-[#27272a] rounded p-3 flex justify-between items-center text-xs">
                <div>
                    <span className="font-bold text-white">{alert.pair}</span>
                    <span className="text-[#a1a1aa] ml-2">
                        {alert.condition === 'ABOVE' ? '≥' : '≤'} {alert.target.toFixed(5)}
                    </span>
                </div>
                <button onClick={() => deleteAlert(alert.id)} className="text-[#71717a] hover:text-red-400">
                    <Trash2 size={14} />
                </button>
                </div>
            ))}
            </div>
        </div>
        )}
      </div>
    </div>
  );
};