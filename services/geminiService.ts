import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const generateSubtitles = async (base64Audio: string, mimeType: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Prompt engineering for specific VTT format
  const prompt = `
    Listen to this audio file and generate subtitles in WebVTT format.
    
    Rules:
    1. Output MUST start with "WEBVTT".
    2. Include precise timestamps in the format HH:MM:SS.mmm.
    3. Do not include any conversational text, introductions, or markdown formatting (like \`\`\`vtt). 
    4. Just provide the raw VTT content.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text generated from the model.");
    }

    // Cleanup: remove markdown code blocks if the model adds them despite instructions
    const cleanText = text.replace(/```vtt/gi, '').replace(/```/g, '').trim();
    
    return cleanText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};