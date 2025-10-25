import { GoogleGenAI, Type } from '@google/genai';
import { AIProvider, JsonOptions, JsonSchema, TextOptions } from './AIProvider';

function toGeminiType(t: JsonSchema['type']) {
  switch (t) {
    case 'object': return Type.OBJECT;
    case 'array': return Type.ARRAY;
    case 'string': return Type.STRING;
    case 'number': return Type.NUMBER;
    case 'integer': return Type.INTEGER;
    case 'boolean': return Type.BOOLEAN;
    default: return Type.STRING;
  }
}

function toGeminiSchema(schema: JsonSchema): any {
  const out: any = { type: toGeminiType(schema.type) };
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.required) out.required = schema.required;
  if (schema.properties) {
    out.properties = {} as Record<string, any>;
    for (const [k, v] of Object.entries(schema.properties)) {
      out.properties[k] = toGeminiSchema(v);
    }
  }
  if (schema.items) out.items = toGeminiSchema(schema.items);
  return out;
}

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private defaultModel: string;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing required env for Gemini API key');
    this.ai = new GoogleGenAI({ apiKey });
    this.defaultModel = import.meta.env.VITE_GEMINI_MODEL || import.meta.env.VITE_AI_MODEL
      || 'gemini-2.5-flash';
  }

  async generateText(prompt: string, options?: TextOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text.trim();
  }

  async generateJson<T>(prompt: string, schema: JsonSchema, options?: JsonOptions): Promise<T> {
    const model = options?.model || this.defaultModel;
    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: toGeminiSchema(schema),
      },
    });
    const text = response.text.trim();
    return JSON.parse(text) as T;
  }
}
