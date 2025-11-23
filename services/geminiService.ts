
import { GoogleGenAI, Type } from '@google/genai';
import { MarketAnalysis, GeminiAnalysisResult } from '../types';
import { logger } from './logger';

export const generateMarketInsight = async (analysis: MarketAnalysis, apiKeyOverride?: string): Promise<GeminiAnalysisResult> => {
  // Priority: Manual Key -> Environment Variable
  const apiKey = apiKeyOverride || process.env.API_KEY;

  if (!apiKey) {
    const msg = "Gemini API Key is missing. Please go to Settings > General and enter your API Key.";
    logger.error(msg);
    throw new Error(msg);
  }

  const ai = new GoogleGenAI({ apiKey });

  logger.info(`Requesting AI insight for ${analysis.pair}`);

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
    'keyLevels' should be 3 estimated support/resistance prices near current price.
    'actionableAdvice' should be a specific trading recommendation.
  `;

  try {
    // Create a promise that rejects after 15 seconds
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
            actionableAdvice: { type: Type.STRING }
          },
          required: ["summary", "sentiment", "keyLevels", "actionableAdvice"]
        }
      }
    });

    // Race the API call against the timeout
    const response = await Promise.race([apiCallPromise, timeoutPromise]);

    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");
    
    const result = JSON.parse(text) as GeminiAnalysisResult;
    logger.info("AI Analysis received successfully", { sentiment: result.sentiment });
    
    return result;

  } catch (error: any) {
    const errorMessage = error.message || "Unknown AI Error";
    logger.error("Gemini API Failed", errorMessage);
    
    if (errorMessage.includes('401') || errorMessage.includes('key') || errorMessage.includes('PERMISSION_DENIED')) {
        throw new Error("Invalid API Key. Check Settings.");
    }
    
    throw new Error(errorMessage);
  }
};
