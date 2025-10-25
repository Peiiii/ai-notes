import { Note, KnowledgeCard, ChatMessage } from '../types';
import { getAIProvider } from '../providers';
import type { JsonSchema } from '../providers/AIProvider';

// Provider is chosen via env (AI_PROVIDER / VITE_AI_PROVIDER). Defaults to Gemini.
const provider = getAIProvider();

const summarySchema: JsonSchema = {
  type: 'object',
  properties: {
    todos: {
      type: 'array',
      description: 'A list of actionable to-do items or tasks extracted from the notes.',
      items: { type: 'string' },
    },
    knowledgeCards: {
      type: 'array',
      description: "A list of diverse, categorized knowledge cards generated based on the notes' content.",
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'The category of the card. Must be one of the specified enum values.',
            enum: ['encyclopedia', 'creative_story', 'note_synthesis', 'new_theory', 'idea'],
          },
          title: { type: 'string', description: 'A concise, engaging title for the card.' },
          content: { type: 'string', description: 'The detailed content of the card, providing value to the user.' },
          sources: { type: 'array', description: "An array of URL strings citing the sources for encyclopedia cards.", items: { type: 'string' } },
        },
        required: ['type', 'title', 'content'],
      },
    },
  },
  required: ['todos', 'knowledgeCards'],
};

export async function generateSummary(notes: Note[]): Promise<{ todos: string[]; knowledgeCards: Omit<KnowledgeCard, 'id'>[] }> {
  if (notes.length === 0) {
    return { todos: [], knowledgeCards: [] };
  }

  const notesContent = notes
    .map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`)
    .join('\n\n---\n\n');

  const prompt = `
You are an AI assistant that analyzes notes and generates knowledge cards. Your task:

1. Extract actionable to-do items from the notes
2. Generate diverse knowledge cards from 5 categories

KNOWLEDGE CARD CATEGORIES (MUST generate at least one of each):
- encyclopedia: For well-known concepts, historical events, famous people, scientific principles. MUST include sources array with URLs.
- creative_story: Short imaginative stories based on note themes
- note_synthesis: Combine related ideas from multiple notes into summaries
- new_theory: Extract or formulate new methodologies, frameworks, principles
- idea: Standalone creative insights or suggestions

CRITICAL REQUIREMENTS:
- Generate EXACTLY 5 knowledge cards (one from each category)
- If content doesn't naturally fit a category, be creative and adapt
- Each card needs: type, title, content
- Encyclopedia cards MUST include sources array with URLs
- Be creative and insightful
- Use the same language as the notes
- Return ONLY valid JSON

IMPORTANT: You MUST generate knowledge cards. If you cannot find content for a category, create a generic but relevant card for that category.

EXAMPLE OUTPUT FORMAT:
{
  "todos": ["task1", "task2"],
  "knowledgeCards": [
    {"type": "encyclopedia", "title": "Concept Name", "content": "Description", "sources": ["url1", "url2"]},
    {"type": "creative_story", "title": "Story Title", "content": "Story content"},
    {"type": "note_synthesis", "title": "Synthesis Title", "content": "Synthesis content"},
    {"type": "new_theory", "title": "Theory Name", "content": "Theory content"},
    {"type": "idea", "title": "Idea Title", "content": "Idea content"}
  ]
}

Notes to analyze:
${notesContent}
`;

  try {
    const summary = await provider.generateJson<{ todos: string[]; knowledgeCards: Omit<KnowledgeCard, 'id'>[] }>(
      prompt,
      summarySchema,
      { schemaName: 'SummarySchema' }
    );
    
    // Ensure we have knowledge cards
    if (!summary.knowledgeCards || summary.knowledgeCards.length === 0) {
      console.warn('AI returned empty knowledge cards, generating fallback cards');
      summary.knowledgeCards = [
        {
          type: 'idea',
          title: 'Note Analysis',
          content: 'Based on your notes, consider exploring these themes further and connecting related ideas.',
        },
        {
          type: 'note_synthesis',
          title: 'Key Themes',
          content: 'Your notes contain several interesting themes that could be developed further.',
        },
        {
          type: 'creative_story',
          title: 'The Journey',
          content: 'Every note is a step in your intellectual journey, building towards greater understanding.',
        },
        {
          type: 'new_theory',
          title: 'Personal Framework',
          content: 'Your notes suggest a unique perspective that could be developed into a personal framework.',
        },
        {
          type: 'encyclopedia',
          title: 'Knowledge Base',
          content: 'Your notes represent a growing knowledge base that can be referenced and built upon.',
          sources: ['https://en.wikipedia.org/wiki/Knowledge_management'],
        },
      ];
    }
    
    // Ensure we have at least one card of each type
    const existingTypes = new Set(summary.knowledgeCards.map(card => card.type));
    const allTypes: Array<'encyclopedia' | 'creative_story' | 'note_synthesis' | 'new_theory' | 'idea'> = ['encyclopedia', 'creative_story', 'note_synthesis', 'new_theory', 'idea'];
    const missingTypes = allTypes.filter(type => !existingTypes.has(type));
    
    if (missingTypes.length > 0) {
      console.warn(`Missing knowledge card types: ${missingTypes.join(', ')}`);
      const fallbackCards = missingTypes.map(type => {
        switch (type) {
          case 'encyclopedia':
            return {
              type: 'encyclopedia' as const,
              title: 'Knowledge Base',
              content: 'Your notes represent a growing knowledge base that can be referenced and built upon.',
              sources: ['https://en.wikipedia.org/wiki/Knowledge_management'],
            };
          case 'creative_story':
            return {
              type: 'creative_story' as const,
              title: 'The Journey',
              content: 'Every note is a step in your intellectual journey, building towards greater understanding.',
            };
          case 'note_synthesis':
            return {
              type: 'note_synthesis' as const,
              title: 'Key Themes',
              content: 'Your notes contain several interesting themes that could be developed further.',
            };
          case 'new_theory':
            return {
              type: 'new_theory' as const,
              title: 'Personal Framework',
              content: 'Your notes suggest a unique perspective that could be developed into a personal framework.',
            };
          case 'idea':
            return {
              type: 'idea' as const,
              title: 'Note Analysis',
              content: 'Based on your notes, consider exploring these themes further and connecting related ideas.',
            };
          default:
            return null;
        }
      }).filter(Boolean);
      
      summary.knowledgeCards.push(...fallbackCards);
    }
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to get summary from AI.');
  }
}

export async function generateTitleForNote(content: string): Promise<string> {
  if (!content) {
    return '';
  }
  const prompt = `Based on the following note content, generate a very short, concise, and relevant title (max 5 words).
IMPORTANT: Respond in the same language as the provided Content. Do not include any quotation marks or labels.

Content:
---
${content}
---

Title:`;
  try {
    const text = await provider.generateText(prompt);
    // Remove quotes and trim whitespace
    return text.replace(/[\"']/g, '').trim();
  } catch (error) {
    console.error('Error generating title:', error);
    return '';
  }
}

export async function generateChatResponse(notes: Note[], history: ChatMessage[], question: string): Promise<string> {
  const notesContent = notes.map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`).join('\n\n---\n\n');
  // Take the last 10 messages to keep the context focused
  const historyContent = history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');

  const prompt = `You are an AI assistant for a note-taking app. Your purpose is to help the user understand and synthesize their own notes.
You have access to the user's entire collection of notes and the recent conversation history.
Answer the user's question based only on the information provided in their notes. Do not make things up.
If the notes don't contain the answer, say so politely. Be helpful, concise, and conversational.

--- CONVERSATION HISTORY ---
${historyContent}

--- ALL NOTES ---
${notesContent}

--- USER'S QUESTION ---
user: ${question}

model:`;

  try {
    const text = await provider.generateText(prompt);
    return text.trim();
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to get chat response from AI.');
  }
}

const pulseReportSchema: JsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: "A compelling title for the report, like 'Your Weekly Pulse' or 'Thought Trajectory'." },
    content: { type: 'string', description: "A narrative report, written in markdown, summarizing the user's thought evolution." },
  },
  required: ['title', 'content'],
};

export async function generatePulseReport(notes: Note[]): Promise<{ title: string; content: string }> {
  if (notes.length === 0) {
    return { title: 'Not Enough Data', content: 'Write at least one note to generate your first Pulse report.' };
  }

  const notesContent = notes
    .map(note => `Date: ${new Date(note.createdAt).toISOString().split('T')[0]}\nTitle: ${note.title || 'Untitled'}\nContent: ${note.content}`)
    .join('\n\n---\n\n');

  const prompt = `
You are a highly perceptive thought analyst. Your task is to analyze a user's entire collection of notes and generate a short, insightful "Pulse Report" about their intellectual journey.
The report should be a narrative, not just a list. Be insightful and help the user see the bigger picture of their own thinking.

Analyze the following aspects:
1. Theme Evolution: Identify the main topics. Have they shifted over time? Is there a new, emerging focus this week compared to older notes?
2. New Connections: Find surprising links between different notes, even if they were written far apart in time. Point out how a new idea might be an evolution of an older one.
3. Forgotten Threads: Resurface a significant idea, task, or topic from an older note that the user hasn't touched on recently. Gently remind them of it.
4. Exploration Suggestions: Based on their recurring interests, suggest one or two new questions or directions for them to explore.

Formatting Rules:
- Use Markdown for formatting (e.g., # for title, ## for subtitles, * for lists).
- The tone should be encouraging, insightful, and like a personal analyst.
- IMPORTANT: Respond in the primary language used in the provided notes.
- Return the result as a single JSON object.

 Output Constraints:
 - The JSON must include non-empty "title" and non-empty "content" fields.
 - "title" should be concise (3-12 words/短句) and descriptive, not empty.
 - "content" must be meaningful markdown text with at least 200 characters; do not return empty strings.

Here are all the notes:
${notesContent}
`;

  try {
    const result = await provider.generateJson<{ title: string; content: string }>(
      prompt,
      pulseReportSchema,
      { schemaName: 'PulseReport' }
    );
    // Fallback if model returns empty fields
    if (!result.title?.trim() || !result.content?.trim()) {
      return {
        title: 'Not Enough Data',
        content: 'Write more notes or ensure your notes contain clear themes so a Pulse Report can be generated.',
      };
    }
    return result;
  } catch (error) {
    console.error('Error generating Pulse Report:', error);
    throw new Error('Failed to generate Pulse Report from AI.');
  }
}

export async function generateThreadResponse(activeNote: Note, allNotes: Note[], history: ChatMessage[], question: string): Promise<string> {
  const allNotesContext = allNotes
    .filter(note => note.id !== activeNote.id)
    .map(note => `Title: ${note.title || 'Untitled'}\nContent: ${note.content}`)
    .join('\n\n---\n\n');

  const activeNoteContext = `Title: ${activeNote.title || 'Untitled'}\nContent: ${activeNote.content}`;
  const historyContent = history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');

  const prompt = `You are an AI assistant integrated into a note-taking app, acting as a collaborative partner on a specific note.
Your primary focus is the "CURRENT NOTE IN FOCUS". Your secondary context is the "ENTIRE NOTE LIBRARY".
Your goal is to help the user iterate, research, and expand on the ideas within the current note.

Use the entire library for broader context or when the user asks you to connect ideas, but always prioritize the content of the current note in your responses.
Be helpful, concise, and act as a creative and analytical partner.

--- CONVERSATION THREAD HISTORY ---
${historyContent}

--- CURRENT NOTE IN FOCUS ---
${activeNoteContext}

--- ENTIRE NOTE LIBRARY (for context) ---
${allNotesContext}

--- USER'S NEW MESSAGE ---
user: ${question}

model:`;

  try {
    const text = await provider.generateText(prompt);
    return text.trim();
  } catch (error) {
    console.error('Error generating thread response:', error);
    throw new Error('Failed to get thread response from AI.');
  }
}
