import { Candle, SignalType, StrategyType, BacktestResult, Trend, MarketAnalysis, BrokerConfig, BrokerType, TradeOrder, ParsedSignal, MetaAccountInfo, MetaPosition } from '../types';
import { logger } from './logger';

// --- Constants (Updated to approx. late 2024/2025 Market Levels) ---
const PAIR_CONFIGS: Record<string, { initialPrice: number, volatility: number }> = {
  // Majors
  'EUR/USD': { initialPrice: 1.0850, volatility: 0.0015 },
  'GBP/USD': { initialPrice: 1.3000, volatility: 0.0020 },
  'USD/JPY': { initialPrice: 153.50, volatility: 0.1500 },
  'USD/CHF': { initialPrice: 0.8650, volatility: 0.0012 },
  'AUD/USD': { initialPrice: 0.6600, volatility: 0.0010 },
  'USD/CAD': { initialPrice: 1.3900, volatility: 0.0018 },
  'NZD/USD': { initialPrice: 0.6000, volatility: 0.0011 },

  // Minors
  'EUR/GBP': { initialPrice: 0.8350, volatility: 0.0010 },
  'EUR/JPY': { initialPrice: 165.50, volatility: 0.1600 },
  'GBP/JPY': { initialPrice: 198.00, volatility: 0.2000 },
  'AUD/JPY': { initialPrice: 101.50, volatility: 0.1200 },
  'CAD/JPY': { initialPrice: 110.00, volatility: 0.1300 },
  'CHF/JPY': { initialPrice: 176.00, volatility: 0.1400 },
  'NZD/JPY': { initialPrice: 91.50, volatility: 0.1100 },
  'GBP/CHF': { initialPrice: 1.1250, volatility: 0.0015 },
  'EUR/CHF': { initialPrice: 0.9400, volatility: 0.0010 },
  'AUD/CAD': { initialPrice: 0.9100, volatility: 0.0012 },
  'EUR/CAD': { initialPrice: 1.5000, volatility: 0.0016 },
  'GBP/CAD': { initialPrice: 1.8000, volatility: 0.0022 },
  'AUD/NZD': { initialPrice: 1.1000, volatility: 0.0010 },
  'EUR/AUD': { initialPrice: 1.6400, volatility: 0.0018 },
  'GBP/AUD': { initialPrice: 1.9600, volatility: 0.0025 },
  'EUR/NZD': { initialPrice: 1.8000, volatility: 0.0020 },
  'GBP/NZD': { initialPrice: 2.1600, volatility: 0.0028 },
  'AUD/CHF': { initialPrice: 0.5700, volatility: 0.0009 },
  'CAD/CHF': { initialPrice: 0.6200, volatility: 0.0010 },
  'NZD/CHF': { initialPrice: 0.5200, volatility: 0.0009 },
  'NZD/CAD': { initialPrice: 0.8350, volatility: 0.0011 },

  // Exotics
  'USD/SGD': { initialPrice: 1.3200, volatility: 0.0010 },
  'USD/HKD': { initialPrice: 7.7800, volatility: 0.0005 },
  'USD/TRY': { initialPrice: 34.50, volatility: 0.2500 },
  'USD/ZAR': { initialPrice: 17.50, volatility: 0.1500 },
  'USD/MXN': { initialPrice: 20.20, volatility: 0.0800 },
  'USD/NOK': { initialPrice: 11.00, volatility: 0.0500 },
  'USD/SEK': { initialPrice: 10.80, volatility: 0.0500 },
  'USD/DKK': { initialPrice: 6.9000, volatility: 0.0030 },
  'EUR/TRY': { initialPrice: 37.50, volatility: 0.3000 },
  'EUR/NOK': { initialPrice: 11.80, volatility: 0.0600 },
  'EUR/SEK': { initialPrice: 11.60, volatility: 0.0600 },
  'USD/PLN': { initialPrice: 4.0000, volatility: 0.0200 },
  'EUR/PLN': { initialPrice: 4.3500, volatility: 0.0150 },
  'USD/HUF': { initialPrice: 375.00, volatility: 1.5000 },
  'EUR/HUF': { initialPrice: 405.00, volatility: 1.2000 },
  
  // Metals/Commodities
  'XAU/USD': { initialPrice: 2740.00, volatility: 15.00 }, // Gold (Updated)
  'XAG/USD': { initialPrice: 32.50, volatility: 0.25 },    // Silver
  'XTI/USD': { initialPrice: 70.00, volatility: 0.80 },    // Oil
  'XBR/USD': { initialPrice: 74.00, volatility: 0.80 },    // Brent Oil

  // Crypto
  'BTC/USD': { initialPrice: 71000.00, volatility: 800.00 }, // BTC Updated
  'ETH/USD': { initialPrice: 2600.00, volatility: 50.00 },
  'LTC/USD': { initialPrice: 70.00, volatility: 1.50 },
  'XRP/USD': { initialPrice: 0.5200, volatility: 0.0100 },
  'SOL/USD': { initialPrice: 165.00, volatility: 3.00 },
  'BNB/USD': { initialPrice: 590.00, volatility: 8.00 },
  'ADA/USD': { initialPrice: 0.3500, volatility: 0.0080 },
  'DOGE/USD': { initialPrice: 0.1400, volatility: 0.0050 },
};

// Helper to determine decimals and pip value based on pair type
export const getPairSettings = (pair: string) => {
  if (pair.includes('JPY') || pair.includes('XAU') || pair.includes('XAG') || pair.includes('XTI') || pair.includes('XBR')) {
    return { digits: 2, pipValue: 0.01 };
  }
  if (pair.includes('BTC') || pair.includes('ETH') || pair.includes('SOL') || pair.includes('BNB') || pair.includes('LTC')) {
    return { digits: 2, pipValue: 0.01 };
  }
  if (pair.includes('XRP') || pair.includes('DOGE') || pair.includes('ADA')) {
    return { digits: 4, pipValue: 0.0001 };
  }
  if (pair.includes('HUF')) {
    return { digits: 2, pipValue: 0.01 };
  }
  // Standard Forex
  return { digits: 4, pipValue: 0.0001 };
};

// --- Helper: Robust Fetch with Retry ---
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, backoff = 500): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Retry on server errors (5xx) or rate limits (429)
    if (!response.ok && (response.status >= 500 || response.status === 429)) {
       throw new Error(`Server status: ${response.status}`);
    }
    return response;
  } catch (err: any) {
    if (retries > 0) {
      logger.debug(`Retrying request to ${url} (${retries} left)...`);
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    }
    // Final error
    throw err;
  }
}

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

export const calculateEMA = (data: number[], period: number): number[] => {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray = [data[0]]; // Start with first price as approximate EMA
  for (let i = 1; i < data.length; i++) {
    const ema = data[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
};

export const calculateMACD = (closes: number[]) => {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const macdLine = closes.map((_, i) => (ema12[i] !== undefined && ema26[i] !== undefined) ? ema12[i] - ema26[i] : 0);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((m, i) => m - (signalLine[i] || 0));

  return { macdLine, signalLine, histogram };
};

export const calculateATR = (highs: number[], lows: number[], closes: number[], period: number = 14): number[] => {
  if (highs.length < 2) return new Array(highs.length).fill(0);

  const trs = [highs[0] - lows[0]]; // First TR
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }

  // Calculate ATR using SMA of TRs for simplicity/stability
  const atrs: number[] = [];
  let sum = 0;
  for (let i = 0; i < trs.length; i++) {
    sum += trs[i];
    if (i < period) {
      atrs.push(sum / (i + 1));
    } else {
      sum -= trs[i - period];
      atrs.push(sum / period);
    }
  }
  return atrs;
};

// --- Live Public Data Fetcher (Seed Price) ---

export const fetchPublicCurrentPrice = async (pair: string): Promise<number | null> => {
  try {
    // 1. Crypto Handling (CoinCap API - Free, No Key)
    const cryptoMap: Record<string, string> = {
      'BTC/USD': 'bitcoin', 'ETH/USD': 'ethereum', 'LTC/USD': 'litecoin', 
      'XRP/USD': 'xrp', 'SOL/USD': 'solana', 'BNB/USD': 'binance-coin', 
      'ADA/USD': 'cardano', 'DOGE/USD': 'dogecoin'
    };
    
    if (cryptoMap[pair]) {
      const response = await fetchWithRetry(`https://api.coincap.io/v2/assets/${cryptoMap[pair]}`, {}, 1);
      if (response.ok) {
        const json = await response.json();
        const price = parseFloat(json.data.priceUsd);
        if (!isNaN(price)) return price;
      }
    }

    // 2. Forex/Metals Handling (Open Exchange Rates / ER-API - Free, No Key)
    const isForex = !pair.includes('BTC') && !pair.includes('ETH');
    
    if (isForex) {
      const response = await fetchWithRetry('https://open.er-api.com/v6/latest/USD', {}, 1);
      if (response.ok) {
        const json = await response.json();
        const rates = json.rates;
        const [base, quote] = pair.split('/');
        
        let price = 0;
        if (quote === 'USD') {
           const baseRate = rates[base];
           if (baseRate) price = 1 / baseRate;
        } else if (base === 'USD') {
           const quoteRate = rates[quote];
           if (quoteRate) price = quoteRate;
        } else {
           const baseRate = rates[base];
           const quoteRate = rates[quote];
           if (baseRate && quoteRate) {
             price = quoteRate / baseRate;
           }
        }
        if (price > 0) return price;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
};

// --- Data Generation (Fallback) ---

export const generateMarketData = (pair: string = 'EUR/USD', count: number = 300, timeframe: string = '1h', overrideEndPrice?: number): Candle[] => {
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS['EUR/USD'];
  
  let timeMultiplier = 1;
  let intervalMs = 60 * 60 * 1000;

  switch (timeframe) {
    case '1m': timeMultiplier = 0.05; intervalMs = 60 * 1000; break;
    case '5m': timeMultiplier = 0.15; intervalMs = 5 * 60 * 1000; break;
    case '15m': timeMultiplier = 0.3; intervalMs = 15 * 60 * 1000; break;
    case '1h': timeMultiplier = 1; intervalMs = 60 * 60 * 1000; break;
    case '4h': timeMultiplier = 2; intervalMs = 4 * 60 * 60 * 1000; break;
    case '1d': timeMultiplier = 4; intervalMs = 24 * 60 * 60 * 1000; break;
  }

  const { initialPrice, volatility } = config;
  const adjustedVolatility = volatility * timeMultiplier;
  
  const data: Candle[] = [];
  
  let currentPrice = initialPrice;
  const now = new Date();

  const prices: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const closes: number[] = [];
  
  for (let i = 0; i < count + 200; i++) {
    const change = (Math.random() - 0.5) * adjustedVolatility;
    currentPrice += change;
    if(currentPrice < 0.0001) currentPrice = initialPrice;
    prices.push(currentPrice);
  }

  if (overrideEndPrice && prices.length > 0) {
    const lastGenerated = prices[prices.length - 1];
    const difference = overrideEndPrice - lastGenerated;
    for(let i = 0; i < prices.length; i++) {
      prices[i] += difference;
    }
  }

  const rawCandles: any[] = [];
  for (let i = 200; i < prices.length; i++) {
    const close = prices[i];
    const prevClose = prices[i-1];
    
    const open = prevClose; 
    const bodyMax = Math.max(open, close);
    const bodyMin = Math.min(open, close);
    const high = bodyMax + Math.random() * (adjustedVolatility * 0.4);
    const low = bodyMin - Math.random() * (adjustedVolatility * 0.4);
    const time = new Date(now.getTime() - (prices.length - 1 - i) * intervalMs).toISOString();

    rawCandles.push({ time, open, high, low, close });
    highs.push(high);
    lows.push(low);
    closes.push(close);
  }

  const macdData = calculateMACD(closes);
  const atrData = calculateATR(highs, lows, closes, 14);

  for (let i = 0; i < rawCandles.length; i++) {
    const c = rawCandles[i];
    const historySlice = prices.slice(0, i + 201);

    data.push({
      ...c,
      volume: Math.floor(Math.random() * 1000 + 500),
      ma50: calculateSMA(historySlice, 50),
      ma200: calculateSMA(historySlice, 200),
      rsi: calculateRSI(historySlice, 14),
      macd: {
        macdLine: macdData.macdLine[i],
        signalLine: macdData.signalLine[i],
        histogram: macdData.histogram[i]
      },
      atr: atrData[i]
    });
  }

  return data;
};

// --- MetaAPI Data Fetching ---

export const fetchMetaApiCandles = async (
  config: BrokerConfig, 
  pair: string, 
  timeframe: string = '1h', 
  count: number = 300
): Promise<Candle[]> => {
  if (config.type !== BrokerType.MT5 || !config.accountId || !config.accessToken) {
    return [];
  }

  const symbol = pair.replace('/', '');
  const region = config.region || 'new-york';
  const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`; 
  
  logger.info(`Fetching MetaAPI candles`, { pair, timeframe, region });

  try {
    let minutes = count * 60; // default 1h
    if (timeframe === '1m') minutes = count;
    if (timeframe === '5m') minutes = count * 5;
    if (timeframe === '15m') minutes = count * 15;
    if (timeframe === '4h') minutes = count * 240;
    if (timeframe === '1d') minutes = count * 1440;

    const startTime = new Date(Date.now() - (minutes * 60 * 1000));
    const url = `${baseUrl}/users/current/accounts/${config.accountId}/history-candles?symbol=${symbol}&timeframe=${timeframe}&startTime=${startTime.toISOString()}&limit=${count}`;
    
    // Use Retry Mechanism
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'auth-token': config.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`MetaAPI Error (${response.status})`);
    }

    const json = await response.json();
    const rawCandles = Array.isArray(json) ? json : (json.payload || []);
    
    if (rawCandles.length === 0) {
        return [];
    }

    const prices: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const closes: number[] = [];

    const candles: any[] = rawCandles.map((c: any) => {
      const close = c.close || c.c;
      const high = c.high || c.h;
      const low = c.low || c.l;
      
      prices.push(close);
      highs.push(high);
      lows.push(low);
      closes.push(close);

      return {
        time: c.time || c.t,
        open: c.open || c.o,
        high: high,
        low: low,
        close: close,
        volume: c.tickVolume || c.v || 0
      };
    });

    // Calculate Indicators
    const macdData = calculateMACD(closes);
    const atrData = calculateATR(highs, lows, closes, 14);

    const finalData: Candle[] = candles.map((c, index) => {
      const historySlice = prices.slice(0, index + 1);
      return {
        ...c,
        ma50: calculateSMA(historySlice, 50),
        ma200: calculateSMA(historySlice, 200),
        rsi: calculateRSI(historySlice, 14),
        macd: {
            macdLine: macdData.macdLine[index],
            signalLine: macdData.signalLine[index],
            histogram: macdData.histogram[index]
        },
        atr: atrData[index]
      };
    });

    return finalData.filter(c => c.ma200 !== undefined);

  } catch (error: any) {
    // Only warn if it's not an intentional fallback
    logger.warn("MetaAPI Data Fetch failed, reverting to simulation", error.message);
    throw error;
  }
};

// --- Broker Data & Positions ---

export const fetchAccountInfo = async (config: BrokerConfig): Promise<MetaAccountInfo> => {
    if (config.type !== BrokerType.MT5) {
      return { balance: 0, equity: 0, margin: 0, freeMargin: 0, currency: 'USD', leverage: 100 };
    }

    const region = config.region || 'new-york';
    const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const url = `${baseUrl}/users/current/accounts/${config.accountId}/information`;

    try {
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'auth-token': config.accessToken || '',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Failed to fetch account info");
        const data = await response.json();
        return {
            balance: data.balance,
            equity: data.equity,
            margin: data.margin,
            freeMargin: data.freeMargin,
            currency: data.currency,
            leverage: data.leverage
        };
    } catch (error: any) {
        logger.error("Account Info Error", error.message);
        throw error;
    }
};

export const fetchOpenPositions = async (config: BrokerConfig): Promise<MetaPosition[]> => {
    if (config.type !== BrokerType.MT5) return [];

    const region = config.region || 'new-york';
    const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const url = `${baseUrl}/users/current/accounts/${config.accountId}/positions`;

    try {
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'auth-token': config.accessToken || '',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Failed to fetch positions");
        const data = await response.json();
        
        const positions = Array.isArray(data) ? data : (data.payload || []);
        
        return positions.map((p: any) => ({
            id: p.id,
            symbol: p.symbol,
            type: p.type, 
            volume: p.volume,
            openPrice: p.openPrice,
            currentPrice: p.currentPrice,
            profit: p.profit,
            swap: p.swap,
            commission: p.commission,
            time: p.time
        }));
    } catch (error: any) {
        // Return empty array on failure to avoid UI crash, but log it
        logger.warn("Failed to fetch positions", error.message);
        return [];
    }
};

export const closeMetaApiPosition = async (config: BrokerConfig, positionId: string) => {
    if (config.type !== BrokerType.MT5) return;

    const region = config.region || 'new-york';
    const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const url = `${baseUrl}/users/current/accounts/${config.accountId}/positions/${positionId}/close`;
    
    try {
        const response = await fetchWithRetry(url, {
            method: 'POST', 
            headers: {
                'auth-token': config.accessToken || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) 
        });
        
        if (!response.ok) throw new Error("Close position endpoint failed");
        return await response.json();
    } catch (error: any) {
         logger.error("Close Position Error", error.message);
         throw error;
    }
};

// --- Generic Trade Execution ---

export const executeBrokerTrade = async (config: BrokerConfig, order: TradeOrder) => {
  logger.info(`Initiating Trade via ${config.type}`, order);

  // 1. Validation Logic
  if (order.volume <= 0) throw new Error("Volume must be greater than 0");
  if (!order.symbol) throw new Error("Symbol missing");
  
  if (config.type === BrokerType.MT5) {
      if (!config.accountId || !config.accessToken) throw new Error("Invalid MT5 Broker Configuration");
      const region = config.region || 'new-york';
      const baseUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai`; 
      const url = `${baseUrl}/users/current/accounts/${config.accountId}/trade`;

      const response = await fetchWithRetry(url, {
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
         // Attempt to parse JSON error first, then text
         let errMsg = `MT5 Trade Failed (${response.status})`;
         try {
             const jsonErr = await response.json();
             if (jsonErr.message) errMsg += `: ${jsonErr.message}`;
             else if (jsonErr.error) errMsg += `: ${jsonErr.error}`;
         } catch {
             const textErr = await response.text();
             if (textErr) errMsg += `: ${textErr}`;
         }
         throw new Error(errMsg);
      }
      return await response.json();
  } 
  
  else if (config.type === BrokerType.IQ_OPTION || config.type === BrokerType.POCKET_OPTION || config.type === BrokerType.CUSTOM_WEBHOOK) {
      if (!config.webhookUrl) {
          throw new Error(`${config.type} requires a Bridge/Webhook URL.`);
      }

      const payload = {
        broker: config.type,
        symbol: order.symbol,
        action: order.actionType === 'ORDER_TYPE_BUY' ? 'CALL' : 'PUT',
        amount: order.volume, 
        type: 'digital', 
        expiration: 5,
        apiKey: config.apiKey
      };

      try {
        const response = await fetchWithRetry(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, 1); // Less retry for bridge
        
        if (!response.ok) throw new Error(`Bridge Error: ${response.statusText}`);
        return { status: 'sent', payload };
      } catch (e: any) {
         logger.warn(`Bridge fetch failed (likely CORS or invalid URL). Trade logged.`, payload);
         return { status: 'logged', payload };
      }
  }

  throw new Error("Unknown Broker Type");
};

export const executeMetaApiTrade = executeBrokerTrade;

// --- Signal Parsing ---

export const parseSignalText = (text: string): ParsedSignal => {
  try {
      if (!text) return {};
      const normalizedText = text.toUpperCase().replace(/\//g, '');
      const signal: ParsedSignal = {};

      const pairRegex = /(EURUSD|GBPUSD|USDJPY|USDCAD|AUDUSD|USDCHF|XAUUSD|GOLD|BTCUSD)/;
      const pairMatch = normalizedText.match(pairRegex);
      if (pairMatch) signal.symbol = pairMatch[0];

      if (normalizedText.includes('BUY') || normalizedText.includes('LONG') || normalizedText.includes('CALL')) signal.type = 'BUY';
      if (normalizedText.includes('SELL') || normalizedText.includes('SHORT') || normalizedText.includes('PUT')) signal.type = 'SELL';

      const extractNumber = (keywords: string[]) => {
        for (const kw of keywords) {
          const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
          // Fix: properly use backticks for template literal regex
          const regex = new RegExp(`${safeKw}\\s*[:@]?\\s*([0-9]+\\.?[0-9]*)`);
          const match = normalizedText.match(regex);
          if (match) return parseFloat(match[1]);
        }
        return undefined;
      };

      signal.sl = extractNumber(['SL', 'STOP LOSS', 'STOP']);
      signal.tp = extractNumber(['TP', 'TAKE PROFIT', 'TARGET']);
      signal.entry = extractNumber(['ENTRY', 'AT', '@', 'PRICE']);

      return signal;
  } catch (e) {
      logger.error("Error parsing signal text", e);
      return {};
  }
};

// --- Analysis Logic (ADAPTIVE) ---

export const analyzeMarket = (candle: Candle, prevCandle: Candle, pair: string): MarketAnalysis => {
  const ma50 = candle.ma50 || 0;
  const ma200 = candle.ma200 || 0;
  const rsi = candle.rsi || 50;
  const macd = candle.macd || { macdLine: 0, signalLine: 0, histogram: 0 };
  const atr = candle.atr || 0;
  const currentPrice = candle.close;

  if (ma50 === 0 || ma200 === 0) {
      return {
          pair, currentPrice: candle.close, ma50: 0, ma200: 0, rsi: 50, 
          trend: Trend.NEUTRAL, signal: SignalType.HOLD, confidence: 0,
          marketCondition: 'RANGING', atr: 0
      };
  }

  // 1. Determine Market Condition (Adaptive)
  const spread = Math.abs(ma50 - ma200);
  const spreadPercent = spread / currentPrice;
  // If spread > 0.05% considered trending, otherwise ranging/consolidation
  const isTrending = spreadPercent > 0.0005;
  
  // Volatility Check using ATR
  const volatilityPercent = atr / currentPrice;
  const isVolatile = volatilityPercent > 0.0025; // 0.25% movement per candle avg = High Volatility

  let marketCondition: 'TRENDING' | 'RANGING' | 'VOLATILE' = 'RANGING';
  if (isVolatile) marketCondition = 'VOLATILE';
  else if (isTrending) marketCondition = 'TRENDING';

  // 2. Determine Trend Direction
  let trend = Trend.NEUTRAL;
  if (ma50 > ma200 && spreadPercent > 0.0002) trend = Trend.BULLISH;
  else if (ma50 < ma200 && spreadPercent > 0.0002) trend = Trend.BEARISH;

  // 3. Signal Logic (Adaptive Sure Signals)
  let signal = SignalType.HOLD;
  let confidence = 50; // Base confidence

  // Indicators
  const isOversold = rsi < 30;
  const isOverbought = rsi > 70;
  const macdBullish = macd.histogram > 0 && macd.macdLine > macd.signalLine;
  const macdBearish = macd.histogram < 0 && macd.macdLine < macd.signalLine;
  const strongMomentum = Math.abs(macd.histogram) > 0.0001; // Filter noise

  // ADAPTIVE STRATEGY SELECTION
  if (marketCondition === 'TRENDING') {
      // Trend Following
      if (trend === Trend.BULLISH) {
          // Buy on minor dips or strong continuation
          if ((rsi < 60 && macdBullish) || (currentPrice > ma50 && macdBullish && strongMomentum)) {
              signal = SignalType.BUY;
              confidence += 25; // Strong Trend Alignment
              if (macdBullish && strongMomentum) confidence += 10;
              if (rsi < 45) confidence += 10; // Value buy
              if (currentPrice > ma50) confidence += 5;
          }
      } else if (trend === Trend.BEARISH) {
          // Sell on minor rallies or strong continuation
          if ((rsi > 40 && macdBearish) || (currentPrice < ma50 && macdBearish && strongMomentum)) {
              signal = SignalType.SELL;
              confidence += 25; 
              if (macdBearish && strongMomentum) confidence += 10;
              if (rsi > 55) confidence += 10; // Value sell
              if (currentPrice < ma50) confidence += 5;
          }
      }
  } else if (marketCondition === 'RANGING') {
      // Mean Reversion (Buy Low, Sell High)
      if (isOversold && macdBullish) {
          signal = SignalType.BUY;
          confidence += 20; 
          confidence += (30 - rsi); // Higher confidence deeper into oversold
      } else if (isOverbought && macdBearish) {
          signal = SignalType.SELL;
          confidence += 20;
          confidence += (rsi - 70); // Higher confidence deeper into overbought
      }
  } else if (marketCondition === 'VOLATILE') {
      // Safety Mode: Only trade extreme setups
      confidence -= 20; // Penalize volatility
      if (isOversold && rsi < 25 && macdBullish) {
          signal = SignalType.BUY;
          confidence += 30; // Catching a knife requires strong signal
      }
      if (isOverbought && rsi > 75 && macdBearish) {
          signal = SignalType.SELL;
          confidence += 30;
      }
  }

  // Final "Sure Signal" Check
  // Require at least 75% confidence for a actionable signal, otherwise hold
  if (confidence < 75) {
      signal = SignalType.HOLD; 
  }

  return { 
      pair, 
      currentPrice: candle.close, 
      ma50, 
      ma200, 
      rsi, 
      trend, 
      signal, 
      confidence: Math.min(Math.round(confidence), 99),
      marketCondition,
      macd,
      atr
  };
};

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

    if (current.ma50 === undefined || current.ma200 === undefined || current.rsi === undefined || prev.ma50 === undefined) continue;

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