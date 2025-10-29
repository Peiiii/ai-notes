
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage, ProactiveSuggestion } from '../../types';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import UserIcon from '../icons/UserIcon';
import SparklesIcon from '../icons/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import CommandPalette from './CommandPalette';
import { Command } from '../../commands';
import ThoughtBubbleIcon from '../icons/ThoughtBubbleIcon';
import ToolCallCard from './ToolCallCard';
import ToolResultCard from './ToolResultCard';

interface ChatViewProps {
  chatHistory: ChatMessage[];
  chatStatus: string | null;
  onSendMessage: (message: string) => void;
  onSelectNote: (noteId: string) => void;
  commands: Command[];
  onOpenCreateCommandModal: (commandName: string) => void;
  proactiveSuggestions: ProactiveSuggestion[];
  isLoadingSuggestions: boolean;
}

const SuggestionSkeleton = () => (
  <div className="p-4 bg-white dark:bg-slate-700/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 bg-slate-200 dark:bg-slate-600 rounded-full mt-0.5 flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full"></div>
      </div>
    </div>
  </div>
);

const ChatView: React.FC<ChatViewProps> = ({
  chatHistory,
  chatStatus,
  onSendMessage,
  onSelectNote,
  commands,
  onOpenCreateCommandModal,
  proactiveSuggestions,
  isLoadingSuggestions,
}) => {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isChatting = !!chatStatus;
  
  // Command Palette State
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const filteredCommands = commands.filter(c => c.name.toLowerCase().startsWith(commandQuery.toLowerCase()));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatStatus]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setChatInput(value);

    if (value.startsWith('/') && !value.includes(' ')) {
        setShowCommands(true);
        setCommandQuery(value.substring(1));
        setSelectedCommandIndex(0);
    } else {
        setShowCommands(false);
    }
  };
  
  const handleSelectCommand = useCallback((commandName: string) => {
    setChatInput(`/${commandName} `);
    setShowCommands(false);
    inputRef.current?.focus();
  }, []);

  const handleCreateCommand = (commandName: string) => {
    onOpenCreateCommandModal(commandName);
    setShowCommands(false);
    setChatInput('');
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showCommands) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = (selectedCommandIndex + 1) % (filteredCommands.length + (filteredCommands.length === 0 ? 1 : 0));
            setSelectedCommandIndex(newIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = (selectedCommandIndex - 1 + (filteredCommands.length + (filteredCommands.length === 0 ? 1 : 0))) % (filteredCommands.length + (filteredCommands.length === 0 ? 1 : 0));
            setSelectedCommandIndex(newIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands.length > 0 && selectedCommandIndex < filteredCommands.length) {
                handleSelectCommand(filteredCommands[selectedCommandIndex].name);
            } else if (filteredCommands.length === 0) {
                handleCreateCommand(commandQuery);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowCommands(false);
        }
    }
  }, [showCommands, filteredCommands, selectedCommandIndex, commandQuery, handleSelectCommand]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showCommands) {
      if (filteredCommands.length > 0 && selectedCommandIndex < filteredCommands.length) {
          handleSelectCommand(filteredCommands[selectedCommandIndex].name);
          return;
      } else if (filteredCommands.length === 0 && commandQuery) {
          handleCreateCommand(commandQuery);
          return;
      }
    }
    if (chatInput.trim() && !isChatting) {
      onSendMessage(chatInput);
      setChatInput('');
      setShowCommands(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  const completedToolCallIds = useMemo(() => {
    const ids = new Set<string>();
    chatHistory.forEach(msg => {
      // A tool result message signifies its corresponding call is complete.
      if (msg.role === 'tool' && msg.toolCalls?.[0]?.id) {
        ids.add(msg.toolCalls[0].id);
      }
      // Also check OpenAI format for robustness
      if (msg.role === 'tool' && msg.tool_call_id) {
        ids.add(msg.tool_call_id);
      }
    });
    return ids;
  }, [chatHistory]);
  
  const ChatEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
        <SparklesIcon className="w-16 h-16 mb-4 text-slate-400 dark:text-slate-500" />
        <h2 className="text-xl font-semibold">AI Companion</h2>
        <p className="max-w-sm mt-2">Ask a question, or type <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md font-mono text-sm">/</code> for commands.</p>

        {(isLoadingSuggestions || proactiveSuggestions.length > 0) && (
            <div className="mt-12 w-full max-w-2xl">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 tracking-wider uppercase">Thought Bubbles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {isLoadingSuggestions ? (
                        <>
                            <SuggestionSkeleton />
                            <SuggestionSkeleton />
                        </>
                    ) : (
                        proactiveSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion.prompt)}
                                className="text-left p-4 bg-white dark:bg-slate-700/50 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all transform border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-start gap-3">
                                    <ThoughtBubbleIcon className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{suggestion.prompt}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{suggestion.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        )}
    </div>
  );

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
        {chatHistory.length === 0 && !isChatting ? <ChatEmptyState /> : 
        (chatHistory.map((msg) => {
            if (msg.role === 'user') {
                return (
                    <div key={msg.id} className="flex items-start gap-3 max-w-4xl mx-auto justify-end">
                        <div className="p-3 rounded-lg max-w-lg bg-indigo-600 text-white rounded-br-none">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                    </div>
                )
            }
            if (msg.role === 'model' && msg.toolCalls) {
                return <ToolCallCard key={msg.id} toolCalls={msg.toolCalls} text={msg.content} completedToolCallIds={completedToolCallIds} />
            }
            if (msg.role === 'tool' && msg.structuredContent) {
                return <ToolResultCard key={msg.id} message={msg} onSelectNote={onSelectNote} />
            }
            // Default model text response
            return (
              <div key={msg.id} className="flex items-start gap-3 max-w-4xl mx-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex flex-col items-start">
                  <div className="p-3 rounded-lg max-w-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none">
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
              </div>
            )
        }))}
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
        <form onSubmit={handleChatSubmit} className="max-w-4xl mx-auto relative">
          {showCommands && (
            <CommandPalette
                commands={filteredCommands}
                query={commandQuery}
                selectedIndex={selectedCommandIndex}
                onSelect={handleSelectCommand}
                onHover={setSelectedCommandIndex}
                onCreateCommand={handleCreateCommand}
            />
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or type '/' for commands..."
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
