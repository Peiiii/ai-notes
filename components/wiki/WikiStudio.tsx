import React, { useState, useEffect } from 'react';
import { Note, WikiEntry } from '../../types';
import WikiStudioHome from './WikiStudioHome';
import WikiExplorer from './WikiExplorer';

type ExplorationItem = Note | WikiEntry;

interface WikiStudioProps {
  notes: Note[];
  wikis: WikiEntry[];
  onGenerateWiki: (term: string, sourceNoteId: string, parentId: string | null, contextContent: string) => Promise<WikiEntry>;
  onRegenerateWiki: (wikiId: string, clearChildren: boolean) => Promise<void>;
  onGenerateSubTopics: (selection: string, contextContent: string) => Promise<string[]>;
  onUpdateWiki: (wikiId: string) => void;
  aiTopics: string[];
  isLoadingTopics: boolean;
  initialHistory: (Note | WikiEntry)[] | null;
}

const WikiStudio: React.FC<WikiStudioProps> = (props) => {
  const { notes, wikis, initialHistory, onGenerateWiki } = props;
  const [history, setHistory] = useState<ExplorationItem[]>(initialHistory || []);
  const [loadingState, setLoadingState] = useState<{ type: 'topic'; id: string } | null>(null);

  useEffect(() => {
    if (initialHistory) {
      setHistory(initialHistory);
    }
  }, [initialHistory]);

  const handleStartWithNote = (note: Note) => {
    setHistory([note]);
  };

  const handleSelectWiki = (wiki: WikiEntry) => {
    setHistory([wiki]);
  };

  const handleStartWithTopic = async (topic: string) => {
    // Prevent starting a new topic generation if one is already in progress
    if (loadingState) return;

    const sourceNoteId = notes.length > 0 ? notes[0].id : 'no-source';
    if (sourceNoteId === 'no-source') {
        alert("Please create a note before starting from a topic.");
        return;
    }
    setLoadingState({ type: 'topic', id: topic });
    try {
        const contextContent = notes.map(n => `${n.title} ${n.content}`).join('\n');
        const newWikiEntry = await onGenerateWiki(topic, sourceNoteId, null, contextContent);
        setHistory([newWikiEntry]);
    } catch (e) {
        console.error("Failed to start with topic", e);
    } finally {
        setLoadingState(null);
    }
  };

  const currentItem = history.length > 0 ? history[history.length - 1] : null;

  if (!currentItem) {
    return (
      <WikiStudioHome
        notes={notes}
        wikis={wikis}
        aiTopics={props.aiTopics}
        isLoadingTopics={props.isLoadingTopics}
        onStartWithNote={handleStartWithNote}
        onStartWithTopic={handleStartWithTopic}
        onSelectWiki={handleSelectWiki}
        loadingState={loadingState}
      />
    );
  }

  return (
    <WikiExplorer
      {...props}
      history={history}
      setHistory={setHistory}
    />
  );
};

export default WikiStudio;