import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY_1;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Halo!',
    });
    console.log("generateContent worked:", response.text);
  } catch (e) {
    console.error("generateContent failed:", e.message);
    try {
      const response = await ai.models.generate_content({
        model: 'gemini-3.5-flash',
        contents: 'Halo!',
      });
      console.log("generate_content worked:", response.text);
    } catch (e2) {
      console.error("generate_content failed:", e2.message);
    }
  }
}

test();
