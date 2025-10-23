import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import ChatBubbleBottomCenterTextIcon from './icons/ChatBubbleBottomCenterTextIcon';
import ThreadChatView from './ThreadChatView';

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (id: string, title: string, content: string) => void;
  isThreadVisible: boolean;
  onToggleThread: () => void;
  onSendThreadMessage: (message: string) => void;
  isChattingInThread: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
    note, 
    onUpdateNote,
    isThreadVisible,
    onToggleThread,
    onSendThreadMessage,
    isChattingInThread,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

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

  const threadHistory = note.threadHistory || [];

  return (
    <div className="h-full flex bg-white dark:bg-slate-800/50">
        <div className="relative p-6 md:p-8 h-full flex flex-col flex-1">
            <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={onToggleThread}
                    title={isThreadVisible ? "Hide Thread" : "Show Thread"}
                    className={`p-2 rounded-full transition-colors ${
                        isThreadVisible 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                    <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                </button>
            </div>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                placeholder="Note Title"
                className="text-3xl font-bold bg-transparent focus:outline-none mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                placeholder="Start writing..."
                className="flex-1 w-full bg-transparent text-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
            />
        </div>
        {isThreadVisible && (
            <aside className="w-full max-w-sm flex-shrink-0 animate-in slide-in-from-right-12 duration-300">
                <ThreadChatView 
                    chatHistory={threadHistory}
                    isChatting={isChattingInThread}
                    onSendMessage={onSendThreadMessage}
                />
            </aside>
        )}
    </div>
  );
};

export default NoteEditor;