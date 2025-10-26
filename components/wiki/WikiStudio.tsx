import React, { useState, useEffect } from 'react';
import { Note, WikiEntry, WIKI_ROOT_ID } from '../../types';
import WikiExplorer from './WikiExplorer';

type ExplorationItem = Note | WikiEntry;

// Define the constant root wiki entry for the entire knowledge base
const rootWiki: WikiEntry = {
  id: WIKI_ROOT_ID,
  term: 'Wiki Home',
  content: 'Welcome to your personal wiki. Explore topics, connect ideas, and build your knowledge base.',
  createdAt: 0,
  sourceNoteId: '',
  parentId: null,
  suggestedTopics: [],
};

interface WikiStudioProps {
  notes: Note[];
  wikis: WikiEntry[];
  onGenerateWiki: (term: string, sourceNoteId: string, parentId: string | null, contextContent: string) => Promise<WikiEntry>;
  onRegenerateWiki: (wikiId: string, clearChildren: boolean) => Promise<void>;
  onGenerateSubTopics: (selection: string, contextContent: string) => Promise<string[]>;
  onUpdateWiki: (wikiId: string) => void;
  aiTopics: string[];
  isLoadingTopics: boolean;
  initialHistory: WikiEntry[] | null; // History no longer contains notes
}

const WikiStudio: React.FC<WikiStudioProps> = (props) => {
  const { initialHistory } = props;
  const [history, setHistory] = useState<WikiEntry[]>([rootWiki]);

  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      setHistory([rootWiki, ...initialHistory]);
    } else {
      setHistory([rootWiki]);
    }
  }, [initialHistory]);

  return (
    <WikiExplorer
      {...props}
      history={history}
      setHistory={setHistory}
    />
  );
};

export default WikiStudio;