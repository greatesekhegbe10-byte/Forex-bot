export enum StrategyType {
  MA_CROSSOVER = 'MA_CROSSOVER',
  RSI = 'RSI',
  COMBINED = 'COMBINED',
}

export enum Trend {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL',
}

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

export interface Candle {
  time: string; // ISO string or formatted time
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma50?: number;
  ma200?: number;
  rsi?: number;
}

export interface MarketAnalysis {
  pair: string;
  currentPrice: number;
  ma50: number;
  ma200: number;
  rsi: number;
  trend: Trend;
  signal: SignalType;
  confidence: number; // 0-100
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
  maxDrawdown: number;
  history: {
    time: string;
    type: SignalType;
    price: number;
    profit: number;
  }[];
}

export interface GeminiAnalysisResult {
  summary: string;
  sentiment: string;
  keyLevels: string[];
  actionableAdvice: string;
}
