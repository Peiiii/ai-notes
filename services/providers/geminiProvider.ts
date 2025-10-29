import { GoogleGenAI, FunctionCall } from "@google/genai";
import { LLMProvider, GenerateTextParams, GenerateJsonParams, ModelTier, GenerateWithToolsParams, GenerateWithToolsResult } from './types';
import { ChatMessage } from "../../types";

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
// FIX: Moved method implementations into the class body to resolve return type errors.
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
    
    async generateContentWithTools(params: GenerateWithToolsParams): Promise<GenerateWithToolsResult> {
        const { model, history, tools, systemInstruction } = params;
        const geminiModel = GEMINI_MODELS[model];

        // Convert our generic ChatMessage[] to Gemini's Content[] format
        const contents = history.map(msg => {
            if (msg.role === 'tool') {
                return {
                    role: 'tool',
                    // FIX: Changed 'toolResponse' to 'functionResponse' and removed the 'id' field to match the Gemini API specification for tool call responses.
                    parts: [{ functionResponse: { name: msg.toolCalls[0].name, response: { content: msg.content } } }]
                };
            }
            return {
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            };
        });

        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: contents,
                config: {
                    tools: [{ functionDeclarations: tools }],
                    ...(systemInstruction && { systemInstruction }),
                },
            });

            const toolCalls = response.functionCalls || null;
            const text = response.text || null;
            
            return { text, toolCalls };

        } catch (error) {
            console.error(`Error generating content with tools using Gemini model ${geminiModel}:`, error);
            throw new Error("Failed to get agent response from Gemini AI.");
        }
    }
}

export const geminiProvider = new GeminiProvider();