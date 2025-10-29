import React, { useState, useEffect, useRef } from 'react';
import { Note, WikiEntry } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import ChatBubbleLeftRightIcon from '../icons/ChatBubbleLeftRightIcon';
import ThreadChatView from '../chat/ThreadChatView';

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (id: string, title: string, content: string) => void;
  wikis: WikiEntry[];
  onViewWikiInStudio: (wikiId: string) => void;
  isThreadChatting: boolean;
  onSendThreadChatMessage: (noteId: string, message: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
    note, 
    onUpdateNote,
    wikis,
    onViewWikiInStudio,
    isThreadChatting,
    onSendThreadChatMessage
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
      setIsChatVisible(false); // Close chat when no note is selected
    }
  }, [note]);

  useEffect(() => {
    // Auto-resize the textarea based on its content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to recalculate
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleBlur = () => {
    if (note) {
      if (note.title !== title || note.content !== content) {
        onUpdateNote(note.id, title, content);
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
             <button 
                onClick={() => setIsChatVisible(!isChatVisible)}
                title="Toggle Thread Chat"
                className={`p-2 rounded-full transition-colors flex-shrink-0 ${isChatVisible ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
             >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </button>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pt-6 pb-6 md:pb-8">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
                              onClick={() => onViewWikiInStudio(wiki.id)}
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
      {isChatVisible && (
        <div className="w-80 md:w-96 flex-shrink-0 h-full animate-in slide-in-from-right-10 duration-300">
            <ThreadChatView
                chatHistory={note.threadHistory || []}
                isChatting={isThreadChatting}
                onSendMessage={(message) => onSendThreadChatMessage(note.id, message)}
            />
        </div>
      )}
    </div>
  );
};

export default NoteEditor;