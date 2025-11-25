

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

export enum SubscriptionStatus {
  FREE = 'FREE',
  PENDING = 'PENDING',
  PRO = 'PRO'
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscription: SubscriptionStatus;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export enum BrokerType {
  MT5 = 'MT5',
  IQ_OPTION = 'IQ_OPTION',
  POCKET_OPTION = 'POCKET_OPTION',
  CUSTOM_WEBHOOK = 'CUSTOM_WEBHOOK'
}

export interface BrokerConfig {
  type: BrokerType;
  // MT5 Specifics
  accountId?: string;
  accessToken?: string;
  region?: string; 
  // Other Brokers (Webhook/Bridge)
  webhookUrl?: string;
  apiKey?: string;
}

export interface AppSettings {
  appName: string;
  domainUrl: string;
  beginnerMode: boolean;
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

export interface AutoTradeConfig {
  lotSize: number;
  stopLossPips: number;
  takeProfitPips: number;
  maxSpreadPips: number;
  maxDailyLoss: number;
  tradingStartHour: number; // 0-23
  tradingEndHour: number;   // 0-23
}

export interface MetaAccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  leverage: number;
}

export interface MetaPosition {
  id: string;
  symbol: string;
  type: 'POSITION_TYPE_BUY' | 'POSITION_TYPE_SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  time: string;
}

export interface PaymentRequest {
  senderName: string;
  amount: number;
  date: string;
  reference: string;
}
