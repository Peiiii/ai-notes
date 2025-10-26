
import { LLMProvider, GenerateTextParams, GenerateJsonParams, ModelTier } from './types';

const API_KEY = process.env.API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set for OpenAI");
}

// Maps our abstract tiers to specific, recommended OpenAI model identifiers.
// Models supporting JSON mode are preferred for generateJson.
const OPENAI_MODELS: Record<ModelTier, string> = {
    lite: 'gpt-3.5-turbo-0125', // Fast, cheap, and supports JSON mode
    fast: 'gpt-4o-mini', // A good balance of cost, speed and intelligence
    pro: 'gpt-4o',       // The most capable model for complex tasks
};

/**
 * Implements the LLMProvider interface using the OpenAI API.
 * This module is responsible for all direct communication with OpenAI.
 */
class OpenAIProvider implements LLMProvider {
    private async makeApiCall<T>(body: object): Promise<T> {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("OpenAI API Error:", errorBody);
            throw new Error(`OpenAI API request failed with status ${response.status}: ${errorBody.error?.message}`);
        }

        return response.json();
    }

    async generateText(params: GenerateTextParams): Promise<string> {
        const { model, prompt, systemInstruction } = params;
        const openAIModel = OPENAI_MODELS[model];

        const messages: { role: 'system' | 'user', content: string }[] = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        try {
            const response: any = await this.makeApiCall({
                model: openAIModel,
                messages: messages,
            });
            return response.choices[0]?.message?.content?.trim() || "";
        } catch (error) {
            console.error(`Error generating text with OpenAI model ${openAIModel}:`, error);
            throw new Error("Failed to get text response from OpenAI.");
        }
    }

    async generateJson<T>(params: GenerateJsonParams): Promise<T> {
        const { model, prompt, systemInstruction } = params;
        const openAIModel = OPENAI_MODELS[model];

        const messages: { role: 'system' | 'user', content: string }[] = [];
        // For JSON mode, the system instruction is critical for some models
        let systemPrompt = systemInstruction || "";
        systemPrompt += "\nYou must respond in a valid JSON format.";
        messages.push({ role: 'system', content: systemPrompt });
        
        // Add a reminder in the user prompt as well for reliability
        const userPrompt = `${prompt}\n\nIMPORTANT: Respond with a single, valid JSON object only. Do not include any other text, explanations, or markdown formatting.`;
        messages.push({ role: 'user', content: userPrompt });

        try {
            const response: any = await this.makeApiCall({
                model: openAIModel,
                messages: messages,
                response_format: { type: "json_object" },
            });
            const jsonText = response.choices[0]?.message?.content?.trim();
            if (!jsonText) {
                throw new Error("OpenAI returned an empty message for JSON request.");
            }
            return JSON.parse(jsonText) as T;
        } catch (error) {
            console.error(`Error generating JSON with OpenAI model ${openAIModel}:`, error);
            throw new Error("Failed to get a valid JSON response from OpenAI.");
        }
    }
}

export const openAIProvider = new OpenAIProvider();
