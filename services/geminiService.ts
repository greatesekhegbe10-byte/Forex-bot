import { GoogleGenAI, Type } from '@google/genai';
import { MarketAnalysis, GeminiAnalysisResult } from '../types';

// Initialize the Gemini API client
// The API key is expected to be in process.env.API_KEY
// We check for availability in the component layer to disable features if missing
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMarketInsight = async (analysis: MarketAnalysis): Promise<GeminiAnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key not configured");
  }

  const prompt = `
    Act as a professional Forex Analyst. Analyze the following technical data for ${analysis.pair}:
    - Current Price: ${analysis.currentPrice.toFixed(4)}
    - SMA 50: ${analysis.ma50.toFixed(4)}
    - SMA 200: ${analysis.ma200.toFixed(4)}
    - RSI (14): ${analysis.rsi.toFixed(2)}
    - Automated Trend Detection: ${analysis.trend}
    - Automated Signal: ${analysis.signal} (Confidence: ${analysis.confidence}%)

    Provide a structured JSON response containing:
    1. A brief market summary (max 2 sentences).
    2. Sentiment (Bullish/Bearish/Neutral).
    3. Key Support/Resistance Levels (estimated based on price).
    4. Actionable Advice for a trader.
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
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeminiAnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
