import React, { useState, useRef, useEffect } from 'react';
import { Note, WikiEntry, WIKI_ROOT_ID } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import SparklesIcon from '../icons/SparklesIcon';
import ThoughtBubbleIcon from '../icons/ThoughtBubbleIcon';
import WikiBreadcrumb from './WikiBreadcrumb';

declare global {
  interface Window {
    marked: {
      parse: (markdown: string) => string;
    };
  }
}

type LoadingState = { type: 'subtopics' } | { type: 'explore'; id: string } | { type: 'regenerate' };

// This is the new home screen component, adapted from the old WikiStudioHome
interface WikiHomeContentProps {
    notes: Note[];
    wikis: WikiEntry[];
    aiTopics: string[];
    isLoadingTopics: boolean;
    onSelectNote: (note: Note) => void;
    onStartWithTopic: (topic: string) => void;
    onSelectWiki: (wiki: WikiEntry) => void;
    loadingState: LoadingState | null;
}

const WikiHomeContent: React.FC<WikiHomeContentProps> = ({
    notes,
    wikis,
    aiTopics,
    isLoadingTopics,
    onSelectNote,
    onStartWithTopic,
    onSelectWiki,
    loadingState,
}) => {
    const topLevelWikis = wikis.filter(w => w.parentId === WIKI_ROOT_ID).sort((a,b) => b.createdAt - a.createdAt);

    return (
        <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
                <div className="text-center mb-12">
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Infinite Wiki</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Start a journey of discovery. Begin with one of your notes or an AI-suggested topic.</p>
                </div>
                <div className="space-y-8">
                    {topLevelWikis.length > 0 && (
                        <section className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Continue Exploring</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {topLevelWikis.map(wiki => (
                                    <button key={wiki.id} onClick={() => onSelectWiki(wiki)} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        <p className="font-semibold truncate">{wiki.term}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(wiki.createdAt).toLocaleDateString()}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm flex flex-col">
                            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Start from a Note</h2>
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                                {notes.length > 0 ? (
                                    notes.map(note => {
                                        const isLoading = loadingState?.type === 'explore' && loadingState.id === note.id;
                                        return (
                                            <button key={note.id} onClick={() => onSelectNote(note)} disabled={!!loadingState} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
                                                <div className="flex-1 overflow-hidden">
                                                  <p className="font-semibold truncate">{note.title || 'Untitled Note'}</p>
                                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content || 'No content'}</p>
                                                </div>
                                                {isLoading && <div className="ml-2 w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any notes yet. Create one to start an exploration.</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <SparklesIcon className="w-5 h-5 text-purple-500" />
                                Start a New Topic
                            </h2>
                            {isLoadingTopics ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : aiTopics.length > 0 ? (
                                <div className="space-y-2">
                                    {aiTopics.map((topic, index) => {
                                        const isLoading = loadingState?.type === 'explore' && loadingState.id === topic;
                                        return (
                                            <button key={index} onClick={() => onStartWithTopic(topic)} disabled={!!loadingState} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
                                                <p className="font-semibold">{topic}</p>
                                                {isLoading && <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Create some notes, and we'll suggest topics for you here!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
  const [selectionPopup, setSelectionPopup] = useState<{ top: number; left: number; text: string } | null>(null);
  const [subTopics, setSubTopics] = useState<{ title: string; topics: string[] } | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  const currentItem = history.length > 0 ? history[history.length - 1] : null;

  useEffect(() => {
    setSelectionPopup(null);
    setSubTopics(null);
    if (currentItem && 'term' in currentItem && (!currentItem.suggestedTopics || currentItem.suggestedTopics.length === 0)) {
        if (currentItem.id !== WIKI_ROOT_ID) {
            onUpdateWiki(currentItem.id);
        }
    }
  }, [history, currentItem, onUpdateWiki]);

  const generateNewWiki = async (term: string, from: 'explore' | 'further') => {
    if (!currentItem || loadingState) return;
    
    const loadingId = from === 'explore' ? (selectionPopup?.text || term) : term;
    setLoadingState({ type: 'explore', id: loadingId });

    const sourceNoteId = 'sourceNoteId' in currentItem ? currentItem.sourceNoteId : (notes[0]?.id || 'no-source');
    const parentId = currentItem.id;
    
    try {
        const newWikiEntry = await onGenerateWiki(term, sourceNoteId, parentId, currentItem.content);
        setHistory(prev => [...prev, newWikiEntry]);
    } catch(e) {
        console.error("Failed to generate next wiki", e);
    } finally {
      setSelectionPopup(null);
      setSubTopics(null);
      setLoadingState(null);
    }
  };

  const handleSuggestTopics = async () => {
    if (selectionPopup && !loadingState && currentItem) {
      setLoadingState({ type: 'subtopics' });
      try {
        const topics = await onGenerateSubTopics(selectionPopup.text, currentItem.content);
        setSubTopics({ title: selectionPopup.text, topics });
      } catch(e) {
        console.error("Failed to suggest topics", e);
      } finally {
        setLoadingState(null);
        setSelectionPopup(null);
      }
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (popupRef.current && popupRef.current.contains(event.target as Node)) return;
    if (currentItem?.id === WIKI_ROOT_ID) return;

    const selection = window.getSelection();
    const selectionText = selection?.toString().trim();
    if (selection && selectionText && selectionText.length > 2 && selectionText.length < 100) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setSelectionPopup({ 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX + rect.width / 2, 
        text: selectionText 
      });
    } else {
      setSelectionPopup(null);
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
     <div className="h-full flex flex-col" onMouseUp={handleMouseUp}>
        {selectionPopup && (
         <div 
            ref={popupRef}
            onMouseUp={(e) => e.stopPropagation()}
            style={{ top: `${selectionPopup.top}px`, left: `${selectionPopup.left}px`, transform: 'translateX(-50%)' }}
            className="fixed z-10 animate-in fade-in zoom-in-95 duration-150 flex items-center bg-slate-800 rounded-lg shadow-lg"
          >
              <button onClick={() => generateNewWiki(selectionPopup.text, 'explore')} disabled={!!loadingState} className="flex items-center gap-2 text-sm px-3 py-1.5 text-white hover:bg-slate-700 rounded-l-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
                  {loadingState?.type === 'explore' ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <BookOpenIcon className="w-4 h-4" />}
                  Explore
              </button>
              <div className="w-px h-4 bg-slate-600"></div>
              <button onClick={handleSuggestTopics} disabled={!!loadingState} className="flex items-center gap-2 text-sm px-3 py-1.5 text-white hover:bg-slate-700 rounded-r-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
                  {loadingState?.type === 'subtopics' ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <ThoughtBubbleIcon className="w-4 h-4" />}
                  Suggest Topics
              </button>
          </div>
        )}
        {subTopics && (
            <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center p-4" onClick={() => setSubTopics(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Explore topics related to "{subTopics.title}"</h3>
                    <div className="mt-4 space-y-2">
                        {subTopics.topics.map(topic => (
                            <button key={topic} onClick={() => generateNewWiki(topic, 'explore')} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto w-full">
                <WikiBreadcrumb history={history} wikis={wikis} setHistory={setHistory} />
            </div>
        </div>

        {currentItem.id === WIKI_ROOT_ID ? (
            <WikiHomeContent
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
                        <div className="relative group flex-shrink-0">
                            <button disabled={!!loadingState} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700/50 disabled:opacity-50 flex items-center gap-2">
                                {loadingState?.type === 'regenerate' && <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>}
                                Regenerate
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 p-2 hidden group-hover:block animate-in fade-in zoom-in-95">
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
                        </div>
                    </div>
                    <div
                        ref={contentRef}
                        className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: window.marked.parse(currentItem.content) }}
                    ></div>

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
                                        <button key={topic} onClick={() => generateNewWiki(topic, 'further')} disabled={!!loadingState} className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full font-medium text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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