import { Note } from '../types';
import { GenerateJsonParams, GenerateTextParams } from './providers/types';
import { getConfig } from './aiService';
import { Type } from "@google/genai";

export async function generateWikiEntry(term: string, contextContent: string): Promise<string> {
    const prompt = `You are a domain expert with a talent for clear and concise explanations. Your task is to provide a high-quality, professional, and in-depth encyclopedia-style summary for the given "Term", tailored for a learning context.

**Instructions:**
1.  **Content Quality:** The summary must be comprehensive, covering the most critical aspects, key principles, and relevant context. Go beyond a simple definition.
2.  **Structure:** Use clean, simple markdown for formatting. Utilize paragraphs, lists, and bold text to create a well-structured and readable entry.
3.  **Language:** Respond ONLY in the primary language used in the provided "Context Text".
4.  **Format:** Do NOT include a main title (like '# Term'). The response should begin directly with the content of the summary.

Context Text (for language detection):
---
${contextContent.substring(0, 2000)}
---

Term: "${term}"`;

    const { provider, model } = getConfig('wikiEntry');
    const params: GenerateTextParams = { model, prompt };
    return provider.generateText(params);
}

const topicsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

export async function generateRelatedTopics(wikiContent: string): Promise<string[]> {
    const prompt = `Based on the content of the following wiki article, suggest 3-5 related topics for further exploration. These topics should encourage discovery of adjacent concepts or deeper aspects of the current topic. The topics should be concise (2-5 words each).

IMPORTANT: The suggested topics MUST be in the primary language used in the article.

Return the result as a JSON array of strings. Do not include any other text.

Example format: ["Quantum Entanglement", "The History of the Silk Road", "Stoic Philosophy in Modern Life"]

Article Content:
---
${wikiContent.substring(0, 4000)}
---`;

    const { provider, model } = getConfig('relatedTopics');
    const params: GenerateJsonParams = { model, prompt, schema: topicsSchema };
    return provider.generateJson(params);
}

export async function generateSubTopics(selection: string, contextContent: string): Promise<string[]> {
    const prompt = `Based on the user's "Selection" and the surrounding "Context", suggest 3-5 alternative or more specific topics for exploration in a wiki. The topics should be concise (2-5 words each) and directly related to the selection, offering different angles or deeper dives.

IMPORTANT: The suggested topics MUST be in the primary language used in the context.

Return the result as a JSON array of strings. Do not include any other text.

Example: If selection is "Renaissance Art", suggestions could be ["High Renaissance Masters", "The Medici Family's Patronage", "Linear Perspective in Painting"].

Context:
---
${contextContent.substring(0, 2000)}
---

Selection: "${selection}"`;
    
    const { provider, model } = getConfig('subTopics');
    const params: GenerateJsonParams = { model, prompt, schema: topicsSchema };
    return provider.generateJson(params);
}

export async function generateWikiTopics(notes: Note[]): Promise<string[]> {
    if (notes.length === 0) return [];
    
    const notesContent = notes
        .slice(0, 10)
        .map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`)
        .join('\n\n---\n\n');

    const prompt = `Based on the following user notes, suggest 5 interesting, non-obvious, and thought-provoking topics or concepts for them to explore in a wiki format. The topics should be concise (2-5 words each). They should be broad enough for an interesting summary but specific enough to be actionable.

IMPORTANT: The suggested topics MUST be in the primary language used in the notes provided below.

Return the result as a JSON array of strings. Do not include any other text.

Example format: ["Quantum Entanglement", "The History of the Silk Road", "Stoic Philosophy in Modern Life"]

Notes:
---
${notesContent}
---`;

    const { provider, model } = getConfig('wikiTopics');
    const params: GenerateJsonParams = { model, prompt, schema: topicsSchema };
    return provider.generateJson(params);
}
