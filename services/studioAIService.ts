
import { Note, KnowledgeCard } from '../types';
import { GenerateJsonParams } from './providers/types';
import { getConfig } from './aiService';
import { Type } from "@google/genai";

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        todos: {
            type: Type.ARRAY,
            description: "A list of actionable to-do items extracted from the notes.",
            items: {
                type: Type.STRING
            }
        },
        knowledgeCards: {
            type: Type.ARRAY,
            description: "A diverse list of knowledge cards based on the notes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The type of knowledge card.",
                        enum: ['encyclopedia', 'creative_story', 'note_synthesis', 'new_theory', 'idea']
                    },
                    title: {
                        type: Type.STRING,
                        description: "The title of the knowledge card."
                    },
                    content: {
                        type: Type.STRING,
                        description: "The main content of the knowledge card."
                    },
                    sources: {
                        type: Type.ARRAY,
                        description: "An array of source URLs, required for 'encyclopedia' type cards.",
                        items: {
                            type: Type.STRING
                        }
                    }
                },
                required: ['type', 'title', 'content']
            }
        }
    },
    required: ['todos', 'knowledgeCards']
};

export async function generateSummary(notes: Note[]): Promise<{ todos: string[]; knowledgeCards: Omit<KnowledgeCard, 'id'>[] }> {
    if (notes.length === 0) return { todos: [], knowledgeCards: [] };

    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    const prompt = `
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
${notesContent}`;
    
    const { provider, model } = getConfig('summary');
    const params: GenerateJsonParams = { model, prompt, schema: summarySchema };
    return provider.generateJson(params);
}

const pulseReportSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The main title for the Pulse Report."
        },
        content: {
            type: Type.STRING,
            description: "The full content of the Pulse Report, formatted in Markdown."
        }
    },
    required: ['title', 'content']
};

export async function generatePulseReport(notes: Note[]): Promise<{ title: string; content: string }> {
    if (notes.length === 0) {
        return { title: "Not Enough Data", content: "Write at least one note to generate your first Pulse report." };
    }
    const notesContent = notes
        .map(note => `Date: ${new Date(note.createdAt).toISOString().split('T')[0]}\nTitle: ${note.title || 'Untitled'}\nContent: ${note.content}`)
        .join('\n\n---\n\n');
    
    const prompt = `
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
${notesContent}`;
    
    const { provider, model } = getConfig('pulseReport');
    const params: GenerateJsonParams = { model, prompt, schema: pulseReportSchema };
    return provider.generateJson(params);
}

const mindMapNodeSchema: any = {
    type: Type.OBJECT,
    properties: {
        label: {
            type: Type.STRING,
            description: "The concise label for this node."
        },
        children: {
            type: Type.ARRAY,
            description: "An array of child nodes.",
            items: {} // Placeholder for recursion
        }
    },
    required: ['label']
};
mindMapNodeSchema.properties.children.items = {
    ...mindMapNodeSchema,
    properties: {
        ...mindMapNodeSchema.properties,
        children: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { label: { type: Type.STRING } },
                required: ['label']
            }
        }
    }
};

const mindMapSchema = {
    type: Type.OBJECT,
    properties: {
        root: mindMapNodeSchema
    },
    required: ['root']
};

export async function generateMindMap(notes: Note[]): Promise<{ root: { label: string, children?: any[] } }> {
    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    const prompt = `
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
${notesContent}`;

    const { provider, model } = getConfig('mindMap');
    const params: GenerateJsonParams = { model, prompt, schema: mindMapSchema };
    return provider.generateJson(params);
}
