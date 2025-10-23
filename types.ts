
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
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
}

export interface AISummary {
  todos: Todo[];
  knowledgeCards: KnowledgeCard[];
}
