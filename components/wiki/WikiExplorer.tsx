import React, { useState, useEffect } from 'react';
import { Note, WikiEntry, WIKI_ROOT_ID, LoadingState } from '../../types';
import WikiBreadcrumb from './WikiBreadcrumb';
import HoverPopup from '../ui/HoverPopup';
import WikiStudioHome from './WikiStudioHome';
import TextSelectionPopup from '../ui/TextSelectionPopup';
import SubTopicsModal from './SubTopicsModal';
import BookOpenIcon from '../icons/BookOpenIcon';
import ThoughtBubbleIcon from '../icons/ThoughtBubbleIcon';

declare global {
  interface Window {
    marked: {
      parse: (markdown: string) => string;
    };
  }
}

interface WikiExplorerProps {
  notes: Note[];
  wikis: WikiEntry[];
  history: WikiEntry[];
  setHistory: React.Dispatch<React.SetStateAction<WikiEntry[]>>;
  onGenerateWiki: (term: string, sourceNoteId: string, parentId: string | null, contextContent: string) => Promise<WikiEntry>;
  onRegenerateWiki: (wikiId: string, clearChildren: boolean) => Promise<void>;
  onGenerateSubTopics: (selection: string, contextContent: string) => Promise<string[]>;
  onUpdateWiki: (wikiId: string) => void;
  aiTopics: string[];
  isLoadingTopics: boolean;
}

const WikiExplorer: React.FC<WikiExplorerProps> = ({
  notes,
  wikis,
  history,
  setHistory,
  onGenerateWiki,
  onRegenerateWiki,
  onGenerateSubTopics,
  onUpdateWiki,
  aiTopics,
  isLoadingTopics,
}) => {
  const [subTopics, setSubTopics] = useState<{ title: string; topics: string[] } | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  
  const currentItem = history.length > 0 ? history[history.length - 1] : null;

  useEffect(() => {
    setSubTopics(null);
    if (currentItem && 'term' in currentItem && (!currentItem.suggestedTopics || currentItem.suggestedTopics.length === 0)) {
        if (currentItem.id !== WIKI_ROOT_ID) {
            onUpdateWiki(currentItem.id);
        }
    }
  }, [currentItem, onUpdateWiki]);

  const generateNewWiki = async (term: string) => {
    if (!currentItem || loadingState) return;
    
    setLoadingState({ type: 'explore', id: term });

    const sourceNoteId = 'sourceNoteId' in currentItem ? currentItem.sourceNoteId : (notes[0]?.id || 'no-source');
    const parentId = currentItem.id;
    
    try {
        const newWikiEntry = await onGenerateWiki(term, sourceNoteId, parentId, currentItem.content);
        setHistory(prev => [...prev, newWikiEntry]);
    } catch(e) {
        console.error("Failed to generate next wiki", e);
    } finally {
      setSubTopics(null);
      setLoadingState(null);
    }
  };

  const handleSuggestTopics = async (selection: string) => {
    if (!loadingState && currentItem) {
      setLoadingState({ type: 'subtopics' });
      try {
        const topics = await onGenerateSubTopics(selection, currentItem.content);
        setSubTopics({ title: selection, topics });
      } catch(e) {
        console.error("Failed to suggest topics", e);
      } finally {
        setLoadingState(null);
      }
    }
  };

  const handleRegen = async (clearChildren: boolean) => {
    if (currentItem && 'term' in currentItem) {
      setLoadingState({type: 'regenerate'});
      try {
        await onRegenerateWiki(currentItem.id, clearChildren);
      } finally {
        setLoadingState(null);
      }
    }
  };

  const handleStartWithTopic = async (topic: string) => {
    if (loadingState) return;
    setLoadingState({ type: 'explore', id: topic });
    const sourceNoteId = notes.length > 0 ? notes[0].id : 'no-source';
    const contextContent = notes.map(n => `${n.title} ${n.content}`).join('\n');
    try {
        const newWikiEntry = await onGenerateWiki(topic, sourceNoteId, WIKI_ROOT_ID, contextContent);
        setHistory(prev => [...prev, newWikiEntry]);
    } catch (e) { console.error("Failed to start with topic", e); } 
    finally { setLoadingState(null); }
  };
  
  const handleSelectNote = async (note: Note) => {
    if (loadingState) return;
    const existingWiki = wikis.find(w => w.sourceNoteId === note.id && w.parentId === WIKI_ROOT_ID);
    if (existingWiki) {
        setHistory(prev => [...prev, existingWiki]);
        return;
    }
    setLoadingState({ type: 'explore', id: note.id });
    const term = note.title || `Exploration from Note`;
    try {
        const newWikiEntry = await onGenerateWiki(term, note.id, WIKI_ROOT_ID, note.content);
        setHistory(prev => [...prev, newWikiEntry]);
    } catch(e) { console.error("Failed to generate wiki from note", e); } 
    finally { setLoadingState(null); }
  };

  if (!currentItem) return null;
  
  return (
     <div className="h-full flex flex-col">
        <SubTopicsModal
            subTopics={subTopics}
            onClose={() => setSubTopics(null)}
            onSelectTopic={generateNewWiki}
        />

        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto w-full">
                <WikiBreadcrumb history={history} wikis={wikis} setHistory={setHistory} />
            </div>
        </div>

        {currentItem.id === WIKI_ROOT_ID ? (
            <WikiStudioHome
                notes={notes}
                wikis={wikis}
                aiTopics={aiTopics}
                isLoadingTopics={isLoadingTopics}
                onSelectNote={handleSelectNote}
                onStartWithTopic={handleStartWithTopic}
                onSelectWiki={(wiki) => setHistory(prev => [...prev, wiki])}
                loadingState={loadingState}
            />
        ) : (
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{currentItem.term}</h1>
                        <div className="flex-shrink-0">
                           <HoverPopup
                                trigger={
                                    <button disabled={!!loadingState} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700/50 disabled:opacity-50 flex items-center gap-2">
                                        {loadingState?.type === 'regenerate' && <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                                        Regenerate
                                    </button>
                                }
                                content={
                                    <div className="w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 animate-in fade-in zoom-in-95">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 px-2 pb-2">Choose an option:</p>
                                        <button onClick={() => handleRegen(false)} className="w-full text-left block px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <span className="font-semibold block">Update This Entry</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Regenerate content for this topic only.</span>
                                        </button>
                                        <button onClick={() => handleRegen(true)} className="w-full text-left block px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <span className="font-semibold block">Update & Clear Branch</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Regenerate and delete all sub-topics created from this entry.</span>
                                        </button>
                                    </div>
                                }
                                popupClassName="absolute top-full right-0 mt-2 z-20"
                                className="relative"
                            />
                        </div>
                    </div>
                    
                    <TextSelectionPopup
                        renderPopupContent={({ text, close }) => (
                            <div className="animate-in fade-in zoom-in-95 duration-150 flex items-center bg-slate-800 rounded-lg shadow-lg">
                                <button
                                    onClick={() => {
                                        generateNewWiki(text);
                                        close();
                                    }}
                                    disabled={!!loadingState}
                                    className="flex items-center gap-2 text-sm px-3 py-1.5 text-white hover:bg-slate-700 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingState?.type === 'explore' ? (
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <BookOpenIcon className="w-4 h-4" />
                                    )}
                                    Explore
                                </button>
                                <div className="w-px h-4 bg-slate-600"></div>
                                <button
                                    onClick={() => {
                                        handleSuggestTopics(text);
                                        close();
                                    }}
                                    disabled={!!loadingState}
                                    className="flex items-center gap-2 text-sm px-3 py-1.5 text-white hover:bg-slate-700 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingState?.type === 'subtopics' ? (
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <ThoughtBubbleIcon className="w-4 h-4" />
                                    )}
                                    Suggest Topics
                                </button>
                            </div>
                        )}
                        isDisabled={!!loadingState || currentItem.id === WIKI_ROOT_ID}
                    >
                        <div
                            className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: window.marked.parse(currentItem.content) }}
                        ></div>
                    </TextSelectionPopup>

                    {wikis.filter(w => w.parentId === currentItem.id).length > 0 && (
                        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Branches from this topic</h3>
                            <div className="flex flex-wrap gap-3">
                                {wikis.filter(w => w.parentId === currentItem.id).map(wiki => (
                                    <button key={wiki.id} onClick={() => setHistory(prev => [...prev, wiki])} className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 rounded-full font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        {wiki.term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {currentItem.suggestedTopics && currentItem.suggestedTopics.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Further Exploration</h3>
                            <div className="flex flex-wrap gap-3">
                                {currentItem.suggestedTopics.map(topic => {
                                    const isLoading = loadingState?.type === 'explore' && loadingState.id === topic;
                                    return (
                                        <button key={topic} onClick={() => generateNewWiki(topic)} disabled={!!loadingState} className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full font-medium text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                            {isLoading && <div className="w-4 h-4 border-2 border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin"></div>}
                                            {topic}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
  )
};

export default WikiExplorer;