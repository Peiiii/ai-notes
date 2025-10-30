import { GoogleGenAI, FunctionCall } from "@google/genai";
import { LLMProvider, GenerateTextParams, GenerateJsonParams, ModelTier, GenerateWithToolsParams, GenerateWithToolsResult, GenerateTextStreamParams, StreamChunk } from './types';
import { ChatMessage, ToolCall } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODELS: Record<ModelTier, string> = {
    lite: 'gemini-flash-lite-latest',
    fast: 'gemini-2.5-flash',
    pro: 'gemini-2.5-pro',
};

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

        const contents = history.map(msg => {
            if (msg.role === 'tool' && msg.toolCalls?.[0]) {
                return {
                    role: 'tool',
                    parts: [{ functionResponse: { name: msg.toolCalls[0].name, response: { content: msg.content } } }]
                };
            }
            if (msg.role === 'model' && msg.toolCalls) {
                 return {
                    role: 'model',
                    parts: [{ functionCall: msg.toolCalls[0] }]
                 }
            }
            return {
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            };
        }).filter(Boolean);

        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: contents,
                config: {
                    tools: [{ functionDeclarations: tools }],
                    ...(systemInstruction && { systemInstruction }),
                },
            });

            // Fix: Explicitly map FunctionCall to ToolCall, filtering out invalid calls and providing a default for args.
            // This handles cases where the response might have function calls without a name or with optional arguments.
            const toolCalls: ToolCall[] | null = response.functionCalls
                ? response.functionCalls
                    .filter(fc => !!fc.name)
                    .map(fc => ({
                        id: fc.id || `gemini-tool-call-${crypto.randomUUID()}`,
                        name: fc.name!,
                        args: fc.args || {},
                    }))
                : null;
            const text = response.text || null;
            
            return { text, toolCalls };

        } catch (error) {
            console.error(`Error generating content with tools using Gemini model ${geminiModel}:`, error);
            throw new Error("Failed to get agent response from Gemini AI.");
        }
    }

    async generateTextStream(params: GenerateTextStreamParams): Promise<AsyncGenerator<StreamChunk>> {
        const { model, history, systemInstruction } = params;
        const geminiModel = GEMINI_MODELS[model];

        const contents = history.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        try {
            const responseStream = await ai.models.generateContentStream({
                model: geminiModel,
                contents: contents,
                config: {
                    ...(systemInstruction && { systemInstruction }),
                },
            });

            async function* mapStream(): AsyncGenerator<StreamChunk> {
                for await (const chunk of responseStream) {
                    yield { text: chunk.text || null };
                }
            }
            
            return mapStream();

        } catch (error) {
            console.error(`Error generating text stream with Gemini model ${geminiModel}:`, error);
            throw new Error("Failed to get text stream from Gemini AI.");
        }
    }
}

export const geminiProvider = new GeminiProvider();
