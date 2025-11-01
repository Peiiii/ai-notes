
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePresenter } from '../../presenter';
import { useAppStore } from '../../stores/appStore';
import { useNotesStore } from '../../stores/notesStore';
import { useWikiStore } from '../../stores/wikiStore';
import { useChatStore } from '../../stores/chatStore';
import { useInsightStore } from '../../stores/insightStore';
import { Note, WikiEntry, Insight } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import ChatBubbleLeftRightIcon from '../icons/ChatBubbleLeftRightIcon';
import ThreadChatView from '../chat/ThreadChatView';
import InsightPanel from './InsightPanel';
import LightbulbIcon from '../icons/LightbulbIcon';
import XMarkIcon from '../icons/XMarkIcon';

const NoteEditor: React.FC = () => {
  const presenter = usePresenter();
  const { activeNoteId } = useAppStore();
  const { notes } = useNotesStore();
  const { wikis } = useWikiStore();
  const { isThreadChatting } = useChatStore();
  const { insights, isLoadingInsights } = useInsightStore();

  const note = useMemo(() => notes.find(n => n.id === activeNoteId) || null, [notes, activeNoteId]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'insights' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      // Don't close panel when switching notes
    } else {
      setTitle('');
      setContent('');
      setActiveSidePanel(null); // Close panel when no note is selected
    }
  }, [note]);
  
  useEffect(() => {
    // If insights arrive and no panel is open, open the insights panel automatically.
    if (insights.length > 0 && activeSidePanel === null) {
        setActiveSidePanel('insights');
    }
  }, [insights, activeSidePanel]);

  useEffect(() => {
    // Auto-resize the textarea based on its content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to recalculate
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (note) {
        presenter.handleNoteContentChange(e.target.value, note.id);
    }
  };

  const handleBlur = () => {
    if (note) {
      if (note.title !== title || note.content !== content) {
        presenter.notesManager.updateNote(note.id, { title, content });
      }
    }
  };

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        <div className="text-center">
            <h2 className="text-2xl font-semibold">Select a note</h2>
            <p>Or create a new one to get started.</p>
        </div>
      </div>
    );
  }
  
  const rootWikisFromThisNote = wikis.filter(w => w.sourceNoteId === note.id && w.parentId === null);

  return (
    <div className="h-full flex flex-row bg-white dark:bg-slate-800/50">
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header for title, not scrollable */}
        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                placeholder="Note Title"
                className="w-full text-3xl font-bold bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setActiveSidePanel(prev => prev === 'insights' ? null : 'insights')}
                    title="Toggle Insights"
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 relative ${activeSidePanel === 'insights' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                 >
                    {isLoadingInsights ? (
                        <div className="w-5 h-5 border-2 border-amber-400/50 border-t-amber-400 rounded-full animate-spin"></div>
                    ) : (
                        <LightbulbIcon className="w-6 h-6" />
                    )}
                    {insights.length > 0 && !isLoadingInsights && activeSidePanel !== 'insights' && (
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-800/50" />
                    )}
                </button>
                 <button 
                    onClick={() => setActiveSidePanel(prev => prev === 'chat' ? null : 'chat')}
                    title="Toggle Thread Chat"
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${activeSidePanel === 'chat' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                 >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pt-6 pb-6 md:pb-8">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onBlur={handleBlur}
                placeholder="Start writing..."
                className="w-full bg-transparent text-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
                rows={1}
            />
            {rootWikisFromThisNote.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <BookOpenIcon className="w-5 h-5"/>
                      Explorations from this note
                    </h3>
                    <div className="space-y-2">
                        {rootWikisFromThisNote.map(wiki => (
                            <button 
                              key={wiki.id} 
                              onClick={() => presenter.handleViewWikiInStudio(wiki.id)}
                              className="w-full text-left p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{wiki.term}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Started on {new Date(wiki.createdAt).toLocaleDateString()}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
      {activeSidePanel && (
        <div className="w-80 md:w-96 flex-shrink-0 h-full flex flex-col border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-10 duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    {activeSidePanel === 'insights' ? <LightbulbIcon className="w-5 h-5 text-amber-500"/> : <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-500" />}
                    <h2 className="font-semibold text-lg">{activeSidePanel === 'insights' ? 'Live Insights' : 'Thread Chat'}</h2>
                </div>
                <button onClick={() => setActiveSidePanel(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><XMarkIcon className="w-5 h-5"/></button>
            </div>
            {activeSidePanel === 'insights' ? (
                <InsightPanel
                    note={note}
                    insights={insights}
                    isLoading={isLoadingInsights}
                    onAdoptTodo={presenter.handleAdoptInsightTodo}
                    onCreateWiki={(term) => presenter.handleCreateInsightWiki(term, note.id, note.content)}
                    onSelectNote={presenter.handleSelectNote}
                />
            ) : (
                <ThreadChatView
                    chatHistory={note.threadHistory || []}
                    isChatting={isThreadChatting}
                    onSendMessage={(message) => presenter.handleSendThreadMessage(note.id, message)}
                />
            )}
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
