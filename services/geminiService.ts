import { GoogleGenAI, Type } from "@google/genai";
import { ReadingRequest, FullReadingResponse, InterpretationMode } from '../types';

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateInterpretation = async (request: ReadingRequest): Promise<FullReadingResponse> => {
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  const cardList = request.cards.map(c => 
    `${c.nameZh} (${c.name}) [${c.isUpright ? '正位 Upright' : '逆位 Reversed'}]`
  ).join(', ');

  const systemFramework = request.mode === InterpretationMode.SANCIA 
    ? "Framework: Use the 'Heaven, Earth, Man' (天地人) structure for the spread analysis." 
    : "Framework: Use the 'Kabbalah Tree of Life' (卡巴拉生命之树) pathworking structure.";

  const prompt = `
    Role: You are 'Zhonggong' (中宫), a master Tarot reader with a style that mixes traditional Chinese philosophical depth with modern psychological insight.
    
    Context:
    System: ${request.deck} Tarot.
    Question: "${request.question}"
    Cards: ${cardList}
    ${systemFramework}

    Requirements:
    1. **Language**: Fluid, poetic, yet accessible Chinese (中文).
    2. **Structure**: 
       - For EACH card, you must provide a detailed 3-part analysis (approx 150 words per card).
       - **Part 1: The Image (象)**: Describe the visual symbolism and key archetypes. Include the English keyword for the core concept.
       - **Part 2: The Meaning (义)**: Explain the deep psychological or divinatory meaning in the context of the question.
       - **Part 3: The Action (行)**: Specific, actionable advice.
    3. **Process Explanation**: Briefly explain *why* you are interpreting it this way based on the card's position or the connection between cards.
    4. **Bilingual Hints**: When introducing a major concept, provide the English term in brackets, e.g., 潜意识 (Subconscious).

    Output Format: JSON only.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "A poetic opening summary of the reading's energy." },
      cardInterpretations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            cardId: { type: Type.STRING },
            coreMeaning: { type: Type.STRING, description: "Part 1: Symbolism & Archetype (with English keywords)" },
            contextAnalysis: { type: Type.STRING, description: "Part 2: Deep situational analysis and connection to other cards" },
            actionAdvice: { type: Type.STRING, description: "Part 3: Practical guidance" },
          },
          required: ["cardId", "coreMeaning", "contextAnalysis", "actionAdvice"]
        }
      },
      synthesis: { type: Type.STRING, description: "A final empowering conclusion and synthesis of the elements." }
    },
    required: ["summary", "cardInterpretations", "synthesis"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a wise, empathetic, and mystical Tarot reader. Your tone is supportive but honest."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Oracle");

    return JSON.parse(text) as FullReadingResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateVisionImage = async (cards: string[], prompt: string) => {
   if (!apiKey) return null;

   const visualPrompt = `A masterpiece spiritual illustration in the style of Chinese Ink Wash Painting (Shuimohua) mixed with Art Nouveau curves. 
   Subject: Abstract representation of Tarot cards ${cards.join(', ')}. 
   Context: ${prompt}. 
   Colors: Mainly Black ink, White paper, with accents of Cinnabar Red and Antique Gold. 
   Atmosphere: Ethereal, Mystical, Zen, High Contrast.`;

   try {
     const response = await ai.models.generateContent({
       model: 'gemini-3-pro-image-preview',
       contents: {
         parts: [{ text: visualPrompt }]
       },
       config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K" 
        }
       }
     });
     
     for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
         return `data:image/png;base64,${part.inlineData.data}`;
       }
     }
     return null;
   } catch (e) {
     console.error("Image gen failed", e);
     return null;
   }
}