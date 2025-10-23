import { GoogleGenAI, Type } from "@google/genai";
import { Note, KnowledgeCard } from '../types';

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

-   **encyclopedia**: If a note mentions a specific concept, person, or place, create a brief encyclopedia-style card explaining it. Title should be the concept, content is the explanation.
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