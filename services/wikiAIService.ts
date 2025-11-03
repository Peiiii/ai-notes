import { Note } from '../types';
import { GenerateJsonParams, GenerateTextParams } from './providers/types';
import { getConfig } from './aiService';
import { Type } from "@google/genai";

export async function generateWikiEntry(term: string, contextContent?: string): Promise<string> {
    // Trim and check if contextContent has meaningful content
    const hasContext = contextContent && contextContent.trim().length > 20;

    const prompt = hasContext
        ? `You are an AI assistant helping a user explore concepts. Your task is to provide a high-quality summary for the given "Term", tailored to the user's learning context.

**Instructions:**
1.  **Contextual Relevance:** Use the provided "Context Text" to understand the user's perspective and tailor the explanation accordingly, connecting to ideas they are already thinking about.
2.  **Content Quality:** The summary must be comprehensive, covering critical aspects and relevant context. Go beyond a simple definition.
3.  **Structure:** Use clean, simple markdown for formatting (paragraphs, lists, bold text).
4.  **Language:** Respond ONLY in the primary language used in the "Context Text".
5.  **Format:** Do NOT include a main title (like '# Term'). The response should begin directly with the content.

Context Text:
---
${contextContent.substring(0, 2000)}
---

Term: "${term}"`
        : `You are a world-class domain expert and encyclopedist. Your task is to write a professional, academic, and in-depth article for the given "Term". The article should be well-structured, comprehensive, and suitable for a university-level student or a professional looking to deepen their knowledge.

**Instructions:**
1.  **Academic Rigor:** Ensure the content is accurate, detailed, and covers key theories, historical context, and important figures or developments related to the term.
2.  **Clarity and Structure:** Use clear markdown for headings (##), subheadings (###), lists, and bold text to create a well-organized and readable article.
3.  **Language:** Respond ONLY in the primary language of the "Term" itself.
4.  **Format:** Do NOT include a main title (like '# Term'). The response should begin directly with the article content.

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