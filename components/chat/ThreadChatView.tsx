
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import UserIcon from '../icons/UserIcon';
import SparklesIcon from '../icons/SparklesIcon';

interface ThreadChatViewProps {
  chatHistory: ChatMessage[];
  isChatting: boolean;
  onSendMessage: (message: string) => void;
}

const ThreadChatView: React.FC<ThreadChatViewProps> = ({
  chatHistory,
  isChatting,
  onSendMessage,
}) => {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatting]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !isChatting) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && !isChatting && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
             <SparklesIcon className="w-12 h-12 mb-4 text-slate-400 dark:text-slate-500" />
            <h2 className="text-lg font-semibold">Start a Thread</h2>
            <p className="max-w-xs mt-1 text-sm">Ask questions, brainstorm, or ask for a rewrite. The AI will focus on this note.</p>
          </div>
        )}
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </div>
            )}
            <div className={`p-2.5 rounded-lg max-w-sm text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isChatting && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 rounded-bl-none">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Chat with this note..."
            disabled={isChatting}
            className="flex-1 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isChatting || !chatInput.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ThreadChatView;
