
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PromptCategory, PromptArchitectResponse, MediaData } from "../types";

// The API key must be obtained exclusively from process.env.API_KEY
export const getApiKey = () => {
  try {
    // Safer check for browser environments where process might not be defined
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || null;
    }
    // Check globalThis as a fallback for some edge environments
    return (globalThis as any).process?.env?.API_KEY || null;
  } catch (e) {
    return null;
  }
};

const ARCHITECT_SYSTEM_INSTRUCTION = `You are the Multi-Modal Prompt Architect (Unit GEM-3-PR0). Your function is to perform high-fidelity forensic deconstruction of media and raw ideas.

CORE OPERATIONAL LOGIC:
1.  NEURAL ANALYSIS: When media (image/video) is provided, perform a deep-layer scan of:
    - OPTICS: focal length, aperture, sensor characteristics.
    - LIGHTING: topology, sources, material physics.
    - COMPOSITION: rules, angles, flow.
    - TEMPORAL FLOW: motion, frame rates.

2.  ARCHITECTURAL SYNTHESIS: Use technical, precise language. Avoid generic adjectives.
3.  OUTPUT: Return ONLY a JSON object with 'analysis', 'optimizedPrompt', and 'proTip'.`;

export async function architectPrompt(
  category: PromptCategory,
  input: string,
  media?: MediaData
): Promise<PromptArchitectResponse> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("ENVIRONMENT_SYNC_ERROR: The API_KEY variable is missing. ACTION: Add 'API_KEY' to Vercel Environment Variables and REDEPLOY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const contents: any[] = [];
  
  if (media) {
    contents.push({
      inlineData: {
        data: media.base64,
        mimeType: media.mimeType
      }
    });
  }

  const promptText = media 
    ? `Forensic deconstruction request for ${media.type}. Context: "${input || 'None'}"` 
    : `Synthesize ${category} prompt blueprint for: "${input}"`;

  contents.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: contents },
    config: {
      systemInstruction: ARCHITECT_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 32768 },
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          optimizedPrompt: { type: Type.STRING },
          proTip: { type: Type.STRING }
        },
        required: ["analysis", "optimizedPrompt", "proTip"]
      }
    }
  });

  const text = response.text || '{}';
  try {
    return JSON.parse(text) as PromptArchitectResponse;
  } catch (e) {
    throw new Error("Neural decoding failed. The AI returned an invalid response format.");
  }
}
