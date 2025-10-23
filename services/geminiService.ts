
import { GoogleGenAI, Type } from "@google/genai";
import { Note, KnowledgeCard, ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        todos: {
            type: Type.ARRAY,
            description: "A list of actionable to-do items or tasks extracted from the notes.",
            items: {
                type: Type.STRING
            }
        },
        knowledgeCards: {
            type: Type.ARRAY,
            description: "A list of diverse, categorized knowledge cards generated based on the notes' content.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The category of the card. Must be one of the specified enum values.",
                        enum: ['encyclopedia', 'creative_story', 'note_synthesis', 'new_theory', 'idea']
                    },
                    title: {
                        type: Type.STRING,
                        description: "A concise, engaging title for the card."
                    },
                    content: {
                        type: Type.STRING,
                        description: "The detailed content of the card, providing value to the user."
                    },
                    sources: {
                        type: Type.ARRAY,
                        description: "An array of URL strings citing the sources for encyclopedia cards. This is mandatory for the 'encyclopedia' type.",
                        items: {
                            type: Type.STRING
                        }
                    }
                },
                required: ["type", "title", "content"]
            }
        }
    },
    required: ["todos", "knowledgeCards"]
};

export async function generateSummary(notes: Note[]): Promise<{ todos: string[]; knowledgeCards: Omit<KnowledgeCard, 'id'>[] }> {
    if (notes.length === 0) {
        return { todos: [], knowledgeCards: [] };
    }

    const notesContent = notes
        .map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`)
        .join('\n\n---\n\n');

    const prompt = `
Analyze the following collection of notes. Your task is to extract two types of information:
1.  Actionable to-do items.
2.  A diverse set of "Knowledge Cards" based on the content.

**Instructions for Knowledge Cards:**
Generate a variety of cards from the following categories. Be creative and insightful.

-   **encyclopedia**: If a note mentions a significant, widely-recognized concept (like 'inflation' in economics, 'photosynthesis' in biology, a historical event, or a famous person), create an encyclopedia-style card. The title must be the concept itself. The content should not be a generic definition, but a concise summary of its most critical, universally acknowledged key points or facts. Focus on impactful information that provides genuine insight. Crucially, you MUST also provide a 'sources' array containing URLs to authoritative sources (like academic sites, established encyclopedias, or reputable news organizations) that verify this information. This is mandatory for encyclopedia cards.
-   **creative_story**: Based on a theme or a line in the notes, write a very short, imaginative story or scene. Title should be catchy.
-   **note_synthesis**: If multiple notes seem to be about a related topic, create a card that synthesizes the key points from them into a single summary. Title should reflect the synthesized topic.
-   **new_theory**: If the notes hint at a new methodology, framework, or abstract idea, formulate it into a concise theory or principle. Title should name the theory.
-   **idea**: For simple, standalone creative sparks or suggestions that don't fit other categories. Title should be the core idea.

**General Rules:**
-   IMPORTANT: Respond in the primary language used in the provided notes.
-   Return the result as a single JSON object.

Here are the notes:
${notesContent}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: summarySchema,
            },
        });

        const jsonText = response.text.trim();
        const summary = JSON.parse(jsonText);
        return summary;
    } catch (error) {
        console.error("Error generating summary with Gemini:", error);
        throw new Error("Failed to get summary from AI.");
    }
}

export async function generateTitleForNote(content: string): Promise<string> {
    if (!content) {
        return "";
    }
    const prompt = `Based on the following note content, generate a very short, concise, and relevant title (max 5 words).
IMPORTANT: Respond in the same language as the provided Content. Do not include any quotation marks or labels.

Content:
---
${content}
---

Title:`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        // Remove quotes and trim whitespace
        return response.text.replace(/["']/g, '').trim();
    } catch (error) {
        console.error("Error generating title with Gemini:", error);
        return ""; // Return empty string on failure to avoid breaking UI
    }
}

export async function generateChatResponse(notes: Note[], history: ChatMessage[], question: string): Promise<string> {
    const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
    
    // Take the last 10 messages to keep the context focused
    const historyContent = history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const prompt = `You are an AI assistant for a note-taking app. Your purpose is to help the user understand and synthesize their own notes.
You have access to the user's entire collection of notes and the recent conversation history.
Answer the user's question based *only* on the information provided in their notes. Do not make things up.
If the notes don't contain the answer, say so politely. Be helpful, concise, and conversational.

--- CONVERSATION HISTORY ---
${historyContent}

--- ALL NOTES ---
${notesContent}

--- USER'S QUESTION ---
user: ${question}

model:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating chat response:", error);
        throw new Error("Failed to get chat response from AI.");
    }
}


const pulseReportSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A compelling title for the report, like 'Your Weekly Pulse' or 'Thought Trajectory'.",
        },
        content: {
            type: Type.STRING,
            description: "A narrative report, written in markdown, summarizing the user's thought evolution."
        }
    },
    required: ["title", "content"]
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
1.  **Theme Evolution:** Identify the main topics. Have they shifted over time? Is there a new, emerging focus this week compared to older notes?
2.  **New Connections:** Find surprising links between different notes, even if they were written far apart in time. Point out how a new idea might be an evolution of an older one.
3.  **Forgotten Threads:** Resurface a significant idea, task, or topic from an older note that the user hasn't touched on recently. Gently remind them of it.
4.  **Exploration Suggestions:** Based on their recurring interests, suggest one or two new questions or directions for them to explore.

**Formatting Rules:**
-   Use Markdown for formatting (e.g., # for title, ## for subtitles, * for lists).
-   The tone should be encouraging, insightful, and like a personal analyst.
-   IMPORTANT: Respond in the primary language used in the provided notes.
-   Return the result as a single JSON object.

Here are all the notes:
${notesContent}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: pulseReportSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating Pulse Report with Gemini:", error);
        throw new Error("Failed to generate Pulse Report from AI.");
    }
}
