
import { Candle, SignalType, StrategyType, BacktestResult, Trend, MarketAnalysis, MetaApiConfig, TradeOrder, ParsedSignal } from '../types';
import { logger } from './logger';

// --- Constants ---
const PAIR_CONFIGS: Record<string, { initialPrice: number, volatility: number }> = {
  'EUR/USD': { initialPrice: 1.1000, volatility: 0.0015 },
  'GBP/USD': { initialPrice: 1.2700, volatility: 0.0020 },
  'USD/JPY': { initialPrice: 148.50, volatility: 0.1500 },
  'USD/CHF': { initialPrice: 0.8850, volatility: 0.0012 },
  'AUD/USD': { initialPrice: 0.6550, volatility: 0.0010 },
  'USD/CAD': { initialPrice: 1.3500, volatility: 0.0018 },
};

// --- Helper Math Functions ---

export const calculateSMA = (data: number[], period: number): number | undefined => {
  if (data.length < period) return undefined;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
};

export const calculateRSI = (closes: number[], period: number = 14): number | undefined => {
  if (closes.length < period + 1) return undefined;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smooth subsequent values
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// --- Data Generation (Fallback) ---

export const generateMarketData = (pair: string = 'EUR/USD', count: number = 300): Candle[] => {
  // logger.debug(`Generating simulation data for ${pair}`);
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['EUR/USD'];
  const { initialPrice, volatility } = config;
  
  const data: Candle[] = [];
  let currentPrice = initialPrice;
  const now = new Date();

  const prices: number[] = [];
  
  for (let i = 0; i < count + 200; i++) {
    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;
    if(currentPrice < 0.0001) currentPrice = initialPrice;
    prices.push(currentPrice);
  }

  for (let i = 200; i < prices.length; i++) {
    const close = prices[i];
    const open = prices[i-1]; 
    const high = Math.max(open, close) + Math.random() * (volatility * 0.3);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.3);
    
    const time = new Date(now.getTime() - (prices.length - i) * 60 * 60 * 1000).toISOString();
    
    const historySlice = prices.slice(0, i + 1);

    data.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000 + 500),
      ma50: calculateSMA(historySlice, 50),
      ma200: calculateSMA(historySlice, 200),
      rsi: calculateRSI(historySlice, 14)
    });
  }

  return data;
};

// --- MetaAPI Data Fetching ---

export const fetchMetaApiCandles = async (
  config: MetaApiConfig, 
  pair: string, 
  timeframe: string = '1h', 
  count: number = 300
): Promise<Candle[]> => {
  const symbol = pair.replace('/', '');
  const region = config.region || 'new-york';
  const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`; 
  
  logger.info(`Fetching MetaAPI candles`, { pair, timeframe, region });

  try {
    if (!config.accountId || !config.accessToken) {
        throw new Error("Missing MetaAPI Account ID or Access Token.");
    }

    const startTime = new Date(Date.now() - (count * 60 * 60 * 1000));
    const url = `${baseUrl}/users/current/accounts/${config.accountId}/history-candles?symbol=${symbol}&timeframe=${timeframe}&startTime=${startTime.toISOString()}&limit=${count}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'auth-token': config.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`MetaAPI Fetch Error: ${response.status}`, errorText);
      throw new Error(`MetaAPI Error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    const rawCandles = Array.isArray(json) ? json : (json.payload || []);
    
    if (rawCandles.length === 0) {
        logger.warn("MetaAPI returned no candles.", { pair });
        return [];
    }

    const prices: number[] = [];
    const candles: any[] = rawCandles.map((c: any) => {
      const close = c.close || c.c;
      prices.push(close);
      return {
        time: c.time || c.t,
        open: c.open || c.o,
        high: c.high || c.h,
        low: c.low || c.l,
        close: close,
        volume: c.tickVolume || c.v || 0
      };
    });

    const finalData: Candle[] = candles.map((c, index) => {
      const historySlice = prices.slice(0, index + 1);
      return {
        ...c,
        ma50: calculateSMA(historySlice, 50),
        ma200: calculateSMA(historySlice, 200),
        rsi: calculateRSI(historySlice, 14)
      };
    });

    logger.info(`Successfully processed ${finalData.length} candles from MetaAPI.`);
    return finalData.filter(c => c.ma200 !== undefined);

  } catch (error: any) {
    logger.error("MetaAPI Connection Failed", error.message);
    throw error;
  }
};

// --- Trade Execution ---

export const executeMetaApiTrade = async (config: MetaApiConfig, order: TradeOrder) => {
  const region = config.region || 'new-york';
  const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`; 
  
  logger.info(`Initiating Trade Execution`, order);

  try {
    if (!config.accountId || !config.accessToken) {
        throw new Error("Invalid Broker Configuration");
    }

    const url = `${baseUrl}/users/current/accounts/${config.accountId}/trade`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'auth-token': config.accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: order.symbol.replace('/', ''),
        actionType: order.actionType,
        volume: order.volume,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        comment: order.comment || 'ForexBotPro Auto'
      })
    });

    if (!response.ok) {
       const err = await response.text();
       logger.error(`Trade Execution Failed: ${response.status}`, err);
       throw new Error(`Trade Failed: ${err}`);
    }
    
    const result = await response.json();
    logger.info("Trade Executed Successfully", result);
    return result;
  } catch (error: any) {
    logger.error("Trade Execution Error", error.message);
    throw error;
  }
};

// --- Signal Parsing ---

export const parseSignalText = (text: string): ParsedSignal => {
  try {
      const normalizedText = text.toUpperCase().replace(/\//g, '');
      const signal: ParsedSignal = {};

      const pairRegex = /(EURUSD|GBPUSD|USDJPY|USDCAD|AUDUSD|USDCHF|XAUUSD|GOLD|BTCUSD)/;
      const pairMatch = normalizedText.match(pairRegex);
      if (pairMatch) signal.symbol = pairMatch[0];

      if (normalizedText.includes('BUY') || normalizedText.includes('LONG')) signal.type = 'BUY';
      if (normalizedText.includes('SELL') || normalizedText.includes('SHORT')) signal.type = 'SELL';

      const extractNumber = (keywords: string[]) => {
        for (const kw of keywords) {
          // Use regex constructor cautiously
          const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
          const regex = new RegExp(`${safeKw}\\s*[:@]?\\s*([0-9]+\\.?[0-9]*)`);
          const match = normalizedText.match(regex);
          if (match) return parseFloat(match[1]);
        }
        return undefined;
      };

      signal.sl = extractNumber(['SL', 'STOP LOSS', 'STOP']);
      signal.tp = extractNumber(['TP', 'TAKE PROFIT', 'TARGET']);
      signal.entry = extractNumber(['ENTRY', 'AT', '@', 'PRICE']);

      if (!signal.symbol && !signal.type) {
          logger.warn("Signal parser could not identify pair or direction");
      }

      return signal;
  } catch (e) {
      logger.error("Error parsing signal text", e);
      return {};
  }
};

// --- Analysis Logic ---

export const analyzeMarket = (candle: Candle, prevCandle: Candle, pair: string): MarketAnalysis => {
  const ma50 = candle.ma50 || 0;
  const ma200 = candle.ma200 || 0;
  const rsi = candle.rsi || 50;
  const prevMa50 = prevCandle.ma50 || 0;
  const prevMa200 = prevCandle.ma200 || 0;

  // Safety check for NaN
  if (isNaN(ma50) || isNaN(ma200) || isNaN(rsi)) {
      // logger.warn("Invalid indicator values detected", { candle });
      return {
          pair, currentPrice: candle.close, ma50: 0, ma200: 0, rsi: 50, 
          trend: Trend.NEUTRAL, signal: SignalType.HOLD, confidence: 0
      };
  }

  let signal = SignalType.HOLD;
  let trend = Trend.NEUTRAL;
  let confidence = 50;

  if (ma50 > ma200) trend = Trend.BULLISH;
  else if (ma50 < ma200) trend = Trend.BEARISH;

  const goldenCross = prevMa50 < prevMa200 && ma50 > ma200;
  const deathCross = prevMa50 > prevMa200 && ma50 < ma200;

  const rsiOversold = rsi < 30;
  const rsiOverbought = rsi > 70;

  if (goldenCross || (trend === Trend.BULLISH && rsiOversold)) {
    signal = SignalType.BUY;
    confidence = goldenCross ? 85 : 70;
  } else if (deathCross || (trend === Trend.BEARISH && rsiOverbought)) {
    signal = SignalType.SELL;
    confidence = deathCross ? 85 : 70;
  }

  return {
    pair: pair,
    currentPrice: candle.close,
    ma50,
    ma200,
    rsi,
    trend,
    signal,
    confidence
  };
};

// --- Backtesting Engine ---

export const runBacktest = (data: Candle[], strategy: StrategyType): BacktestResult => {
  logger.info(`Starting backtest`, { strategy, candles: data.length });
  let balance = 10000;
  let position: 'NONE' | 'LONG' | 'SHORT' = 'NONE';
  let entryPrice = 0;
  let wins = 0;
  let losses = 0;
  const history: BacktestResult['history'] = [];
  let peakBalance = balance;
  let maxDrawdown = 0;

  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const prev = data[i-1];

    if (
      current.ma50 === undefined || current.ma200 === undefined || current.rsi === undefined || 
      prev.ma50 === undefined || prev.ma200 === undefined || prev.rsi === undefined
    ) {
      continue;
    }

    let signal = SignalType.HOLD;
    const trend = current.ma50 > current.ma200 ? Trend.BULLISH : Trend.BEARISH;

    if (strategy === StrategyType.MA_CROSSOVER) {
      if (prev.ma50 < prev.ma200 && current.ma50 > current.ma200) signal = SignalType.BUY;
      if (prev.ma50 > prev.ma200 && current.ma50 < current.ma200) signal = SignalType.SELL;
    } else if (strategy === StrategyType.RSI) {
      if (current.rsi < 30) signal = SignalType.BUY;
      if (current.rsi > 70) signal = SignalType.SELL;
    } else if (strategy === StrategyType.COMBINED) {
       if (trend === Trend.BULLISH && current.rsi < 30) signal = SignalType.BUY;
       if (trend === Trend.BEARISH && current.rsi > 70) signal = SignalType.SELL;
       
       if (position === 'LONG' && prev.ma50 > prev.ma200 && current.ma50 < current.ma200) signal = SignalType.SELL;
       if (position === 'SHORT' && prev.ma50 < prev.ma200 && current.ma50 > current.ma200) signal = SignalType.BUY;
    }

    if (signal === SignalType.BUY && position !== 'LONG') {
      if (position === 'SHORT') {
        const pnl = (entryPrice - current.close) * 10000;
        balance += pnl;
        if (pnl > 0) wins++; else losses++;
        history.push({ time: current.time, type: SignalType.BUY, price: current.close, profit: pnl });
        position = 'NONE';
      }
      position = 'LONG';
      entryPrice = current.close;
    } else if (signal === SignalType.SELL && position !== 'SHORT') {
       if (position === 'LONG') {
        const pnl = (current.close - entryPrice) * 10000;
        balance += pnl;
        if (pnl > 0) wins++; else losses++;
        history.push({ time: current.time, type: SignalType.SELL, price: current.close, profit: pnl });
        position = 'NONE';
      }
      position = 'SHORT';
      entryPrice = current.close;
    }

    if (balance > peakBalance) peakBalance = balance;
    const drawdown = ((peakBalance - balance) / peakBalance) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  logger.info(`Backtest completed`, { profit: balance - 10000, trades: wins + losses });

  return {
    totalTrades: wins + losses,
    wins,
    losses,
    winRate: (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0,
    profit: balance - 10000,
    maxDrawdown,
    history
  };
};
