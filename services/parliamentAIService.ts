
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

export async function generatePodcastTurn(
    topic: string,
    history: ChatMessage[],
    persona: 'Host' | 'Guest Expert',
    turnType: 'intro' | 'question' | 'answer' | 'outro' | 'greeting',
    noteContext?: string
): Promise<string> {
    const historyContent = history.map(msg => `${msg.persona}: ${msg.content}`).join('\n');
    let personaDefinition = '';
    let task = '';

    switch (persona) {
        case 'Host':
            personaDefinition = "You are Alex, the charismatic and curious host of the popular podcast 'Mindscapes'. You are known for your ability to ask insightful questions, keep the conversation engaging and accessible, and synthesize complex ideas for your audience.";
            switch (turnType) {
                case 'intro':
                    task = "Start the show. Welcome the listeners to 'Mindscapes', introduce today's fascinating topic, and warmly welcome your special guest, the brilliant Dr. Evelyn Reed.";
                    break;
                case 'question':
                    task = "Based on Dr. Reed's last statement and the overall conversation, ask your next question. It should be insightful, open-ended, and guide the conversation into a new, interesting area. Keep it conversational.";
                    break;
                case 'outro':
                    task = "Wrap up the show. Thank Dr. Evelyn Reed for her incredible insights. Provide a brief, powerful summary of the key takeaways for the listeners, and sign off in your signature style.";
                    break;
            }
            break;
        case 'Guest Expert':
            personaDefinition = "You are Dr. Evelyn Reed, a renowned expert in your field and a guest on the podcast 'Mindscapes'. You are passionate, articulate, and have a knack for explaining complex topics with clarity and enthusiasm, often using vivid analogies.";
            switch (turnType) {
                case 'greeting':
                    task = "Alex, the host, has just welcomed you to the show. Respond with a brief, warm greeting. Thank him for having you and express your excitement to discuss the topic.";
                    break;
                case 'answer':
                    task = "Answer Alex's last question. Speak with passion and expertise. Provide a clear, detailed explanation, and if possible, use an interesting analogy or a brief anecdote to make your point more memorable.";
                    break;
            }
            break;
    }
    
    const prompt = `You are an AI performing a role in a podcast episode. Strictly adhere to your assigned persona and task.

**Podcast Topic:** ${topic}
${noteContext ? `\n**Context from User's Note (for your reference):**\n${noteContext}\n` : ''}
**Your Persona:**
${personaDefinition}

**Conversation History:**
${historyContent}

**Your Current Task:**
${task}

**Instructions:**
- Respond in a natural, conversational style suitable for a podcast.
- Keep your response to one or two engaging paragraphs.
- Respond in the same language as the topic and context.
- Do not add any extra text like "(Podcast ends)" or your character name. Just provide the dialogue.
`;

    const { provider, model } = getConfig('podcastTurn');
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
