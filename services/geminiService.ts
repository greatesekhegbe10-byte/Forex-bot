import { GoogleGenAI, Type } from '@google/genai';
import { MarketAnalysis, GeminiAnalysisResult } from '../types';
import { logger } from './logger';

export const generateMarketInsight = async (analysis: MarketAnalysis): Promise<GeminiAnalysisResult> => {
  // Lazily access the key to prevent initialization errors during module load
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    const msg = "Gemini API Key is missing. Please check your .env file or build configuration.";
    logger.error(msg);
    throw new Error("AI Service Unavailable: API Key missing");
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
    const response = await ai.models.generateContent({
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

    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");
    
    const result = JSON.parse(text) as GeminiAnalysisResult;
    logger.info("AI Analysis received successfully", { sentiment: result.sentiment });
    
    return result;

  } catch (error: any) {
    // Handle specific API errors gracefully
    const errorMessage = error.message || "Unknown AI Error";
    logger.error("Gemini API Failed", errorMessage);
    
    if (errorMessage.includes('401') || errorMessage.includes('key')) {
        throw new Error("Invalid API Key. Please check configuration.");
    }
    
    throw new Error("AI Analysis failed. Please try again later.");
  }
};