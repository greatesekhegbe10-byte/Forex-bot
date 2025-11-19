import { Candle, SignalType, StrategyType, BacktestResult, Trend, MarketAnalysis } from '../types';

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

// --- Data Generation ---

export const generateMarketData = (pair: string = 'EUR/USD', count: number = 300): Candle[] => {
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['EUR/USD'];
  const { initialPrice, volatility } = config;
  
  const data: Candle[] = [];
  let currentPrice = initialPrice;
  const now = new Date();

  // Generate base candles
  const prices: number[] = [];
  
  // Pre-generate prices to calculate indicators
  for (let i = 0; i < count + 200; i++) { // Buffer for MA200
    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;
    // Ensure price doesn't go negative (unlikely with forex but good practice)
    if(currentPrice < 0.0001) currentPrice = initialPrice;
    prices.push(currentPrice);
  }

  // Create Candle objects with indicators
  for (let i = 200; i < prices.length; i++) {
    const close = prices[i];
    const open = prices[i-1]; // Simplified
    const high = Math.max(open, close) + Math.random() * (volatility * 0.3);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.3);
    
    const time = new Date(now.getTime() - (prices.length - i) * 60 * 60 * 1000).toISOString(); // Hourly candles backwards
    
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

// --- Analysis Logic ---

export const analyzeMarket = (candle: Candle, prevCandle: Candle, pair: string): MarketAnalysis => {
  const ma50 = candle.ma50 || 0;
  const ma200 = candle.ma200 || 0;
  const rsi = candle.rsi || 50;
  const prevMa50 = prevCandle.ma50 || 0;
  const prevMa200 = prevCandle.ma200 || 0;

  let signal = SignalType.HOLD;
  let trend = Trend.NEUTRAL;
  let confidence = 50;

  // Trend Determination
  if (ma50 > ma200) trend = Trend.BULLISH;
  else if (ma50 < ma200) trend = Trend.BEARISH;

  // MA Crossover Logic
  const goldenCross = prevMa50 < prevMa200 && ma50 > ma200;
  const deathCross = prevMa50 > prevMa200 && ma50 < ma200;

  // RSI Logic
  const rsiOversold = rsi < 30;
  const rsiOverbought = rsi > 70;

  // Combined Signal Logic
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

    // Ensure both current and previous candles have valid indicators
    if (!current.ma50 || !current.ma200 || !current.rsi || !prev.ma50 || !prev.ma200 || !prev.rsi) {
      continue;
    }

    let signal = SignalType.HOLD;

    // Strategy Logic
    if (strategy === StrategyType.MA_CROSSOVER) {
      if (prev.ma50 < prev.ma200 && current.ma50 > current.ma200) signal = SignalType.BUY;
      if (prev.ma50 > prev.ma200 && current.ma50 < current.ma200) signal = SignalType.SELL;
    } else if (strategy === StrategyType.RSI) {
      if (current.rsi < 30) signal = SignalType.BUY;
      if (current.rsi > 70) signal = SignalType.SELL;
    } else if (strategy === StrategyType.COMBINED) {
       const trend = current.ma50 > current.ma200 ? 'BULL' : 'BEAR';
       if (trend === 'BULL' && current.rsi < 30) signal = SignalType.BUY;
       if (trend === 'BEAR' && current.rsi > 70) signal = SignalType.SELL;
       
       // Close positions on reverse crossover
       if (position === 'LONG' && prev.ma50 > prev.ma200 && current.ma50 < current.ma200) signal = SignalType.SELL;
       if (position === 'SHORT' && prev.ma50 < prev.ma200 && current.ma50 > current.ma200) signal = SignalType.BUY;
    }

    // Execution Logic (Simplified)
    if (signal === SignalType.BUY && position !== 'LONG') {
      if (position === 'SHORT') {
        // Close Short
        const pnl = (entryPrice - current.close) * 10000; // Standard lot approximation
        balance += pnl;
        if (pnl > 0) wins++; else losses++;
        history.push({ time: current.time, type: SignalType.BUY, price: current.close, profit: pnl });
        position = 'NONE';
      }
      // Open Long
      position = 'LONG';
      entryPrice = current.close;
    } else if (signal === SignalType.SELL && position !== 'SHORT') {
       if (position === 'LONG') {
        // Close Long
        const pnl = (current.close - entryPrice) * 10000;
        balance += pnl;
        if (pnl > 0) wins++; else losses++;
        history.push({ time: current.time, type: SignalType.SELL, price: current.close, profit: pnl });
        position = 'NONE';
      }
      // Open Short
      position = 'SHORT';
      entryPrice = current.close;
    }

    // Track stats
    if (balance > peakBalance) peakBalance = balance;
    const drawdown = ((peakBalance - balance) / peakBalance) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

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