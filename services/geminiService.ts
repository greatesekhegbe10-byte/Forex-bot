

import { GoogleGenAI, Type } from '@google/genai';
import { MarketAnalysis, GeminiAnalysisResult, Trend, SignalType } from '../types';
import { logger } from './logger';

// --- Local Heuristic Engine (Fallback when no API Key is present) ---
const generateSimulatedInsight = (analysis: MarketAnalysis): GeminiAnalysisResult => {
  const { pair, currentPrice, rsi, ma50, ma200, trend, signal, confidence } = analysis;
  
  const digits = pair.includes('JPY') ? 2 : 4;
  const formatPrice = (p: number) => p.toFixed(digits);

  let sentiment = 'Neutral';
  let summary = '';
  let advice = '';
  let pattern = 'Consolidation';

  // 1. Determine Sentiment & Pattern
  if (trend === Trend.BULLISH && signal === SignalType.BUY) {
    sentiment = 'Bullish';
    pattern = 'Golden Cross';
  } else if (trend === Trend.BEARISH && signal === SignalType.SELL) {
    sentiment = 'Bearish';
    pattern = 'Death Cross';
  } else if (rsi > 70) {
    pattern = 'Overbought/Doji';
  } else if (rsi < 30) {
    pattern = 'Oversold/Hammer';
  }

  // 2. Generate Summary
  const rsiState = rsi > 70 ? "overbought conditions" : rsi < 30 ? "oversold conditions" : "neutral momentum";
  const maState = ma50 > ma200 ? "bullish Golden Cross setup" : "bearish alignment";
  
  if (sentiment === 'Bullish') {
    summary = `Technical structure is bullish. Price is holding above the MA50 ($${formatPrice(ma50)}), supported by a ${maState}. RSI is currently at ${rsi.toFixed(1)}, indicating ${rsiState}. Buyers are dominating current sessions.`;
  } else if (sentiment === 'Bearish') {
    summary = `Bearish pressure is evident. Price is trading below the MA200 ($${formatPrice(ma200)}). The ${maState} suggests further downside potential. RSI at ${rsi.toFixed(1)} shows ${rsiState}.`;
  } else {
    summary = `Market is currently consolidating / ranging. Technicals are mixed with price oscillating between MA50 and MA200. RSI (${rsi.toFixed(1)}) reflects a lack of strong directional commitment from either bulls or bears.`;
  }

  // 3. Generate Advice
  if (sentiment === 'Bullish') {
    advice = `Consider LONG positions on pullbacks near ${formatPrice(currentPrice * 0.999)}. Target volatility expansion. Maintain stop loss below MA50.`;
  } else if (sentiment === 'Bearish') {
    advice = `Look for SHORT opportunities on retests of ${formatPrice(currentPrice * 1.001)}. Momentum favors sellers. Place safety stops above recent swing highs.`;
  } else {
    advice = `Stay on the sidelines or trade the range boundaries. Wait for a breakout above ${formatPrice(currentPrice * 1.002)} or breakdown below ${formatPrice(currentPrice * 0.998)} before committing volume.`;
  }

  // 4. Calculate Key Levels (Simple Pivots)
  const r1 = (currentPrice * 1.0025).toFixed(digits);
  const s1 = (currentPrice * 0.9975).toFixed(digits);
  const pivot = (currentPrice).toFixed(digits);

  return {
    summary,
    sentiment,
    keyLevels: [`Res: ${r1}`, `Pv: ${pivot}`, `Sup: ${s1}`],
    actionableAdvice: advice,
    detectedPattern: pattern
  };
};

export const generateMarketInsight = async (analysis: MarketAnalysis): Promise<GeminiAnalysisResult> => {
  // Fix: The API key must be obtained exclusively from the environment variable process.env.API_KEY
  // The application must not ask the user for it under any circumstances.
  const apiKey = process.env.API_KEY;

  // FALLBACK: If no key, use Local Heuristic Engine
  if (!apiKey || apiKey.trim() === '') {
    logger.info(`No Gemini API Key found. Using Local Technical Engine for ${analysis.pair}`);
    // Simulate a slight network delay for realism
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateSimulatedInsight(analysis);
  }

  // REAL AI: Key exists, call Gemini
  const ai = new GoogleGenAI({ apiKey });

  logger.info(`Requesting AI insight for ${analysis.pair} via Cloud`);

  const prompt = `
    You are an expert Forex Trading Analyst. Analyze the following live market data for ${analysis.pair}:
    
    Technical Indicators:
    - Current Price: ${analysis.currentPrice.toFixed(5)}
    - 50-period SMA: ${analysis.ma50.toFixed(5)}
    - 200-period SMA: ${analysis.ma200.toFixed(5)}
    - RSI (14): ${analysis.rsi.toFixed(2)}
    
    Algorithm Status:
    - Trend Detected: ${analysis.trend}
    - Algorithmic Signal: ${analysis.signal}
    - Signal Confidence: ${analysis.confidence}%

    Based strictly on this data, provide a JSON response with your analysis.
    The 'summary' should explain WHY the trend is what it is.
    The 'sentiment' must be exactly one of: 'Bullish', 'Bearish', 'Neutral'.
    The 'detectedPattern' should be the closest technical candlestick pattern or chart formation (e.g., 'Bullish Engulfing', 'Hammer', 'Shooting Star', 'Doji', 'Double Top', 'Head and Shoulders'). If no specific pattern is clear, state 'Generic Trend' or 'Consolidation'.
    'keyLevels' should be 3 estimated support/resistance prices near current price.
    'actionableAdvice' should be a specific trading recommendation.
  `;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("AI Analysis Timed Out (15s)")), 15000)
    );

    const apiCallPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            keyLevels: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            actionableAdvice: { type: Type.STRING },
            detectedPattern: { type: Type.STRING }
          },
          required: ["summary", "sentiment", "keyLevels", "actionableAdvice", "detectedPattern"]
        }
      }
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]);

    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");
    
    const result = JSON.parse(text) as GeminiAnalysisResult;
    logger.info("AI Analysis received successfully", { sentiment: result.sentiment, pattern: result.detectedPattern });
    
    return result;

  } catch (error: any) {
    const errorMessage = error.message || "Unknown AI Error";
    logger.warn("Gemini API Call Failed, reverting to Local Engine", errorMessage);
    
    // If the real API fails (quota, network, invalid key), fallback to local engine seamlessly
    return generateSimulatedInsight(analysis);
  }
};