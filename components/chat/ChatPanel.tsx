

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePresenter } from '../../presenter';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { useNotesStore } from '../../stores/notesStore';
import { useCommandStore } from '../../stores/commandStore';
import { ChatMessage, AIAgent, ChatSession, DiscussionMode, ProactiveSuggestion, Note } from '../../types';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import UserIcon from '../icons/UserIcon';
import SparklesIcon from '../icons/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import CommandPalette from './CommandPalette';
import ToolCallCard from './ToolCallCard';
import ToolResultCard from './ToolResultCard';
import UserPlusIcon from '../icons/UserPlusIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import SpeakerWaveIcon from '../icons/SpeakerWaveIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import ConfirmationModal from '../ui/ConfirmationModal';
import GlobeAltIcon from '../icons/GlobeAltIcon';
import { ParticipantAvatarStack, AgentMentionPopup, AgentAvatar } from './ChatUIComponents';
import AddAgentsModal from './AddAgentsModal';
import ChatBubbleLeftRightIcon from '../icons/ChatBubbleLeftRightIcon';


// --- Discussion Modes ---
const discussionModes: { id: DiscussionMode; name: string; description: string; icon: React.FC<any> }[] = [
    { id: 'concurrent', name: 'Concurrent', description: 'All agents respond at the same time. Best for quick brainstorming.', icon: SparklesIcon },
    { id: 'turn_based', name: 'Turn-Based', description: 'Agents respond one after another, seeing previous replies.', icon: ArrowPathIcon },
    { id: 'moderated', name: 'Moderated', description: 'A moderator AI directs the conversation, choosing who speaks.', icon: SpeakerWaveIcon },
];

const ThinkingIndicator = () => (
    <div className="flex items-center gap-1.5 p-3">
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
    </div>
);

// --- Proactive Suggestions Panel ---
const ProactiveSuggestionsPanel: React.FC<{
  suggestions: ProactiveSuggestion[];
  isLoading: boolean;
  onSelectSuggestion: (prompt: string) => void;
}> = ({ suggestions, isLoading, onSelectSuggestion }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center">Need some inspiration?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
                <button
                    key={i}
                    onClick={() => onSelectSuggestion(s.prompt)}
                    className="w-full text-left p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{s.prompt}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.description}</p>
                </button>
            ))}
        </div>
    </div>
  );
};


// --- Chat Panel Component (Right Side) ---
const ChatPanel: React.FC = () => {
  const presenter = usePresenter();
  const { sessions, activeSessionId } = useChatStore();
  const agents = useAgentStore(state => state.agents);
  const notes = useNotesStore(state => state.notes);
  const commands = useCommandStore(state => state.getCommands());
  
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || null, [sessions, activeSessionId]);
  
  const [chatInput, setChatInput] = useState('');
  const [isAddAgentModalOpen, setAddAgentModalOpen] = useState(false);
  const [isModeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  
  const isChatting = useMemo(() => 
    activeSession?.history.some(m => m.status === 'thinking' || m.status === 'streaming') || false,
    [activeSession?.history]
  );
  
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const [mentionPopup, setMentionPopup] = useState<{ visible: boolean; query: string; agents: AIAgent[], selectedIndex: number; startPos: number; } | null>(null);

  const filteredCommands = commands.filter(c => c.name.toLowerCase().startsWith(commandQuery.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
            setModeDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modeDropdownRef]);

  useEffect(() => {
    if (activeSession && activeSession.history.length === 0 && notes.length > 0) {
      setIsLoadingSuggestions(true);
      presenter.handleGenerateChatSuggestions(notes)
        .then(setSuggestions)
        .finally(() => setIsLoadingSuggestions(false));
    } else {
      setSuggestions([]);
    }
  }, [activeSession, notes, presenter]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.history, suggestions]);
  
  useEffect(() => {
    setChatInput('');
    setMentionPopup(null);
  }, [activeSession?.id]);

  const handleSelectMention = useCallback((agentName: string) => {
    if (!mentionPopup) return;
    
    const currentVal = chatInput;
    const before = currentVal.substring(0, mentionPopup.startPos);
    const after = currentVal.substring(mentionPopup.startPos + mentionPopup.query.length + 1);
    const newText = `${before}@${agentName} ${after}`;

    setChatInput(newText);
    setMentionPopup(null);
    
    setTimeout(() => {
        inputRef.current?.focus();
        const newCursorPos = before.length + 1 + agentName.length + 1;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [chatInput, mentionPopup]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    setChatInput(value);

    const participants = activeSession ? agents.filter(a => activeSession.participantIds.includes(a.id)) : [];
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atMatch = /(?:\s|^)@(\w*)$/.exec(textBeforeCursor);

    if (atMatch && participants.length > 1) {
        const query = atMatch[1];
        const filteredAgents = participants.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
        
        if (filteredAgents.length > 0) {
            setMentionPopup({
                visible: true,
                query,
                agents: filteredAgents,
                selectedIndex: 0,
                startPos: atMatch.index === 0 ? 0 : atMatch.index + 1,
            });
        } else {
            setMentionPopup(null);
        }
    } else {
        setMentionPopup(null);
    }
    
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
  
  const handleSelectSuggestion = (prompt: string) => {
    if (!activeSession) return;
    presenter.handleSendMessage(activeSession.id, prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionPopup?.visible) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionPopup(p => p ? ({ ...p, selectedIndex: (p.selectedIndex + 1) % p.agents.length }) : null);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionPopup(p => p ? ({ ...p, selectedIndex: (p.selectedIndex - 1 + p.agents.length) % p.agents.length }) : null);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const selectedAgent = mentionPopup.agents[mentionPopup.selectedIndex];
            handleSelectMention(selectedAgent.name);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setMentionPopup(null);
        }
        return;
    }
    
    if (!showCommands) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = (selectedCommandIndex + 1) % (filteredCommands.length > 0 ? filteredCommands.length : 1);
      setSelectedCommandIndex(newIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = (selectedCommandIndex - 1 + (filteredCommands.length > 0 ? filteredCommands.length : 1)) % (filteredCommands.length > 0 ? filteredCommands.length : 1);
      setSelectedCommandIndex(newIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands.length > 0 && selectedCommandIndex < filteredCommands.length) {
        handleSelectCommand(filteredCommands[selectedCommandIndex].name);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowCommands(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if (chatInput.trim() && !isChatting) {
      presenter.handleSendMessage(activeSession.id, chatInput);
      setChatInput('');
      setShowCommands(false);
      setMentionPopup(null);
    }
  };

  const completedToolCallIds = useMemo(() => {
    const ids = new Set<string>();
    activeSession?.history.forEach(msg => {
      if (msg.role === 'tool' && (msg.toolCalls?.[0]?.id || msg.tool_call_id)) {
        ids.add(msg.toolCalls?.[0]?.id || msg.tool_call_id!);
      }
    });
    return ids;
  }, [activeSession?.history]);

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
          <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-xl font-semibold">Select a conversation</h2>
          <p className="max-w-sm mt-2">Choose a chat from the sidebar or start a new one to begin.</p>
      </div>
    );
  }

  const participants = agents.filter(a => activeSession.participantIds.includes(a.id));
  const availableAgentsToAdd = agents.filter(a => !activeSession.participantIds.includes(a.id));
  const currentMode = discussionModes.find(m => m.id === activeSession.discussionMode) || discussionModes[0];
  const CurrentModeIcon = currentMode.icon;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800/50">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ParticipantAvatarStack agents={participants} size="lg"/>
            <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{activeSession.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {participants.length > 1 ? `${participants.length} Agents` : participants[0]?.description || 'Chat'}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {participants.length > 1 && (
                <div className="relative" ref={modeDropdownRef}>
                    <button 
                        onClick={() => setModeDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-md"
                    >
                        <CurrentModeIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>{currentMode.name}</span>
                        <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                    {isModeDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 p-2 animate-in fade-in zoom-in-95">
                            {discussionModes.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => {
                                        presenter.handleUpdateSessionMode(activeSession.id, mode.id);
                                        setModeDropdownOpen(false);
                                    }}
                                    className="w-full text-left p-2 flex items-start gap-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <mode.icon className="w-5 h-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0"/>
                                    <div>
                                        <p className="font-semibold text-sm">{mode.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{mode.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {availableAgentsToAdd.length > 0 && (
              <button 
                  onClick={() => setAddAgentModalOpen(true)}
                  title="Add agent to chat"
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                  <UserPlusIcon className="w-5 h-5"/>
              </button>
            )}
             <button
                onClick={() => setIsClearConfirmOpen(true)}
                title="Clear chat history"
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
                <ArrowPathIcon className="w-5 h-5"/>
            </button>
          </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSession.history.length === 0 ? (
          <ProactiveSuggestionsPanel
            suggestions={suggestions}
            isLoading={isLoadingSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />
        ) : (
          activeSession.history.map((msg) => {
              const agent = agents.find(a => a.name === msg.persona);
              if (msg.role === 'system') return (
                <div key={msg.id} className="text-center text-xs text-slate-400 dark:text-slate-500 italic my-2">
                  {msg.content}
                </div>
              );
              if (msg.role === 'user') return (
                <div key={msg.id} className="flex items-start gap-3 max-w-4xl mx-auto justify-end">
                  <div className="p-3 rounded-lg max-w-lg bg-indigo-600 text-white rounded-br-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                </div>
              );
              if (msg.role === 'model' && msg.toolCalls) return <ToolCallCard key={msg.id} toolCalls={msg.toolCalls} text={msg.content} completedToolCallIds={completedToolCallIds} />;
              if (msg.role === 'tool' && msg.structuredContent) return <ToolResultCard key={msg.id} message={msg} onSelectNote={presenter.handleSelectNote} />;
              return (
                <div key={msg.id} className="flex items-start gap-3 max-w-4xl mx-auto">
                  {agent ? <AgentAvatar agent={agent} /> : <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /></div>}
                  <div className="flex flex-col items-start">
                    <div className="p-3 rounded-lg max-w-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none">
                      {msg.persona && participants.length > 1 && <p className="text-xs font-bold mb-1 text-indigo-600 dark:text-indigo-400">{msg.persona}</p>}
                      
                      {msg.status === 'thinking' ? (
                          <ThinkingIndicator />
                      ) : (
                          <div className="text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: window.marked.parse(msg.content) }}></div>
                      )}

                    </div>
                    {msg.sourceNotes && msg.sourceNotes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                          <BookOpenIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sources:</span>
                          {msg.sourceNotes.map(note => (
                              <button key={note.id} onClick={() => presenter.handleSelectNote(note.id)} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-xs text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                                  {note.title}
                              </button>
                          ))}
                      </div>
                    )}
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 w-full max-w-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <GlobeAltIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sources from the web</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {msg.groundingChunks.map((chunk, index) => {
                            if (!chunk.web) return null;
                            try {
                              const hostname = new URL(chunk.web.uri).hostname;
                              return (
                                <li key={index}>
                                  <a 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline min-w-0 group"
                                  >
                                    <p className="truncate font-semibold group-hover:text-blue-500 dark:group-hover:text-blue-300">{chunk.web.title}</p>
                                    <p className="truncate text-slate-500 dark:text-slate-400">{hostname}</p>
                                  </a>
                                </li>
                              )
                            } catch(e) {
                              return null;
                            }
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
          })
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleChatSubmit} className="max-w-4xl mx-auto relative">
          {mentionPopup?.visible && (
              <AgentMentionPopup
                  agents={mentionPopup.agents}
                  selectedIndex={mentionPopup.selectedIndex}
                  onSelect={handleSelectMention}
                  style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: '8px'
                  }}
              />
          )}
          {showCommands && (
            <CommandPalette
                commands={filteredCommands}
                query={commandQuery}
                selectedIndex={selectedCommandIndex}
                onSelect={handleSelectCommand}
                onHover={setSelectedCommandIndex}
                onCreateCommand={presenter.handleOpenCreateCommandModal}
            />
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeSession.name}... (try '@' to mention)`}
              disabled={isChatting}
              className="flex-1 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
       <AddAgentsModal
            isOpen={isAddAgentModalOpen}
            onClose={() => setAddAgentModalOpen(false)}
            agents={availableAgentsToAdd}
            onAddAgents={(agentIds) => presenter.handleAddAgentsToSession(activeSession.id, agentIds)}
        />
       <ConfirmationModal
            isOpen={isClearConfirmOpen}
            onClose={() => setIsClearConfirmOpen(false)}
            onConfirm={() => {
                presenter.handleClearSessionHistory(activeSession.id);
                setIsClearConfirmOpen(false);
            }}
            title="Clear Chat History"
            message="Are you sure you want to clear this chat history? This action cannot be undone."
            confirmButtonText="Clear History"
            confirmButtonClassName="bg-red-600 hover:bg-red-700"
        />
    </div>
  );
};

export default ChatPanel;
