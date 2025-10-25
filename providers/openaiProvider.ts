import OpenAI from 'openai';
import { AIProvider, JsonOptions, JsonSchema, TextOptions } from './AIProvider';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing required env for OpenAI API key');
    const baseURL = import.meta.env.VITE_OPENAI_BASE_URL || import.meta.env.VITE_AI_BASE_URL;
    this.client = new OpenAI({ apiKey, baseURL, dangerouslyAllowBrowser: true });
    this.defaultModel = import.meta.env.VITE_OPENAI_MODEL || import.meta.env.VITE_AI_MODEL
      || 'gpt-4o-mini';
  }

  async generateText(prompt: string, options?: TextOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const resp: any = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature,
      stream: false,
    });
    const msg = resp.choices?.[0]?.message?.content as unknown;
    const text = typeof msg === 'string' ? msg : Array.isArray(msg) ? (msg as any[]).map(String).join('') : '';
    return text.trim();
  }

  async generateJson<T>(prompt: string, schema: JsonSchema, options?: JsonOptions): Promise<T> {
    const model = options?.model || this.defaultModel;
    const schemaHint = JSON.stringify(schema);
    const jsonPrompt = `${prompt}\n\nYou MUST return a single JSON object that strictly matches this JSON Schema: ${schemaHint}.\nRules: Do not include any extra text. Do not leave any required fields empty. If content is required, write a useful, non-empty value.`;
    const body: Parameters<typeof this.client.chat.completions.create>[0] = {
      model,
      messages: [{ role: 'user', content: jsonPrompt }],
      temperature: options?.temperature,
      stream: false,
    } as any;
    const base = (this.client as any).baseURL as string | undefined;
    const force = (import.meta as any)?.env?.VITE_OPENAI_FORCE_JSON === '1';
    if (force || !base || /openai\.com/.test(base)) {
      (body as any).response_format = { type: 'json_object' };
    }
    const resp: any = await this.client.chat.completions.create(body);
    const msg = resp.choices?.[0]?.message?.content as unknown;
    const text = typeof msg === 'string' ? msg : Array.isArray(msg) ? (msg as any[]).map(String).join('') : '';
    return JSON.parse(text) as T;
  }
}
