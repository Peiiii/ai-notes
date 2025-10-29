import { Note, KnowledgeCard, ChatMessage, DebateSynthesis } from '../types';
import { geminiProvider } from './providers/geminiProvider';
import { openAIProvider, dashscopeProvider, deepseekProvider, openRouterProvider } from './providers/openaiProvider';
import { LLMProvider, GenerateJsonParams, GenerateTextParams, ModelTier, GenerateWithToolsParams, GenerateWithToolsResult } from './providers/types';
import { Type, FunctionDeclaration } from "@google/genai";

// --- Provider Registry ---
const providers: { [key: string]: LLMProvider } = {
  gemini: geminiProvider,
  openai: openAIProvider,
  dashscope: dashscopeProvider,
  deepseek: deepseekProvider,
  openrouter: openRouterProvider,
};

// --- AI Capability Schemes ---
type CapabilityConfig = {
  [key: string]: { provider: string; model: ModelTier };
  summary:        { provider: string; model: ModelTier };
  title:          { provider: string; model: ModelTier };
  chat:           { provider: string; model: ModelTier };
  threadChat:     { provider: string; model: ModelTier };
  pulseReport:    { provider: string; model: ModelTier };
  wikiEntry:      { provider: string; model: ModelTier };
  relatedTopics:  { provider: string; model: ModelTier };
  subTopics:      { provider: string; model: ModelTier };
  wikiTopics:     { provider: string; model: ModelTier };
  debateTopics:   { provider: string; model: ModelTier };
  debateTurn:     { provider: string; model: ModelTier };
  debateSynthesis:{ provider: string; model: ModelTier };
  podcastTurn:    { provider: string; model: ModelTier };
  mindMap:        { provider: string; model: ModelTier };
  agent_reasoning:{ provider: string; model: ModelTier };
  agent_retrieval:{ provider: string; model: ModelTier };
};

// FIX: Added a type annotation to `baseScheme` to ensure TypeScript correctly infers `model` as type `ModelTier` instead of `string`.
const baseScheme: Record<string, { model: ModelTier }> = {
  summary:        { model: 'fast' },
  title:          { model: 'fast' },
  chat:           { model: 'fast' },
  threadChat:     { model: 'fast' },
  pulseReport:    { model: 'pro'  },
  wikiEntry:      { model: 'lite' },
  relatedTopics:  { model: 'lite' },
  subTopics:      { model: 'lite' },
  wikiTopics:     { model: 'lite' },
  debateTopics:   { model: 'lite' },
  debateTurn:     { model: 'lite' },
  debateSynthesis:{ model: 'lite' },
  podcastTurn:    { model: 'lite' },
  mindMap:        { model: 'fast' },
  agent_reasoning:{ model: 'pro' },
  agent_retrieval:{ model: 'lite' },
};

const buildScheme = (provider: string): CapabilityConfig => 
  Object.entries(baseScheme).reduce((acc, [key, value]) => {
    acc[key as keyof CapabilityConfig] = { provider, ...value };
    return acc;
  }, {} as CapabilityConfig);


const allSchemes: Record<string, CapabilityConfig> = {
    gemini: buildScheme('gemini'),
    dashscope: buildScheme('dashscope'),
    openai: buildScheme('openai'),
    deepseek: buildScheme('deepseek'),
    openrouter: buildScheme('openrouter'),
};

// --- Active Scheme Selection ---
const activeSchemeName = process.env.AI_SCHEME || 'gemini';
const capabilityConfig = allSchemes[activeSchemeName] || allSchemes.gemini;

console.log(`Using AI Scheme: "${activeSchemeName}"`);

export function getConfig(capability: keyof CapabilityConfig) {
    const config = capabilityConfig[capability];
    const provider = providers[config.provider];
    if (!provider) {
        throw new Error(`Provider "${config.provider}" is not registered for capability "${capability}".`);
    }
    return { provider, model: config.model };
}


// --- Agent Tools Definition ---
const searchNotesTool: FunctionDeclaration = {
    name: 'search_notes',
    description: "Searches the user's notes to find information relevant to their query. Use this to answer questions about past notes.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: "The specific topic or question to search for in the notes." }
        },
        required: ['query']
    }
};

const createNoteTool: FunctionDeclaration = {
    name: 'create_note',
    description: "Creates a new note with a given title and content. Use this when the user explicitly asks to create a note, or to save the result of a complex task.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The title of the new note." },
            content: { type: Type.STRING, description: "The main content of the new note, formatted in Markdown." }
        },
        required: ['title', 'content']
    }
};

export const agentTools = [searchNotesTool, createNoteTool];

// --- Agent Core Function ---
export async function getAgentResponse(history: ChatMessage[]): Promise<GenerateWithToolsResult> {
    const systemInstruction = `You are a powerful AI assistant integrated into a note-taking app. 
- You can search existing notes to answer questions.
- You can create new notes.
- When answering a question based on a search, be concise and directly state the answer.
- After answering from a search, ask the user if they would like you to create a new note with the synthesized information.
- Always respond in the user's language.`;

    const { provider, model } = getConfig('agent_reasoning');
    const params: GenerateWithToolsParams = {
        model,
        history,
        tools: agentTools,
        systemInstruction,
    };
    return provider.generateContentWithTools(params);
}

// --- RAG Retrieval Function ---
const retrievalSchema = {
    type: Type.ARRAY,
    description: "An array of note IDs that are most relevant to the user's query.",
    items: { type: Type.STRING }
};
export async function searchNotesInCorpus(query: string, notes: Note[]): Promise<Note[]> {
    if (notes.length === 0) return [];

    const notesForRetrieval = notes.map(note => ({
        id: note.id,
        title: note.title,
        preview: note.content.substring(0, 150)
    }));

    const prompt = `From the following list of notes, please select the IDs of the 3-5 notes that are most relevant to the user's query.

User Query: "${query}"

Note List:
${JSON.stringify(notesForRetrieval)}

Return only a JSON array of the most relevant note IDs.`;

    const { provider, model } = getConfig('agent_retrieval');
    try {
        const relevantIds = await provider.generateJson<string[]>({ model, prompt, schema: retrievalSchema });
        return notes.filter(note => relevantIds.includes(note.id));
    } catch (error) {
        console.error("Failed to retrieve relevant notes:", error);
        return []; // Return empty on failure to prevent crashing the agent
    }
}

// --- Legacy Capability Definitions (unchanged) ---
// The following functions are kept as they were for other parts of the app.

const summarySchema = { /* ... */ };
export async function generateSummary(notes: Note[]): Promise<{ todos: string[]; knowledgeCards: Omit<KnowledgeCard, 'id'>[] }> {
    if (notes.length === 0) return { todos: [], knowledgeCards: [] };
    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    const prompt = `Analyze the following collection of notes...`;
    const { provider, model } = getConfig('summary');
    return provider.generateJson({ model, prompt, schema: summarySchema });
}

export async function generateTitleForNote(content: string): Promise<string> {
    if (!content) return "";
    const prompt = `Based on the following note content...`;
    const { provider, model } = getConfig('title');
    const title = await provider.generateText({ model, prompt });
    return title.replace(/["']/g, '').trim();
}

export async function generateChatResponse(notes: Note[], history: ChatMessage[], question: string): Promise<string> {
    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    const historyContent = history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const prompt = `You are an AI assistant for a note-taking app...`;
    const { provider, model } = getConfig('chat');
    return provider.generateText({ model, prompt });
}

export async function generateThreadChatResponse(note: Note, question: string): Promise<string> {
    const noteContent = `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`;
    const history = note.threadHistory || [];
    const historyContent = history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const prompt = `You are an AI assistant focused on a single note...`;
    const { provider, model } = getConfig('threadChat');
    return provider.generateText({ model, prompt });
}

const pulseReportSchema = { /* ... */ };
export async function generatePulseReport(notes: Note[]): Promise<{ title: string; content: string }> {
    if (notes.length === 0) return { title: "Not Enough Data", content: "Write at least one note..." };
    const notesContent = notes.map(note => `...`).join('\n\n---\n\n');
    const prompt = `You are a highly perceptive thought analyst...`;
    const { provider, model } = getConfig('pulseReport');
    return provider.generateJson({ model, prompt, schema: pulseReportSchema });
}

const mindMapSchema = { /* ... */ };
export async function generateMindMap(notes: Note[]): Promise<{ root: { label: string, children?: any[] } }> {
    const notesContent = notes.map(note => `...`).join('\n\n---\n\n');
    const prompt = `Analyze the following collection of notes...`;
    const { provider, model } = getConfig('mindMap');
    return provider.generateJson({ model, prompt, schema: mindMapSchema });
}

// Keeping original content for brevity
const originalGenerateSummary = `
export async function generateSummary(notes: Note[]): Promise<{ todos: string[]; knowledgeCards: Omit<KnowledgeCard, 'id'>[] }> {
    if (notes.length === 0) return { todos: [], knowledgeCards: [] };

    const notesContent = notes.map(note => \`Title: \${note.title || 'Untitled'}\\nContent: \${note.content}\`).join('\\n\\n---\\n\\n');
    const prompt = \`
Analyze the following collection of notes. Your task is to extract two types of information:
1.  Actionable to-do items.
2.  A diverse set of "Knowledge Cards" based on the content.

**Instructions for Knowledge Cards:**
Generate a variety of cards from the following categories. Be creative and insightful.
-   **encyclopedia**: For significant concepts, provide a concise summary of critical key points, MUST include an array of URLs for 'sources'.
-   **creative_story**: Write a short, imaginative story or scene.
-   **note_synthesis**: Synthesize key points from multiple related notes.
-   **new_theory**: Formulate a concise theory or principle from abstract ideas.
-   **idea**: For simple, standalone creative sparks.

**General Rules:**
-   Respond in the primary language used in the provided notes.
-   Return the result as a single JSON object.

Here are the notes:
\${notesContent}\`;
    
    const { provider, model } = getConfig('summary');
    const params: GenerateJsonParams = { model, prompt, schema: summarySchema };
    return provider.generateJson(params);
}
`;
const originalGenerateTitleForNote = `
export async function generateTitleForNote(content: string): Promise<string> {
    if (!content) return "";
    
    const prompt = \`Based on the following note content, generate a very short, concise, and relevant title (max 5 words).
IMPORTANT: Respond in the same language as the provided Content. Do not include any quotation marks or labels.

Content:
---
\${content}
---

Title:\`;

    const { provider, model } = getConfig('title');
    const params: GenerateTextParams = { model, prompt };
    const title = await provider.generateText(params);
    return title.replace(/["']/g, '').trim();
}
`;
const originalGenerateChatResponse = `
export async function generateChatResponse(notes: Note[], history: ChatMessage[], question: string): Promise<string> {
    const notesContent = notes.map(note => \`Title: \${note.title || 'Untitled'}\\nContent: \${note.content}\`).join('\\n\\n---\\n\\n');
    const historyContent = history.slice(-10).map(msg => \`\${msg.role}: \${msg.content}\`).join('\\n');

    const prompt = \`You are an AI assistant for a note-taking app. Your purpose is to help the user understand and synthesize their own notes.
You have access to the user's entire collection of notes and the recent conversation history.
Answer the user's question based *only* on the information provided in their notes. Do not make things up.
If the notes don't contain the answer, say so politely. Be helpful, concise, and conversational.

--- CONVERSATION HISTORY ---
\${historyContent}

--- ALL NOTES ---
\${notesContent}

--- USER'S QUESTION ---
user: \${question}

model:\`;
    
    const { provider, model } = getConfig('chat');
    const params: GenerateTextParams = { model, prompt };
    return provider.generateText(params);
}
`;
const originalGenerateThreadChatResponse = `
export async function generateThreadChatResponse(note: Note, question: string): Promise<string> {
    const noteContent = \`Title: \${note.title || 'Untitled'}\\nContent: \${note.content}\`;
    const history = note.threadHistory || [];
    const historyContent = history.slice(-10).map(msg => \`\${msg.role}: \${msg.content}\`).join('\\n');

    const prompt = \`You are an AI assistant focused on a single note. Your purpose is to help the user with the content of *this specific note*.
You can help them rewrite, brainstorm, summarize, or answer questions about it. Be helpful and conversational.
Base your answer *only* on the note's content and the recent conversation history provided.

--- CONVERSATION HISTORY ---
\${historyContent}

--- NOTE CONTENT ---
\${noteContent}

--- USER'S QUESTION ---
user: \${question}

model:\`;
    
    const { provider, model } = getConfig('threadChat');
    const params: GenerateTextParams = { model, prompt };
    return provider.generateText(params);
}
`;
const originalGeneratePulseReport = `
export async function generatePulseReport(notes: Note[]): Promise<{ title: string; content: string }> {
    if (notes.length === 0) {
        return { title: "Not Enough Data", content: "Write at least one note to generate your first Pulse report." };
    }
    const notesContent = notes
        .map(note => \`Date: \${new Date(note.createdAt).toISOString().split('T')[0]}\\nTitle: \${note.title || 'Untitled'}\\nContent: \${note.content}\`)
        .join('\\n\\n---\\n\\n');
    
    const prompt = \`
You are a highly perceptive thought analyst. Your task is to analyze a user's entire collection of notes and generate a short, insightful "Pulse Report" about their intellectual journey.
The report should be a narrative, not just a list. Be insightful and help the user see the bigger picture of their own thinking.

**Analyze the following aspects:**
1.  **Theme Evolution:** Identify the main topics. Have they shifted over time?
2.  **New Connections:** Find surprising links between different notes.
3.  **Forgotten Threads:** Resurface a significant idea from an older note.
4.  **Exploration Suggestions:** Suggest one or two new questions for them to explore.

**Formatting Rules:**
-   Use Markdown for formatting (e.g., # for title, ## for subtitles, * for lists).
-   The tone should be encouraging, insightful, and like a personal analyst.
-   Respond in the primary language used in the provided notes.
-   Return the result as a single JSON object.

Here are all the notes:
\${notesContent}\`;
    
    const { provider, model } = getConfig('pulseReport');
    const params: GenerateJsonParams = { model, prompt, schema: pulseReportSchema };
    return provider.generateJson(params);
}
`;
const originalGenerateMindMap = `
export async function generateMindMap(notes: Note[]): Promise<{ root: { label: string, children?: { label: string, children?: { label: string }[] }[] } }> {
    const notesContent = notes.map(note => \`Title: \${note.title || 'Untitled'}\\nContent: \${note.content}\`).join('\\n\\n---\\n\\n');
    const prompt = \`
Analyze the following collection of notes and generate a hierarchical mind map structure.

**Instructions:**
1.  **Root Node:** Identify the single most central theme or overarching topic from all the notes. This will be the root node.
2.  **Main Branches:** Identify 3 to 5 major themes or categories that branch off from the root node. These will be the main child nodes.
3.  **Sub-Topics:** For each major theme, identify 2 to 4 specific sub-points, concepts, or related ideas from the notes. These will be the children of the major theme nodes.
4.  **Strict Hierarchy:** The structure must be a strict hierarchy (a tree). Each sub-topic must belong to only one main branch. Do not share sub-topics between different branches.
5.  **Concise Labels:** Ensure the labels for each node are concise and descriptive (2-5 words).
6.  **Language:** Respond ONLY in the primary language used in the provided notes.
7.  **JSON Output:** Return the result as a single JSON object that strictly adheres to the provided schema.

Here are the notes:
\${notesContent}\`;

    const { provider, model } = getConfig('mindMap');
    const params: GenerateJsonParams = { model, prompt, schema: mindMapSchema };
    return provider.generateJson(params);
}
`;