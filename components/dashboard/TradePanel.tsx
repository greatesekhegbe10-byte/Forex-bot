
import React, { useState, useEffect } from 'react';
import { Zap, Clipboard, Bell, ArrowRightLeft, Briefcase, Wallet, Trash2, XCircle } from 'lucide-react';
import { BrokerConfig, TradeOrder, AutoTradeConfig, MetaAccountInfo, MetaPosition } from '../../types';
import { parseSignalText, executeBrokerTrade, closeMetaApiPosition } from '../../services/forexService';
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
    if (activePair && currentPrice) {
      const pip = activePair.includes('JPY') ? 0.01 : 0.0001;
      if (!stopLoss) setStopLoss((currentPrice - 50 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
      if (!takeProfit) setTakeProfit((currentPrice + 100 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
      if (!alertTarget) setAlertTarget(currentPrice.toFixed(activePair.includes('JPY') ? 2 : 4));
    }
  }, [activePair, currentPrice]);

  const handleExecute = async (type: 'BUY' | 'SELL') => {
    if (!brokerConfig) {
      notify('error', 'Configuration Missing', 'Please connect your broker account in Settings.');
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
    if (signal.sl) setStopLoss(signal.sl.toString());
    if (signal.tp) setTakeProfit(signal.tp.toString());
    if (signal.type) {
        notify('success', 'Signal Parsed', `Identified ${signal.type}.`);
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
      
      {/* Account Summary Header */}
      {accountInfo && (
          <div className="px-4 py-2 bg-[#09090b] border-b border-[#27272a] flex justify-between items-center text-xs">
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
              </div>
          </div>
      )}

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
            className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1.5 ${
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
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white">Open Positions</h3>
                    <button onClick={onRefreshBrokerData} className="text-xs text-blue-500 hover:text-blue-400">Refresh</button>
                </div>
                {positions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#52525b]">
                        <Briefcase size={32} className="mb-2 opacity-50" />
                        <p className="text-xs">No open positions.</p>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                        {positions.map(pos => (
                            <div key={pos.id} className="bg-[#27272a] p-3 rounded-lg border border-[#3f3f46]">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{pos.symbol}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${pos.type.includes('BUY') ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                                                {pos.type.includes('BUY') ? 'BUY' : 'SELL'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#a1a1aa] mt-0.5">{pos.volume} lots @ {pos.openPrice}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-mono font-bold ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${pos.profit.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleClosePosition(pos.id)}
                                    className="w-full py-1.5 bg-[#3f3f46] hover:bg-red-500/20 hover:text-red-400 text-xs text-[#d4d4d8] rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle size={12} /> Close Position
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {tab === 'parser' && (
          <div className="space-y-4">
            <div className="bg-[#27272a] rounded-lg p-3">
                <p className="text-xs text-[#d4d4d8] leading-relaxed">
                  Paste your signal text below. The system will automatically extract Entry, Stop Loss, and Take Profit levels.
                </p>
            </div>
            <textarea
              className="w-full h-32 bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-sm text-white font-mono focus:border-blue-600 outline-none resize-none"
              placeholder="EURUSD BUY @ 1.0500..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <button
              onClick={handleParseSignal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Extract Signal
            </button>
          </div>
        )}

        {tab === 'auto' && (
          <div className="space-y-5 overflow-y-auto pr-1 max-h-[400px]">
            <div className="flex items-center justify-between p-4 bg-[#27272a]/50 rounded-lg border border-[#27272a]">
               <div>
                 <h4 className="text-sm font-bold text-white">Auto-Trading</h4>
                 <p className="text-xs text-[#a1a1aa] mt-1">
                   {isAutoTrading ? 'System is active' : 'System is paused'}
                 </p>
               </div>
               <button
                   onClick={() => {
                      onAutoTradeToggle(!isAutoTrading);
                      notify('info', isAutoTrading ? 'Paused' : 'Active', 'Trading status updated');
                   }}
                   className={`w-10 h-5 rounded-full p-0.5 transition-all ${isAutoTrading ? 'bg-green-500' : 'bg-[#3f3f46]'}`}
                 >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isAutoTrading ? 'translate-x-5' : 'translate-x-0'}`} />
               </button>
            </div>

            <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#a1a1aa]">Lot Size</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={autoTradeConfig.lotSize} 
                      onChange={e => updateAutoConfig('lotSize', parseFloat(e.target.value))}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white font-mono focus:border-blue-600 outline-none"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#a1a1aa]">Stop Loss (Pips)</label>
                      <input 
                        type="number" 
                        value={autoTradeConfig.stopLossPips} 
                        onChange={e => updateAutoConfig('stopLossPips', parseFloat(e.target.value))}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white font-mono focus:border-blue-600 outline-none"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#a1a1aa]">Take Profit (Pips)</label>
                      <input 
                        type="number" 
                        value={autoTradeConfig.takeProfitPips} 
                        onChange={e => updateAutoConfig('takeProfitPips', parseFloat(e.target.value))}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white font-mono focus:border-blue-600 outline-none"
                      />
                   </div>
                 </div>
                 
                 <div className="space-y-1.5 pt-2 border-t border-[#27272a]">
                    <label className="text-xs font-medium text-[#a1a1aa]">Max Daily Loss (%)</label>
                    <input 
                      type="number" 
                      value={autoTradeConfig.maxDailyLoss} 
                      onChange={e => updateAutoConfig('maxDailyLoss', parseFloat(e.target.value))}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white font-mono focus:border-blue-600 outline-none"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#a1a1aa]">Start Hour (0-23)</label>
                      <input 
                        type="number" 
                        min="0" max="23"
                        value={autoTradeConfig.tradingStartHour} 
                        onChange={e => updateAutoConfig('tradingStartHour', parseFloat(e.target.value))}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white font-mono focus:border-blue-600 outline-none"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#a1a1aa]">End Hour (0-23)</label>
                      <input 
                        type="number" 
                        min="0" max="23"
                        value={autoTradeConfig.tradingEndHour} 
                        onChange={e => updateAutoConfig('tradingEndHour', parseFloat(e.target.value))}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white font-mono focus:border-blue-600 outline-none"
                      />
                   </div>
                 </div>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex gap-2">
              <input 
                type="number" 
                step="0.0001"
                value={alertTarget} 
                onChange={e => setAlertTarget(e.target.value)} 
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-sm font-mono text-white focus:border-blue-600 outline-none" 
                placeholder="Price..."
              />
              <button 
                onClick={handleSetAlert}
                className="px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-xs transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {priceAlerts.length === 0 && (
                 <p className="text-xs text-[#52525b] text-center py-4">No active alerts</p>
              )}
              {priceAlerts.filter(a => a.pair === activePair).map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-[#27272a] p-3 rounded-lg border border-[#3f3f46]">
                  <span className="text-xs font-mono text-white">{alert.target}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#a1a1aa] font-bold uppercase">{alert.condition}</span>
                    <button onClick={() => deleteAlert(alert.id)} className="text-[#71717a] hover:text-red-400">
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
