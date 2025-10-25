import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Note, WikiEntry } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';
import SparklesIcon from './icons/SparklesIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ThoughtBubbleIcon from './icons/ThoughtBubbleIcon';

declare global {
  interface Window {
    marked: {
      parse: (markdown: string) => string;
    };
  }
}

type ExplorationItem = Note | WikiEntry;
type LoadingState = { type: 'topic'; id: string } | { type: 'subtopics' } | { type: 'explore' } | { type: 'further'; id: string } | { type: 'regenerate' };

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

const WikiStudio: React.FC<WikiStudioProps> = ({
  notes,
  wikis,
  onGenerateWiki,
  onRegenerateWiki,
  onGenerateSubTopics,
  onUpdateWiki,
  aiTopics,
  isLoadingTopics,
  initialHistory,
}) => {
  const [history, setHistory] = useState<ExplorationItem[]>(initialHistory || []);
  const [selectionPopup, setSelectionPopup] = useState<{ top: number; left: number; text: string } | null>(null);
  const [subTopics, setSubTopics] = useState<{ title: string; topics: string[] } | null>(null);
  const [activeBreadcrumb, setActiveBreadcrumb] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  const currentItem = history.length > 0 ? history[history.length - 1] : null;

  useEffect(() => {
    if (initialHistory) {
      setHistory(initialHistory);
    }
  }, [initialHistory]);


  useEffect(() => {
    // Close popups if the history changes
    setSelectionPopup(null);
    setSubTopics(null);
    setActiveBreadcrumb(null);
    
    // Fetch related topics if they don't exist
    if (currentItem && 'term' in currentItem && (!currentItem.suggestedTopics || currentItem.suggestedTopics.length === 0)) {
        onUpdateWiki(currentItem.id);
    }

  }, [history, currentItem, onUpdateWiki]);

  const handleStartWithNote = (note: Note) => {
    setHistory([note]);
  };

  const handleStartWithTopic = async (topic: string) => {
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

  const generateNewWiki = async (term: string, from: 'explore' | 'further') => {
    if (!currentItem || loadingState) return;
    setLoadingState(from === 'explore' ? { type: 'explore' } : { type: 'further', id: term });

    const sourceNoteId = 'sourceNoteId' in currentItem ? currentItem.sourceNoteId : currentItem.id;
    const parentId = 'term' in currentItem ? currentItem.id : null;
    
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

  const handleDirectExplore = () => {
    if (selectionPopup) {
      generateNewWiki(selectionPopup.text, 'explore');
    }
  }

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
  }

  const handleMouseUp = (event: React.MouseEvent) => {
    if (popupRef.current && popupRef.current.contains(event.target as Node)) {
      return;
    }
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
  }

  // Home View
  if (!currentItem) {
    return (
      <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Infinite Wiki</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Start a journey of discovery. Begin with one of your notes or an AI-suggested topic.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Start from a Note</h2>
              {notes.length > 0 ? (
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                  {notes.map(note => (
                    <button key={note.id} onClick={() => handleStartWithNote(note)} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <p className="font-semibold truncate">{note.title || 'Untitled Note'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{note.content || 'No content'}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any notes yet. Create one to start an exploration.</p>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <SparklesIcon className="w-5 h-5 text-purple-500" />
                Start from a Topic
              </h2>
               {isLoadingTopics ? (
                 <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                 </div>
               ) : aiTopics.length > 0 ? (
                 <div className="space-y-2">
                    {aiTopics.map((topic, index) => {
                      const isLoading = loadingState?.type === 'topic' && loadingState.id === topic;
                      return (
                        <button 
                            key={index} 
                            onClick={() => handleStartWithTopic(topic)}
                            disabled={!!loadingState}
                            className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <p className="font-semibold">{topic}</p>
                            {isLoading && (
                                <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
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
    );
  }

  const Breadcrumb = () => {
    const BreadcrumbItem = ({ item, isLast }: { item: ExplorationItem; isLast: boolean }) => {
      const children = 'id' in item ? wikis.filter(w => w.parentId === item.id) : [];
      const title = 'term' in item ? item.term : item.title || 'Untitled Note';

      const handleItemClick = () => {
        const itemIndex = history.findIndex(h => h.id === item.id);
        if (itemIndex !== -1) {
          setHistory(prev => prev.slice(0, itemIndex + 1));
        }
      }

      return (
        <div 
          className="relative group"
          onMouseEnter={() => 'id' in item && setActiveBreadcrumb(item.id)}
          onMouseLeave={() => setActiveBreadcrumb(null)}
        >
          <button 
            onClick={handleItemClick}
            className={`text-sm font-medium ${isLast ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {title}
          </button>
          {activeBreadcrumb === item.id && children.length > 0 && (
             <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 p-2 animate-in fade-in zoom-in-95">
                <button onClick={handleItemClick} className="w-full text-left block px-3 py-2 text-sm font-semibold rounded-md text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700/50 mb-1">{title}</button>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1 -mx-2"></div>
                {children.map(child => (
                   <button 
                     key={child.id} 
                     onClick={() => setHistory(prev => [...prev.slice(0, prev.findIndex(h => h.id === item.id) + 1), child])}
                     className="w-full text-left block px-3 py-2 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                   >
                      {child.term}
                   </button>
                ))}
             </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex items-center flex-wrap gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-md mb-6">
        {history.map((item, index) => (
          <React.Fragment key={item.id}>
            <BreadcrumbItem item={item} isLast={index === history.length - 1} />
            {index < history.length - 1 && <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  const childWikis = 'id' in currentItem ? wikis.filter(w => w.parentId === currentItem.id) : [];

  // Explorer View
  return (
     <div 
        className="h-full flex flex-col"
        onMouseUp={handleMouseUp}
     >
        {selectionPopup && (
         <div 
            ref={popupRef}
            onMouseUp={(e) => e.stopPropagation()}
            style={{ top: `${selectionPopup.top}px`, left: `${selectionPopup.left}px`, transform: 'translateX(-50%)' }}
            className="fixed z-10 animate-in fade-in zoom-in-95 duration-150 flex items-center bg-slate-800 rounded-lg shadow-lg"
          >
              <button onClick={handleDirectExplore} disabled={!!loadingState} className="flex items-center gap-2 text-sm px-3 py-1.5 text-white hover:bg-slate-700 rounded-l-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto w-full">
                <Breadcrumb />
                
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {'term' in currentItem ? currentItem.term : currentItem.title || 'Untitled Note'}
                  </h1>
                   {'term' in currentItem && (
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
                   )}
                </div>


                <div 
                    ref={contentRef}
                    className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: window.marked.parse(currentItem.content) }}
                ></div>

                {childWikis.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Branches from this topic</h3>
                      <div className="flex flex-wrap gap-3">
                          {childWikis.map(wiki => (
                              <button
                                  key={wiki.id}
                                  onClick={() => setHistory(prev => [...prev, wiki])}
                                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 rounded-full font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              >
                                  {wiki.term}
                              </button>
                          ))}
                      </div>
                  </div>
                )}
                
                {'suggestedTopics' in currentItem && currentItem.suggestedTopics && currentItem.suggestedTopics.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Further Exploration</h3>
                        <div className="flex flex-wrap gap-3">
                            {currentItem.suggestedTopics.map(topic => {
                              const isLoading = loadingState?.type === 'further' && loadingState.id === topic;
                              return (
                                <button
                                    key={topic}
                                    onClick={() => generateNewWiki(topic, 'further')}
                                    disabled={!!loadingState}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full font-medium text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
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
      </div>
  )
};

export default WikiStudio;
