
import React, { useState, useEffect } from 'react';
import { Zap, Clipboard, PlayCircle, AlertOctagon, Calculator, CheckCircle2 } from 'lucide-react';
import { MetaApiConfig, TradeOrder } from '../../types';
import { parseSignalText, executeMetaApiTrade } from '../../services/forexService';
import { ToastType } from '../ui/Toast';

interface TradePanelProps {
  activePair: string;
  currentPrice: number;
  metaApiConfig: MetaApiConfig | null;
  onAutoTradeToggle: (enabled: boolean) => void;
  isAutoTrading: boolean;
  notify: (type: ToastType, title: string, message: string) => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({ 
  activePair, 
  currentPrice, 
  metaApiConfig,
  onAutoTradeToggle,
  isAutoTrading,
  notify
}) => {
  const [tab, setTab] = useState<'manual' | 'parser' | 'auto'>('manual');
  
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

  useEffect(() => {
    if (activePair && currentPrice) {
      const pip = activePair.includes('JPY') ? 0.01 : 0.0001;
      setStopLoss((currentPrice - 50 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
      setTakeProfit((currentPrice + 100 * pip).toFixed(activePair.includes('JPY') ? 2 : 4));
    }
  }, [activePair, currentPrice]);

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

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-700">
        <button 
          onClick={() => setTab('manual')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            tab === 'manual' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750'
          }`}
        >
          Trade
        </button>
        <button 
          onClick={() => setTab('parser')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            tab === 'parser' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750'
          }`}
        >
          Signal Parser
        </button>
        <button 
          onClick={() => setTab('auto')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            tab === 'auto' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-750'
          }`}
        >
          Auto-Bot
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
            {/* Calculator */}
            <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
              <h4 className="text-xs text-slate-400 font-bold uppercase mb-3 flex items-center gap-2">
                <Calculator size={14} /> Position Calculator
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Balance</label>
                  <input type="number" value={accountBalance} onChange={e => setAccountBalance(parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Risk %</label>
                  <input type="number" value={riskPercent} onChange={e => setRiskPercent(parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
                </div>
              </div>
              <div className="mb-3">
                  <label className="text-[10px] text-slate-500 uppercase">Stop Loss (Pips)</label>
                  <input type="number" value={slPips} onChange={e => setSlPips(parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-sm" />
              </div>
              <button 
                onClick={calculateRisk}
                className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold text-white mb-3"
              >
                Calculate Lots
              </button>
              <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                <span className="text-xs text-slate-400">Result:</span>
                <span className="text-lg font-bold text-white">{lotSize} Lots</span>
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
                   {isAutoTrading ? 'Bot will execute signals automatically.' : 'Signals require manual confirmation.'}
                 </p>
               </div>
               <button
                 onClick={() => {
                    onAutoTradeToggle(!isAutoTrading);
                    notify('info', isAutoTrading ? 'Auto-Trading Disabled' : 'Auto-Trading Enabled', isAutoTrading ? 'Bot will no longer execute trades.' : 'Bot is now active.');
                 }}
                 className={`w-12 h-6 rounded-full p-1 transition-colors ${isAutoTrading ? 'bg-green-500' : 'bg-slate-700'}`}
               >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isAutoTrading ? 'translate-x-6' : 'translate-x-0'}`} />
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
