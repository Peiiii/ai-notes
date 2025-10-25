import React, { useState, useMemo } from 'react';
import { Note, WikiEntry } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';
import SparklesIcon from './icons/SparklesIcon';

declare global {
  interface Window {
    marked: {
      parse: (markdown: string) => string;
    };
  }
}

type ExplorationItem = Note | WikiEntry;

interface WikiStudioProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onGenerateWiki: (term: string, sourceNoteId: string, contextContent: string) => Promise<WikiEntry>;
  isGeneratingWiki: boolean;
  aiTopics: string[];
  isLoadingTopics: boolean;
}

const WikiStudio: React.FC<WikiStudioProps> = ({
  notes,
  onSelectNote,
  onGenerateWiki,
  isGeneratingWiki,
  aiTopics,
  isLoadingTopics,
}) => {
  const [history, setHistory] = useState<ExplorationItem[]>([]);
  const [selectionPopup, setSelectionPopup] = useState<{ top: number; left: number; text: string } | null>(null);

  const currentItem = history.length > 0 ? history[history.length - 1] : null;

  const handleStartWithNote = (note: Note) => {
    setHistory([note]);
  };

  const handleStartWithTopic = async (topic: string) => {
    // Find any note to serve as a source anchor. If none, this won't work.
    const sourceNoteId = notes.length > 0 ? notes[0].id : 'no-source';
    if (sourceNoteId === 'no-source') {
        alert("Please create a note before starting from a topic.");
        return;
    }
    try {
        // Create context from all notes to ensure language consistency
        const contextContent = notes.map(n => `${n.title} ${n.content}`).join('\n');
        const newWikiEntry = await onGenerateWiki(topic, sourceNoteId, contextContent);
        setHistory([newWikiEntry]);
    } catch (e) {
        console.error("Failed to start with topic", e);
    }
  };

  const handleGenerateClick = async () => {
    if (selectionPopup && !isGeneratingWiki && currentItem) {
        // FIX: The original type guard `'content' in currentItem` was incorrect as both Note and WikiEntry have a `content` property.
        // This caused a TypeScript error because `sourceNoteId` doesn't exist on `Note`.
        // Using `'sourceNoteId' in currentItem` correctly distinguishes a WikiEntry from a Note.
        const sourceNoteId = 'sourceNoteId' in currentItem ? currentItem.sourceNoteId : currentItem.id;
        try {
            const newWikiEntry = await onGenerateWiki(selectionPopup.text, sourceNoteId, currentItem.content);
            setHistory(prev => [...prev, newWikiEntry]);
        } catch(e) {
            console.error("Failed to generate next wiki", e);
        } finally {
            setSelectionPopup(null);
        }
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 2 && selection.length < 100) {
      setSelectionPopup({ top: e.clientY, left: e.clientX, text: selection });
    } else {
      setSelectionPopup(null);
    }
  };
  
  const handleBack = () => {
    setHistory(prev => prev.slice(0, -1));
    setSelectionPopup(null);
  };
  
  const handleScroll = () => {
    if (selectionPopup) {
      setSelectionPopup(null);
    }
  };

  // Home View - where user selects starting point
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
            {/* Start from Note */}
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
            {/* Start from Topic */}
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
                    {aiTopics.map((topic, index) => (
                        <button key={index} onClick={() => handleStartWithTopic(topic)} className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <p className="font-semibold">{topic}</p>
                        </button>
                    ))}
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

  // Explorer View
  return (
     <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto" onScroll={handleScroll}>
        {selectionPopup && (
         <div 
            style={{ top: `${selectionPopup.top + 10}px`, left: `${selectionPopup.left}px` }}
            className="fixed z-10 animate-in fade-in zoom-in-95 duration-150"
          >
              <button
                onClick={handleGenerateClick}
                disabled={isGeneratingWiki}
                className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-950 disabled:bg-slate-600"
              >
                  <BookOpenIcon className="w-4 h-4" />
                  {isGeneratingWiki ? 'Exploring...' : `Explore "${selectionPopup.text}"`}
              </button>
          </div>
        )}
        <div className="max-w-4xl mx-auto w-full">
            <div className="mb-6">
                {history.length > 1 ? (
                    <button onClick={handleBack} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        &larr; Back
                    </button>
                ) : (
                    <button onClick={() => setHistory([])} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        &larr; Back to Start
                    </button>
                )}
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {'term' in currentItem ? currentItem.term : currentItem.title || 'Untitled Note'}
            </h1>

            {'sourceNoteId' in currentItem && (
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Original source: <button onClick={() => onSelectNote(currentItem.sourceNoteId)} className="font-medium hover:underline">
                        {notes.find(n => n.id === currentItem.sourceNoteId)?.title || 'Untitled Note'}
                    </button>
                </p>
            )}

            <div 
                className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                onMouseUp={handleMouseUp}
                onMouseDown={() => setSelectionPopup(null)}
                dangerouslySetInnerHTML={{ __html: window.marked.parse(currentItem.content) }}
            ></div>
        </div>
      </div>
  )
};

export default WikiStudio;
