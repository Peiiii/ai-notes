
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import UserIcon from '../icons/UserIcon';
import SparklesIcon from '../icons/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';

interface ChatViewProps {
  chatHistory: ChatMessage[];
  chatStatus: string | null;
  onSendMessage: (message: string) => void;
  onSelectNote: (noteId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  chatHistory,
  chatStatus,
  onSendMessage,
  onSelectNote,
}) => {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isChatting = !!chatStatus;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatStatus]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !isChatting) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800/50">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
          <SparklesIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Companion</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your AI thought partner.</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && !isChatting && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
             <SparklesIcon className="w-16 h-16 mb-4 text-slate-400 dark:text-slate-500" />
            <h2 className="text-xl font-semibold">Start the Conversation</h2>
            <p className="max-w-sm mt-2">Ask a question about your notes, or ask to create a new one. E.g., "What were my main takeaways about the Q3 project?" or "Create a new note summarizing my ideas for the marketing campaign."</p>
          </div>
        )}
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              </div>
            )}
            <div className={`flex flex-col items-start`}>
              <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.sourceNotes && msg.sourceNotes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <BookOpenIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sources:</span>
                    {msg.sourceNotes.map(note => (
                        <button key={note.id} onClick={() => onSelectNote(note.id)} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-xs text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                            {note.title}
                        </button>
                    ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isChatting && (
          <div className="flex items-start gap-3 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 rounded-bl-none">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                </div>
                <span>{chatStatus}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleChatSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask anything about your notes..."
            disabled={isChatting}
            className="flex-1 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isChatting || !chatInput.trim()}
            className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;