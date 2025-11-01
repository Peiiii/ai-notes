

export type ViewMode = 'editor' | 'studio' | 'chat' | 'wiki' | 'parliament';

export const WIKI_ROOT_ID = 'wiki_root';

export type ParliamentMode = 'debate' | 'podcast';

export type LoadingState = { type: 'subtopics' } | { type: 'explore'; id: string } | { type: 'regenerate' };

export type NoteType = 'text';

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  createdAt: number;
  threadHistory?: ChatMessage[];
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export type KnowledgeCardType = 'encyclopedia' | 'creative_story' | 'note_synthesis' | 'new_theory' | 'idea';

export interface KnowledgeCard {
  id: string;
  type: KnowledgeCardType;
  title: string;
  content: string;
  sources?: string[];
}

export interface AISummary {
  todos: Todo[];
  knowledgeCards: KnowledgeCard[];
}

export interface DebateSynthesis {
  keyPointsPragmatist: string[];
  keyPointsVisionary: string[];
  coreTension: string;
  nextSteps: string[];
}

export interface ToolCall {
  id?: string;
  name: string;
  args: { [key: string]: any };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'tool' | 'system';
  content: string;
  persona?: string;
  status?: 'thinking' | 'streaming' | 'complete' | 'error';
  synthesisContent?: DebateSynthesis;
  sourceNotes?: { id: string; title: string; }[];
  toolCalls?: ToolCall[];
  tool_call_id?: string; // For OpenAI response mapping
  structuredContent?: { // New field for rich UI rendering of tool results
    type: 'search_result';
    notes: Note[];
  } | {
    type: 'create_note_result';
    message: string;
    noteId: string;
    title: string;
  };
  groundingChunks?: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
}

export interface PulseReport {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface WikiEntry {
  id:string;
  term: string;
  content: string;
  createdAt: number;
  sourceNoteId: string; // The note that started this specific tree of wikis
  parentId: string | null; // The ID of the parent WikiEntry, null if it's a root
  suggestedTopics?: string[]; // AI-suggested topics for further exploration
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  root: MindMapNode;
}

export interface ProactiveSuggestion {
  prompt: string;
  description: string;
}

export interface PresetChat {
  id: string;
  name: string;
  description: string;
  participantIds: string[];
  discussionMode: DiscussionMode;
  isDefault?: boolean;
}

// --- Multi-Agent Chat Types ---
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  icon: string;
  color: string;
  createdAt: number;
  isCustom: boolean;
}

export type DiscussionMode = 'concurrent' | 'turn_based' | 'moderated';

export interface ChatSession {
  id: string;
  name: string;
  participantIds: string[]; // agent IDs
  history: ChatMessage[];
  createdAt: number;
  discussionMode: DiscussionMode;
}


// --- Live Insights Types ---
export type InsightType = 'related_note' | 'action_item' | 'wiki_concept';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  content?: string;
  sourceNoteId?: string; // For related_note type
}