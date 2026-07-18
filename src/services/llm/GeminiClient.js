import { GoogleGenAI } from '@google/genai';

export async function callGemini(apiKey, prompt, model = 'gemini-3.5-flash', maxTokens = 1000) {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generate_content({
      model: model,
      contents: prompt,
      config: {
        maxOutputTokens: maxTokens,
        temperature: 0.3
      }
    });

    return response.text;
  } catch (error) {
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    
    console.error('Failed to parse Gemini response or SDK error:', error);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}
