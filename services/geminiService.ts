
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PromptCategory, PromptArchitectResponse, MediaData } from "../types";

const ARCHITECT_SYSTEM_INSTRUCTION = `You are the Multi-Modal Prompt Architect (Unit GEM-3-PR0). Your function is to perform high-fidelity forensic deconstruction of media and raw ideas.

CORE OPERATIONAL LOGIC:
1.  NEURAL ANALYSIS: When media (image/video) is provided, perform a deep-layer scan of:
    - OPTICS: Estimate focal length (e.g., 24mm wide, 85mm portrait), aperture (f/1.8 depth of field), and camera sensor characteristics (grain, digital vs. film).
    - LIGHTING TOPOLOGY: Identify light sources (Rembrandt lighting, high-key, volumetric god-rays, neon luminescence, subsurface scattering).
    - COMPOSITION: Analyze rule of thirds, leading lines, Dutch angles, or isometric perspectives.
    - MATERIAL PHYSICS: Describe textures (brushed metal, weathered skin, translucent fabric, liquid viscosity).
    - TEMPORAL FLOW (VIDEO ONLY): Analyze frame rate (24fps cinematic vs 60fps), motion blur, camera tracking (pan, tilt, boom, crane), and fluid dynamics.

2.  ARCHITECTURAL SYNTHESIS (PROMPT GENERATION):
    - Use technical, precise language. Avoid generic adjectives like "beautiful" or "cool." Use "anamorphic flares," "tessellated geometry," or "cinematic color grade."
    - For SEO: Focus on persona-driven authority, structural H-tag hierarchies, and semantic keyword clustering.

3.  PROMPT CONSTRAINTS:
    - The "Optimized Prompt" must be a ready-to-use master template.
    - The "Analysis" should be a technical justification of the choices made.
    - The "Pro Tip" must provide a specific technical "hack" for the targeted AI generator.

OUTPUT FORMAT:
Return ONLY a JSON object with 'analysis', 'optimizedPrompt', and 'proTip'.`;

export async function architectPrompt(
  category: PromptCategory,
  input: string,
  media?: MediaData
): Promise<PromptArchitectResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const contents: any[] = [];
  
  if (media) {
    contents.push({
      inlineData: {
        data: media.base64,
        mimeType: media.mimeType
      }
    });
  }

  // Refined prompt text for higher technical density
  const promptText = media 
    ? `Perform a forensic deconstruction of this ${media.type}. 
       Extract the optical properties, lighting topology, and material physics. 
       Synthesize a Master Prompt that perfectly replicates this architectural style. 
       Context provided by user: "${input || 'None'}"` 
    : `Construct a high-performance ${category} prompt based on this conceptual foundation: "${input}". 
       Focus on technical parameters, stylistic markers, and structural constraints.`;

  contents.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: contents },
    config: {
      systemInstruction: ARCHITECT_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 32768 },
      temperature: 0.4, // Lower temperature for more analytical/precise results
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { 
            type: Type.STRING,
            description: "Technical forensic breakdown of the visual or conceptual structure."
          },
          optimizedPrompt: { 
            type: Type.STRING,
            description: "The high-fidelity master prompt string."
          },
          proTip: { 
            type: Type.STRING,
            description: "A professional-level technical tip for optimization."
          }
        },
        required: ["analysis", "optimizedPrompt", "proTip"]
      }
    }
  });

  const text = response.text || '{}';
  try {
    return JSON.parse(text) as PromptArchitectResponse;
  } catch (e) {
    console.error("Failed to parse architect response", e);
    throw new Error("Neural decoding failed. The Architect encountered a structural anomaly.");
  }
}
