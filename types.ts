
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
  time: string; // ISO string
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

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface MetaApiConfig {
  accountId: string;
  accessToken: string;
  region: string; // e.g., 'new-york', 'london'
}

export interface AppSettings {
  appName: string;
  domainUrl: string;
}

export interface TradeOrder {
  symbol: string;
  actionType: 'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL';
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

export interface ParsedSignal {
  symbol?: string;
  type?: 'BUY' | 'SELL';
  entry?: number;
  sl?: number;
  tp?: number;
}
