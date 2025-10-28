import { LLMProvider, GenerateTextParams, GenerateJsonParams, ModelTier } from './types';

/**
 * A generic provider for any OpenAI-compatible API.
 * This class is instantiated with specific configurations for different services.
 */
class OpenAICompatibleProvider implements LLMProvider {
    private apiUrl: string;
    private apiKey: string;
    private modelMap: Record<ModelTier, string>;
    private providerName: string;

    constructor(config: { providerName: string; apiUrl: string; apiKey?: string; modelMap: Record<ModelTier, string> }) {
        if (!config.apiKey) {
            // This allows the app to load without all keys being present.
            // An error will be thrown at runtime if a provider without a key is used.
            console.warn(`API key is missing for ${config.providerName} provider. It will not be usable unless the corresponding environment variable is set.`);
        }
        this.providerName = config.providerName;
        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey || ''; // Default to empty string if not provided
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
            const errorBody = await response.json();
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
        const { model, prompt, systemInstruction } = params;
        const apiModel = this.modelMap[model];

        const messages: { role: 'system' | 'user', content: string }[] = [];
        let systemPrompt = systemInstruction || "";
        systemPrompt += "\nYou must respond in a valid JSON format.";
        messages.push({ role: 'system', content: systemPrompt });
        
        const userPrompt = `${prompt}\n\nIMPORTANT: Respond with a single, valid JSON object only. Do not include any other text, explanations, or markdown formatting.`;
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
}


// --- Provider Instances ---

export const openAIProvider = new OpenAICompatibleProvider({
    providerName: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.API_KEY,
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
        pro: 'qwen3-max-preview',
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
