import { GoogleGenAI } from "@google/genai";
import { LLMProvider, GenerateTextParams, GenerateJsonParams, ModelTier } from './types';

// FIX: Per coding guidelines, the API key must be obtained from process.env.API_KEY.
// This also resolves the TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GEMINI_MODELS: Record<ModelTier, string> = {
    lite: 'gemini-flash-lite-latest',
    fast: 'gemini-2.5-flash',
    pro: 'gemini-2.5-pro',
};

/**
 * Implements the LLMProvider interface using the Google Gemini AI SDK.
 * This module is responsible for all direct communication with the Gemini API.
 */
class GeminiProvider implements LLMProvider {
    async generateText(params: GenerateTextParams): Promise<string> {
        const { model, prompt, systemInstruction } = params;
        const geminiModel = GEMINI_MODELS[model];
        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: prompt,
                config: {
                    ...(systemInstruction && { systemInstruction }),
                },
            });
            return response.text.trim();
        } catch (error) {
            console.error(`Error generating text with Gemini model ${geminiModel}:`, error);
            throw new Error("Failed to get text response from Gemini AI.");
        }
    }

    async generateJson<T>(params: GenerateJsonParams): Promise<T> {
        const { model, prompt, schema, systemInstruction } = params;
        const geminiModel = GEMINI_MODELS[model];
        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    ...(systemInstruction && { systemInstruction }),
                },
            });
            const jsonText = response.text.trim();
            return JSON.parse(jsonText) as T;
        } catch (error) {
            console.error(`Error generating JSON with Gemini model ${geminiModel}:`, error);
            // Fallback for potential schema parsing issues
             try {
                console.log("Attempting fallback for JSON generation...");
                const fallbackPrompt = `${prompt}\nIMPORTANT: Respond ONLY with a valid JSON object that conforms to the requested schema. Do not include any other text or markdown formatting.`;
                const fallbackResponse = await this.generateText({model, prompt: fallbackPrompt, systemInstruction});
                const cleanedText = fallbackResponse.trim().replace(/```json|```/g, '');
                return JSON.parse(cleanedText) as T;
            } catch(fallbackError) {
                console.error("Gemini JSON fallback also failed:", fallbackError);
                throw new Error("Failed to get a valid JSON response from Gemini AI, even with fallback.");
            }
        }
    }
}

export const geminiProvider = new GeminiProvider();