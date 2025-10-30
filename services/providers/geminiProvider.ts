import { GoogleGenAI, FunctionCall } from "@google/genai";
import { LLMProvider, GenerateTextParams, GenerateJsonParams, ModelTier, GenerateWithToolsParams, GenerateWithToolsResult, GenerateTextStreamParams, StreamChunk } from './types';
import { ChatMessage, ToolCall } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODELS: Record<ModelTier, string> = {
    lite: 'gemini-flash-lite-latest',
    fast: 'gemini-2.5-flash',
    pro: 'gemini-2.5-pro',
};

// --- New Robust History Mapping Function ---
function historyToContents(history: ChatMessage[]): any[] {
    const contents: any[] = [];
    let i = 0;
    const historyWithoutSystem = history.filter(m => m.role !== 'system');

    while (i < historyWithoutSystem.length) {
        const msg = historyWithoutSystem[i];

        if (msg.role === 'user') {
            contents.push({
                role: 'user',
                parts: [{ text: msg.content }],
            });
            i++;
        } else if (msg.role === 'model') {
            const modelParts = [];
            if (msg.content) {
                const textContent = msg.persona ? `[${msg.persona}]: ${msg.content}` : msg.content;
                modelParts.push({ text: textContent });
            }
            if (msg.toolCalls) {
                for (const call of msg.toolCalls) {
                    // Sanitize the call object to match Gemini's expected FunctionCallPart structure
                    modelParts.push({
                        functionCall: { name: call.name, args: call.args },
                    });
                }
            }
            contents.push({ role: 'model', parts: modelParts });
            i++;

            // After a model turn, check for a sequence of tool responses to group together.
            const toolResponseParts: any[] = [];
            while (i < historyWithoutSystem.length && historyWithoutSystem[i].role === 'tool') {
                const toolMsg = historyWithoutSystem[i];
                // Use the toolCalls array on the tool message to get the original call name
                const correspondingCall = toolMsg.toolCalls?.[0];
                if (correspondingCall) {
                    toolResponseParts.push({
                        functionResponse: {
                            name: correspondingCall.name,
                            response: { content: toolMsg.content },
                        },
                    });
                }
                i++; // Consume this tool message
            }
            if (toolResponseParts.length > 0) {
                contents.push({ role: 'tool', parts: toolResponseParts });
            }
        } else {
            // This handles tool messages that were not preceded by a model turn (should not happen in valid history)
            // or any other unexpected role. We advance the loop to prevent it from getting stuck.
            i++;
        }
    }
    return contents;
}


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
        const { model, history, tools, systemInstruction, useGoogleSearch } = params;
        const geminiModel = GEMINI_MODELS[model];

        const contents = historyToContents(history);

        try {
            const geminiToolsConfig: any[] = tools?.length > 0 ? [{ functionDeclarations: tools }] : [];
            if (useGoogleSearch) {
                geminiToolsConfig.push({ googleSearch: {} });
            }

            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: contents,
                config: {
                    ...(geminiToolsConfig.length > 0 && { tools: geminiToolsConfig }),
                    ...(systemInstruction && { systemInstruction }),
                },
            });

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
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? null;
            
            return { text, toolCalls, groundingChunks };

        } catch (error) {
            console.error(`Error generating content with tools using Gemini model ${geminiModel}:`, error);
            throw new Error("Failed to get agent response from Gemini AI.");
        }
    }

    async generateTextStream(params: GenerateTextStreamParams): Promise<AsyncGenerator<StreamChunk>> {
        const { model, history, systemInstruction } = params;
        const geminiModel = GEMINI_MODELS[model];

        const contents = history.map(msg => {
            const textContent = msg.role === 'model' && msg.persona ? `[${msg.persona}]: ${msg.content}` : msg.content;
            return {
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: textContent }],
            };
        });

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