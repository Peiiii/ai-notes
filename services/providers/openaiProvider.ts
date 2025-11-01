import { LLMProvider, GenerateTextParams, GenerateJsonParams, ModelTier, GenerateWithToolsParams, GenerateWithToolsResult, GenerateTextStreamParams, StreamChunk } from './types';
import { ChatMessage, ToolCall } from '../../types';

class OpenAICompatibleProvider implements LLMProvider {
    private apiUrl: string;
    private apiKey: string;
    private modelMap: Record<ModelTier, string>;
    private providerName: string;

    constructor(config: { providerName: string; apiUrl: string; apiKey?: string; modelMap: Record<ModelTier, string> }) {
        if (!config.apiKey) {
            console.warn(`API key is missing for ${config.providerName} provider. It will not be usable unless the corresponding environment variable is set.`);
        }
        this.providerName = config.providerName;
        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey || '';
        this.modelMap = config.modelMap;
    }
    
    private checkApiKey(): void {
        if (!this.apiKey) {
            throw new Error(`API Key for ${this.providerName} is not configured. Please set the corresponding environment variable.`);
        }
    }

    private async makeApiCall<T>(body: object): Promise<T> {
        this.checkApiKey();

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: { message: 'Failed to parse error response' } }));
            console.error(`${this.providerName} API Error:`, errorBody);
            throw new Error(`${this.providerName} API request failed with status ${response.status}: ${errorBody.error?.message}`);
        }

        return response.json();
    }

    async generateText(params: GenerateTextParams): Promise<string> {
        const { model, prompt, systemInstruction } = params;
        const apiModel = this.modelMap[model];

        const messages: { role: 'system' | 'user', content: string }[] = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        try {
            const response: any = await this.makeApiCall({
                model: apiModel,
                messages: messages,
            });
            return response.choices[0]?.message?.content?.trim() || "";
        } catch (error) {
            console.error(`Error generating text with ${this.providerName} model ${apiModel}:`, error);
            throw new Error(`Failed to get text response from ${this.providerName}.`);
        }
    }

    async generateJson<T>(params: GenerateJsonParams): Promise<T> {
        const { model, prompt, schema, systemInstruction } = params;
        const apiModel = this.modelMap[model];

        const messages: { role: 'system' | 'user', content: string }[] = [];
        let systemPrompt = systemInstruction || "";
        systemPrompt += `\nYou must respond in a valid JSON format that strictly adheres to the following JSON schema. Do not include any explanations or markdown formatting.`;
    
        if (schema) {
            systemPrompt += `\n\nSCHEMA:\n${JSON.stringify(schema, null, 2)}`;
        }
        
        messages.push({ role: 'system', content: systemPrompt });
        
        const userPrompt = `${prompt}\n\nIMPORTANT: Respond with a single, valid JSON object that conforms to the schema provided in the system instructions.`;
        messages.push({ role: 'user', content: userPrompt });

        try {
            const response: any = await this.makeApiCall({
                model: apiModel,
                messages: messages,
                response_format: { type: "json_object" },
            });
            const jsonText = response.choices[0]?.message?.content?.trim();
            if (!jsonText) {
                throw new Error(`${this.providerName} returned an empty message for JSON request.`);
            }
            return JSON.parse(jsonText) as T;
        } catch (error) {
            console.error(`Error generating JSON with ${this.providerName} model ${apiModel}:`, error);
            throw new Error(`Failed to get a valid JSON response from ${this.providerName}.`);
        }
    }

    async generateContentWithTools(params: GenerateWithToolsParams): Promise<GenerateWithToolsResult> {
        const { model, history, tools, systemInstruction, agentCount } = params;
        const apiModel = this.modelMap[model];

        const openAITools = tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            }
        }));

        const shouldPrefix = (agentCount ?? 2) > 1;

        const messages = history.map(msg => {
            const content = shouldPrefix && msg.role === 'model' && msg.persona ? `[${msg.persona}]: ${msg.content}` : msg.content;
            
            if (msg.role === 'model' && msg.toolCalls) {
                return {
                    role: 'assistant',
                    content: content || null,
                    tool_calls: msg.toolCalls.map(call => ({
                        id: call.id,
                        type: 'function',
                        function: { name: call.name, arguments: JSON.stringify(call.args) }
                    }))
                };
            }
            if (msg.role === 'tool') {
                return {
                    role: 'tool',
                    tool_call_id: msg.tool_call_id,
                    content: msg.content,
                };
            }
            return {
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: content,
            };
        });

        if (systemInstruction) {
            messages.unshift({ role: 'system', content: systemInstruction });
        }

        try {
            const response: any = await this.makeApiCall({
                model: apiModel,
                messages: messages,
                tools: openAITools,
                tool_choice: 'auto',
            });

            const choice = response.choices[0]?.message;
            if (!choice) {
                throw new Error("Invalid response structure from API.");
            }

            const text = choice.content || null;
            let toolCalls: ToolCall[] | null = null;

            if (choice.tool_calls) {
                toolCalls = choice.tool_calls.map((tc: any) => {
                    try {
                        return {
                            id: tc.id || `openai-tool-call-${crypto.randomUUID()}`,
                            name: tc.function.name,
                            args: JSON.parse(tc.function.arguments),
                        };
                    } catch (e) {
                        console.error("Failed to parse tool call arguments:", e);
                        return null;
                    }
                }).filter(Boolean);
            }
            
            return { text, toolCalls, groundingChunks: null };
            
        } catch (error) {
            console.error(`Error generating content with tools using ${this.providerName} model ${apiModel}:`, error);
            throw new Error(`Failed to get agent response from ${this.providerName}.`);
        }
    }
    
    async generateTextStream(params: GenerateTextStreamParams): Promise<AsyncGenerator<StreamChunk>> {
        this.checkApiKey();
        const { model, history, systemInstruction } = params;
        const apiModel = this.modelMap[model];

        const messages: { role: 'system' | 'user' | 'assistant', content: string | null }[] = history.map(msg => {
            const content = msg.role === 'model' && msg.persona ? `[${msg.persona}]: ${msg.content}` : msg.content;
            return {
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: content,
            };
        });

        if (systemInstruction) {
            messages.unshift({ role: 'system', content: systemInstruction });
        }

        const body = {
            model: apiModel,
            messages: messages,
            stream: true,
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok || !response.body) {
                const errorBody = await response.json().catch(() => ({ error: { message: 'Failed to parse error response' } }));
                console.error(`${this.providerName} API Error:`, errorBody);
                throw new Error(`${this.providerName} API stream request failed with status ${response.status}: ${errorBody.error?.message}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            async function* streamGenerator(): AsyncGenerator<StreamChunk> {
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep the last partial line

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            if (data.trim() === '[DONE]') {
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                const textChunk = parsed.choices?.[0]?.delta?.content;
                                if (textChunk) {
                                    yield { text: textChunk };
                                }
                            } catch (e) {
                                // console.error('Error parsing stream chunk:', data, e);
                            }
                        }
                    }
                }
            }

            return streamGenerator();

        } catch (error) {
            console.error(`Error generating text stream with ${this.providerName} model ${apiModel}:`, error);
            throw new Error(`Failed to get text stream from ${this.providerName}.`);
        }
    }
}

export const openAIProvider = new OpenAICompatibleProvider({
    providerName: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY,
    modelMap: {
        lite: 'gpt-3.5-turbo-0125',
        fast: 'gpt-4o-mini',
        pro: 'gpt-4o',
    }
});

export const dashscopeProvider = new OpenAICompatibleProvider({
    providerName: 'DashScope',
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: process.env.DASHSCOPE_API_KEY,
    modelMap: {
        lite: 'qwen-turbo',
        fast: 'qwen-plus',
        pro: 'qwen-max',
    }
});

export const deepseekProvider = new OpenAICompatibleProvider({
    providerName: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY,
    modelMap: {
        lite: 'deepseek-chat',
        fast: 'deepseek-chat',
        pro: 'deepseek-coder',
    }
});

export const openRouterProvider = new OpenAICompatibleProvider({
    providerName: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY,
    modelMap: {
        lite: 'mistralai/mistral-7b-instruct:free',
        fast: 'google/gemini-flash-1.5',
        pro: 'anthropic/claude-3-opus',
    }
});