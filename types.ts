export type ViewMode = 'editor' | 'studio' | 'chat' | 'pulse' | 'wiki_studio' | 'parliament';

export const WIKI_ROOT_ID = 'wiki_root';

export type LoadingState = { type: 'subtopics' } | { type: 'explore'; id: string } | { type: 'regenerate' };

export interface Note {
  id: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  persona?: string;
}

export interface PulseReport {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface WikiEntry {
  id: string;
  term: string;
  content: string;
  createdAt: number;
  sourceNoteId: string; // The note that started this specific tree of wikis
  parentId: string | null; // The ID of the parent WikiEntry, null if it's a root
  suggestedTopics?: string[]; // AI-suggested topics for further exploration
}