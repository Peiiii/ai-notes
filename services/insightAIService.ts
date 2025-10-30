
import { ProactiveSuggestion, Note, ChatMessage } from '../types';
import { GenerateJsonParams, GenerateWithToolsParams, GenerateWithToolsResult } from './providers/types';
import { getConfig } from './aiService';
import { Type, FunctionDeclaration } from "@google/genai";

// --- Proactive Insights ---
const findRelatedNotesTool: FunctionDeclaration = {
    name: 'find_related_notes',
    description: "Based on the user's current text, finds a single highly relevant note from their existing notes.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: "The core topic or concept from the user's text to search for in other notes." }
        },
        required: ['topic']
    }
};

const identifyActionItemTool: FunctionDeclaration = {
    name: 'identify_action_item',
    description: "Identifies a single, clear, and actionable to-do item from the user's text.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            task: { type: Type.STRING, description: "The full text of the identified to-do item." }
        },
        required: ['task']
    }
};

const identifyWikiConceptTool: FunctionDeclaration = {
    name: 'identify_wiki_concept',
    description: "Identifies a new, significant concept or term from the user's text that would be suitable for a new wiki entry.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            term: { type: Type.STRING, description: "The specific term or concept identified." }
        },
        required: ['term']
    }
};

export const insightTools = [findRelatedNotesTool, identifyActionItemTool, identifyWikiConceptTool];

export async function getLiveInsights(textSnippet: string, allNotes: Note[]): Promise<GenerateWithToolsResult> {
    const systemInstruction = `You are a proactive assistant analyzing a user's writing in real-time. Your goal is to be as helpful as possible by finding relevant connections and suggestions.
- Use 'find_related_notes' to link to existing knowledge. Be liberal; it's better to show a loosely related note than nothing.
- Use 'identify_action_item' to capture potential tasks.
- Use 'identify_wiki_concept' to suggest knowledge base expansion for key terms.
You have access to the titles of all notes for context.

All Note Titles:
- ${allNotes.map(n => n.title).filter(Boolean).join('\n- ')}
`;

    const history: ChatMessage[] = [{
        id: crypto.randomUUID(),
        role: 'user',
        content: `Here is the latest text snippet I'm writing:\n\n"${textSnippet}"`
    }];

    const { provider, model } = getConfig('agent_proactive');
    const params: GenerateWithToolsParams = {
        model,
        history,
        tools: insightTools,
        systemInstruction,
    };
    return provider.generateContentWithTools(params);
}

// --- Proactive Chat Suggestions ---
const proactiveSuggestionsSchema = {
    type: Type.ARRAY,
    description: "An array of 3-4 proactive suggestions for the user.",
    items: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: "The text of the suggestion, ready to be sent as a user message (e.g., 'Summarize my recent notes')."
            },
            description: {
                type: Type.STRING,
                description: "A brief, user-facing explanation of why this suggestion is being made (e.g., 'To catch you up on your latest thoughts.')."
            }
        },
        required: ["prompt", "description"]
    }
};

export async function generateProactiveSuggestions(notes: Note[]): Promise<ProactiveSuggestion[]> {
    if (notes.length === 0) return [];

    const notesContent = notes
        .slice(0, 15) // Limit context size
        .map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content.substring(0, 500)}...`)
        .join('\n\n---\n\n');

    const prompt = `You are a proactive AI assistant in a note-taking app. Your goal is to be insightful and helpful. Analyze the following user notes and generate 3-4 interesting and relevant conversation starters or tasks for the user. Frame them as prompts that the user could give you.

**Possible Suggestion Types:**
- **Summarize recent notes:** If there are new, unprocessed notes. (e.g., "Summarize my last 3 notes.")
- **Connect ideas:** Find a non-obvious link between two or more notes. (e.g., "What's the connection between my note on 'Stoicism' and the one on 'Productivity'?")
- **Create a wiki entry:** Identify a recurring key concept that could be expanded upon. (e.g., "Create a wiki page for 'Mental Models'.")
- **Identify a forgotten idea:** Resurface an interesting point from an older note. (e.g., "Remind me about that idea I had on 'asynchronous communication'.")

**Rules:**
- Provide a diverse set of suggestions.
- Keep the suggestion prompt text concise and conversational.
- Keep the description short and user-friendly.
- Base your suggestions strictly on the provided notes.
- Respond in the primary language used in the notes.
- Respond ONLY with a valid JSON object conforming to the schema.

**Notes:**
---
${notesContent}
---`;
    
    const { provider, model } = getConfig('proactiveSuggestions');
    const params: GenerateJsonParams = { model, prompt, schema: proactiveSuggestionsSchema };
    return provider.generateJson(params);
}
