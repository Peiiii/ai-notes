
import { Note, ChatMessage, DebateSynthesis } from '../types';
import { GenerateJsonParams, GenerateTextParams } from './providers/types';
import { getConfig } from './aiService';
import { Type } from "@google/genai";

const topicsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

export async function generateDebateTopics(notes: Note[]): Promise<string[]> {
    if (notes.length === 0) return [];
    
    const notesContent = notes
        .slice(0, 15)
        .map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`)
        .join('\n\n---\n\n');

    const prompt = `You are an expert in identifying controversial and intellectually stimulating topics for debate. Analyze the following user notes. Extract 5 topics that are suitable for a debate between two AI personas: a pragmatist and a visionary. The topics should be phrased as propositions, questions, or challenging statements.

IMPORTANT: The suggested topics MUST be in the primary language used in the notes provided below.

Return the result as a JSON array of strings. Do not include any other text.

Example format: ["Is technological progress always beneficial for humanity?", "The ethics of artificial intelligence in art", "Centralized vs. Decentralized systems: Which is better for society?"]

Notes:
---
${notesContent}
---`;

    const { provider, model } = getConfig('debateTopics');
    const params: GenerateJsonParams = { model, prompt, schema: topicsSchema };
    return provider.generateJson(params);
}

export async function generateDebateTurn(
    topic: string,
    history: ChatMessage[],
    personaDefinition: string,
    noteContext?: string
): Promise<string> {
    const historyContent = history
        .map(msg => `${msg.persona || 'System'}: ${msg.content}`)
        .join('\n');

    const prompt = `You are an AI assistant participating in a debate. You must strictly and consistently adhere to the persona assigned to you.

**Debate Topic:** ${topic}
${noteContext ? `\n**Context from User's Note:**\n${noteContext}\n` : ''}
**Your Assigned Persona:**
${personaDefinition}

**Debate History (so far):**
${historyContent}

**Your Task:**
Based on your persona and the debate so far, provide your next statement. Your response should be a single, concise paragraph. It should directly address the last statement if one exists, or provide an opening argument if the history is empty. Do not greet or introduce yourself. Just state your argument directly. Your response must be in the same language as the topic and context.`;

    const { provider, model } = getConfig('debateTurn');
    const params: GenerateTextParams = { model, prompt };
    return provider.generateText(params);
}

const synthesisSchema = {
    type: Type.OBJECT,
    properties: {
        keyPointsPragmatist: {
            type: Type.ARRAY,
            description: "A list of 2-3 key arguments made by The Pragmatist.",
            items: { type: Type.STRING }
        },
        keyPointsVisionary: {
            type: Type.ARRAY,
            description: "A list of 2-3 key arguments made by The Visionary.",
            items: { type: Type.STRING }
        },
        coreTension: {
            type: Type.STRING,
            description: "A single sentence that masterfully identifies the central conflict or trade-off between the two viewpoints."
        },
        nextSteps: {
            type: Type.ARRAY,
            description: "A list of 2-3 insightful questions or potential action items for the user to explore next, based on the synthesis.",
            items: { type: Type.STRING }
        }
    },
    required: ["keyPointsPragmatist", "keyPointsVisionary", "coreTension", "nextSteps"]
};


export async function generateDebateSynthesis(topic: string, history: ChatMessage[]): Promise<DebateSynthesis> {
    const historyContent = history
        .map(msg => `${msg.persona}: ${msg.content}`)
        .join('\n');

    const prompt = `You are a neutral and insightful debate moderator. Your task is to synthesize the preceding debate for the user, providing a clear, actionable summary.

**Debate Topic:** ${topic}

**Full Debate Transcript:**
${historyContent}

**Your Task:**
Analyze the transcript and generate a structured summary.
-   Summarize the key arguments for each persona.
-   Identify the core tension or fundamental disagreement.
-   Propose concrete next steps or questions for the user to reflect on.

Respond ONLY with a valid JSON object that conforms to the requested schema. Do not include any other text or markdown formatting. The language of your response must match the language used in the debate transcript.`;
    
    const { provider, model } = getConfig('debateSynthesis');
    const params: GenerateJsonParams = { model, prompt, schema: synthesisSchema };
    return provider.generateJson(params);
}