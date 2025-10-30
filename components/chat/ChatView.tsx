
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage, AIAgent, ChatSession, DiscussionMode, ProactiveSuggestion, Note } from '../../types';
import { Command } from '../../commands';
import { Presenter } from '../../presenter';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import UserIcon from '../icons/UserIcon';
import SparklesIcon from '../icons/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import CommandPalette from './CommandPalette';
import ToolCallCard from './ToolCallCard';
import ToolResultCard from './ToolResultCard';
import PlusIcon from '../icons/PlusIcon';
import Modal from '../ui/Modal';
import Cog6ToothIcon from '../icons/Cog6ToothIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import UsersIcon from '../icons/UsersIcon';
import UserPlusIcon from '../icons/UserPlusIcon';
import CpuChipIcon from '../icons/CpuChipIcon';
import LightbulbIcon from '../icons/LightbulbIcon';
import BeakerIcon from '../icons/BeakerIcon';
import ChatBubbleLeftRightIcon from '../icons/ChatBubbleLeftRightIcon';
import ChevronDoubleLeftIcon from '../icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from '../icons/ChevronDoubleRightIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import SpeakerWaveIcon from '../icons/SpeakerWaveIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import ConfirmationModal from '../ui/ConfirmationModal';
import HoverPopup from '../ui/HoverPopup';

// --- Available Icons & Colors for Agent Creation ---
const agentIcons: Record<string, React.FC<any>> = {
  SparklesIcon, BookOpenIcon, CpuChipIcon, LightbulbIcon, BeakerIcon, UsersIcon
};
const iconColors: Record<string, { bg: string, text: string }> = {
  slate: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' },
  indigo: { bg: 'bg-indigo-200 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-300' },
  sky: { bg: 'bg-sky-200 dark:bg-sky-900/50', text: 'text-sky-600 dark:text-sky-300' },
  purple: { bg: 'bg-purple-200 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-300' },
  amber: { bg: 'bg-amber-200 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-300' },
  rose: { bg: 'bg-rose-200 dark:bg-rose-900/50', text: 'text-rose-600 dark:text-rose-300' },
  green: { bg: 'bg-green-200 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-300' },
};

const AgentAvatar: React.FC<{ agent: AIAgent, size?: 'sm' | 'md' | 'lg'}> = ({ agent, size = 'md' }) => {
    const Icon = agentIcons[agent.icon] || SparklesIcon;
    const color = iconColors[agent.color] || iconColors.indigo;
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    };
    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };
    return (
        <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${color.bg} ${sizeClasses[size]}`}>
            <Icon className={`${color.text} ${iconSizeClasses[size]}`} />
        </div>
    );
}

const ParticipantAvatarStack: React.FC<{ agents: AIAgent[], size?: 'sm' | 'lg'}> = ({ agents, size = 'sm' }) => {
    const maxVisible = size === 'sm' ? 3 : 4;
    const visibleAgents = agents.slice(0, maxVisible);
    const hiddenCount = agents.length - maxVisible;
    const sizeClasses = size === 'sm' ? 'h-6 min-w-6 px-1' : 'h-10 min-w-10 px-1.5';
    
    return (
        <div className="flex items-center flex-shrink-0">
            <div className={`flex ${size === 'sm' ? '-space-x-2' : '-space-x-4'}`}>
                {visibleAgents.map(agent => (
                    <div key={agent.id} className={`ring-2 ring-slate-100 dark:ring-slate-800 rounded-full`}>
                      <AgentAvatar agent={agent} size={size} />
                    </div>
                ))}
            </div>
            {hiddenCount > 0 && (
                <div className={`flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold z-10 ring-2 ring-slate-100 dark:ring-slate-800 ${sizeClasses} ${size === 'sm' ? '-ml-2' : '-ml-4'}`}>
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
};

// --- New WeChat-inspired Composite Avatar ---
const CompositeAvatar: React.FC<{ agents: AIAgent[] }> = ({ agents }) => {
    const displayAgents = agents.slice(0, 4); // Max 4 in a 2x2 grid
    return (
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 grid grid-cols-2 grid-rows-2 gap-px p-px overflow-hidden">
            {displayAgents.map((agent) => {
                const Icon = agentIcons[agent.icon] || SparklesIcon;
                const color = iconColors[agent.color] || iconColors.indigo;
                // Note: We use rounded-none here because the parent provides the circle mask
                return (
                    <div key={agent.id} className={`w-full h-full flex items-center justify-center ${color.bg}`}>
                        <Icon className={`w-[65%] h-[65%] ${color.text}`} />
                    </div>
                );
            })}
        </div>
    );
};


// --- Discussion Modes ---
const discussionModes: { id: DiscussionMode; name: string; description: string; icon: React.FC<any> }[] = [
    { id: 'concurrent', name: 'Concurrent', description: 'All agents respond at the same time. Best for quick brainstorming.', icon: SparklesIcon },
    { id: 'turn_based', name: 'Turn-Based', description: 'Agents respond one after another, seeing previous replies.', icon: ArrowPathIcon },
    { id: 'moderated', name: 'Moderated', description: 'A moderator AI directs the conversation, choosing who speaks.', icon: SpeakerWaveIcon },
];

// --- Chat View Props ---
interface ChatViewProps {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  agents: AIAgent[];
  notes: Note[];
  onSendMessage: (sessionId: string, message: string) => void;
  onSelectNote: (noteId: string) => void;
  commands: Command[];
  onOpenCreateCommandModal: (commandName: string) => void;
  onSetActiveSession: (sessionId: string | null) => void;
  onCreateSession: (participantIds: string[], discussionMode: DiscussionMode) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearSessionHistory: (sessionId: string) => void;
  onCreateAgent: (agentData: Omit<AIAgent, 'id' | 'createdAt' | 'isCustom'>) => AIAgent;
  onUpdateAgent: (agentData: AIAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  onAddAgentsToSession: (sessionId: string, agentIds: string[]) => void;
  onUpdateSessionMode: (sessionId: string, newMode: DiscussionMode) => void;
  presenter: Presenter;
}

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
const ChatPanel: React.FC<Pick<ChatViewProps, 'activeSession' | 'agents' | 'onSendMessage' | 'onSelectNote' | 'commands' | 'onOpenCreateCommandModal' | 'onAddAgentsToSession' | 'onUpdateSessionMode' | 'onClearSessionHistory' | 'notes' | 'presenter'>> = ({
  activeSession, agents, onSendMessage, onSelectNote, commands, onOpenCreateCommandModal, onAddAgentsToSession, onUpdateSessionMode, onClearSessionHistory, notes, presenter
}) => {
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
  }, [activeSession?.id]);

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
  
  const handleSelectSuggestion = (prompt: string) => {
    if (!activeSession) return;
    onSendMessage(activeSession.id, prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      onSendMessage(activeSession.id, chatInput);
      setChatInput('');
      setShowCommands(false);
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
                                        onUpdateSessionMode(activeSession.id, mode.id);
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
              if (msg.role === 'tool' && msg.structuredContent) return <ToolResultCard key={msg.id} message={msg} onSelectNote={onSelectNote} />;
              return (
                <div key={msg.id} className="flex items-start gap-3 max-w-4xl mx-auto">
                  {agent ? <AgentAvatar agent={agent} /> : <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /></div>}
                  <div className="flex flex-col items-start">
                    <div className="p-3 rounded-lg max-w-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none">
                      {msg.persona && <p className="text-xs font-bold mb-1 text-indigo-600 dark:text-indigo-400">{msg.persona}</p>}
                      
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
                              <button key={note.id} onClick={() => onSelectNote(note.id)} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-xs text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                                  {note.title}
                              </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
          })
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleChatSubmit} className="max-w-4xl mx-auto relative">
          {showCommands && (
            <CommandPalette
                commands={filteredCommands}
                query={commandQuery}
                selectedIndex={selectedCommandIndex}
                onSelect={handleSelectCommand}
                onHover={setSelectedCommandIndex}
                onCreateCommand={onOpenCreateCommandModal}
            />
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeSession.name}...`}
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
            onAddAgents={(agentIds) => onAddAgentsToSession(activeSession.id, agentIds)}
        />
       <ConfirmationModal
            isOpen={isClearConfirmOpen}
            onClose={() => setIsClearConfirmOpen(false)}
            onConfirm={() => {
                onClearSessionHistory(activeSession.id);
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


// --- Main ChatView Component ---
const ChatView: React.FC<ChatViewProps> = (props) => {
  const [isAgentManagerOpen, setIsAgentManagerOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const SidebarButton: React.FC<{onClick?: () => void; title: string; children: React.ReactNode; isCollapsed: boolean; isFullWidth?: boolean}> = 
  ({ onClick, title, children, isCollapsed, isFullWidth = false }) => {
      const button = (
        <button 
          onClick={onClick} 
          title={isCollapsed ? title : undefined} 
          className={`flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50 overflow-hidden ${isCollapsed ? 'w-10 h-10 justify-center' : 'p-2'} ${isFullWidth ? 'w-full' : ''}`}
        >
          {children}
        </button>
      );

      if (isCollapsed) {
          return (
              <HoverPopup
                  trigger={button}
                  content={<div className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg">{title}</div>}
                  popupClassName="absolute left-full ml-2"
              />
          );
      }
      return button;
  };


  return (
    <div className="h-full flex">
      {/* Session List (Left Side) */}
      <div className={`h-full flex flex-col bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64 md:w-80'}`}>
        <div className={`flex-shrink-0 border-b border-slate-200 dark:border-slate-700 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <button onClick={() => setIsNewChatOpen(true)} className={`w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-500 overflow-hidden transition-all`}>
            <PlusIcon className="w-5 h-5 flex-shrink-0"/>
            <span className={`whitespace-nowrap transition-all duration-200 ${isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-2'}`}>New Chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            <ul className="space-y-1">
                {props.sessions.map(session => {
                    const participants = props.agents.filter(a => session.participantIds.includes(a.id));
                    if (participants.length === 0) return null;

                    const lastMessage = [...session.history].reverse().find(m => m.role !== 'system');
                    const lastMessageContent = lastMessage?.content || 'No messages yet';

                    return (
                        <li key={session.id}>
                            <button onClick={() => props.onSetActiveSession(session.id)} className={`w-full text-left p-2 rounded-md flex items-center group transition-colors ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} ${props.activeSession?.id === session.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                
                                {/* AVATAR LOGIC */}
                                {isSidebarCollapsed ? (
                                    participants.length > 1 ? (
                                        <CompositeAvatar agents={participants} />
                                    ) : (
                                        <AgentAvatar agent={participants[0]} size="md" />
                                    )
                                ) : (
                                     participants.length > 1 ? (
                                        <ParticipantAvatarStack agents={participants} size="sm" />
                                     ) : (
                                        <AgentAvatar agent={participants[0]} size="md" />
                                     )
                                )}
                                
                                {/* TEXT & DELETE LOGIC (Expanded only) */}
                                {!isSidebarCollapsed && (
                                  <>
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-sm font-semibold truncate ${props.activeSession?.id === session.id ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>{session.name}</p>
                                        <p className={`text-xs truncate ${props.activeSession?.id === session.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{lastMessageContent.replace(/\s+/g, ' ')}</p>
                                    </div>
                                    <button onClick={(e) => {e.stopPropagation(); props.onDeleteSession(session.id)}} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded-full flex-shrink-0 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                                  </>
                                )}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
        <div className={`p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 flex ${isSidebarCollapsed ? 'flex-col' : 'flex-row'} items-center gap-2`}>
          <SidebarButton onClick={() => setIsAgentManagerOpen(true)} title="Manage Agents" isCollapsed={isSidebarCollapsed} isFullWidth={!isSidebarCollapsed}>
            <Cog6ToothIcon className="w-5 h-5 flex-shrink-0"/>
            <span className={`flex-1 text-left whitespace-nowrap transition-all duration-200 ${isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100 ml-2'}`}>Manage Agents</span>
          </SidebarButton>
          <SidebarButton onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} isCollapsed={isSidebarCollapsed}>
             {isSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5"/> : <ChevronDoubleLeftIcon className="w-5 h-5"/>}
          </SidebarButton>
        </div>
      </div>

      {/* Main Chat Panel (Right Side) */}
      <div className="flex-1 h-full min-w-0">
        <ChatPanel 
            activeSession={props.activeSession}
            agents={props.agents}
            notes={props.notes}
            presenter={props.presenter}
            onSendMessage={props.onSendMessage}
            onSelectNote={props.onSelectNote}
            commands={props.commands}
            onOpenCreateCommandModal={props.onOpenCreateCommandModal}
            onAddAgentsToSession={props.onAddAgentsToSession}
            onUpdateSessionMode={props.onUpdateSessionMode}
            onClearSessionHistory={props.onClearSessionHistory}
        />
      </div>

      {/* Modals */}
      <AgentManagerModal 
        isOpen={isAgentManagerOpen} 
        onClose={() => setIsAgentManagerOpen(false)}
        agents={props.agents}
        presenter={props.presenter}
        onUpdateAgent={props.onUpdateAgent}
        onDeleteAgent={props.onDeleteAgent}
      />
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        agents={props.agents}
        onCreateSession={props.onCreateSession}
      />
    </div>
  );
};

// --- Agent Manager Modal ---
interface AgentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AIAgent[];
  presenter: Presenter;
  onUpdateAgent: (agentData: AIAgent) => void;
  onDeleteAgent: (agentId: string) => void;
}

const AgentManagerModal: React.FC<AgentManagerModalProps> = ({ isOpen, onClose, agents, presenter, onUpdateAgent, onDeleteAgent }) => {
    const [view, setView] = useState<'list' | 'creator' | 'editor'>('list');
    const [editingAgent, setEditingAgent] = useState<AIAgent | Omit<AIAgent, 'id' | 'createdAt' | 'isCustom'> | null>(null);

    const handleStartNew = () => {
        setView('creator');
    };
    const handleStartEdit = (agent: AIAgent) => {
        if (agent.isCustom) {
          setEditingAgent(agent);
          setView('editor');
        } else {
          alert("The default AI Companion cannot be edited.");
        }
    };

    const handleClose = () => {
        setView('list');
        setEditingAgent(null);
        onClose();
    };
    
    const handleBackToList = () => {
        setView('list');
        setEditingAgent(null);
    }
    
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
                {view === 'list' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Manage Agents</h2>
                            <button onClick={handleStartNew} className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"><PlusIcon className="w-4 h-4"/>New Agent</button>
                        </div>
                        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {agents.map(agent => (
                                <li key={agent.id} className="p-2 flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <AgentAvatar agent={agent}/>
                                    <div className="flex-1">
                                        <p className="font-semibold">{agent.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{agent.description}</p>
                                    </div>
                                    <button onClick={() => handleStartEdit(agent)} disabled={!agent.isCustom} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => onDeleteAgent(agent.id)} disabled={!agent.isCustom} className="p-2 text-slate-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4"/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {view === 'creator' && <AgentCreatorView presenter={presenter} onFinish={handleBackToList} />}
                {view === 'editor' && <AgentEditorForm agent={editingAgent as AIAgent} onSave={onUpdateAgent} onFinish={handleBackToList} />}
            </div>
        </Modal>
    )
};


// --- Agent Creator (Conversational) ---
const AgentCreatorView: React.FC<{ presenter: Presenter; onFinish: () => void; }> = ({ presenter, onFinish }) => {
    const [history, setHistory] = useState<ChatMessage[]>([{
        id: '0', role: 'model', persona: 'Agent Architect',
        content: "Hello! I'm the Agent Architect. I can help you create a new AI agent. To start, what should we name it?"
    }]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsThinking(true);

        try {
            const { modelMessage, toolResponseMessage } = await presenter.handleAgentCreatorChat(newHistory);
            
            let finalHistory = [...newHistory, modelMessage];
            if (toolResponseMessage) {
                finalHistory.push(toolResponseMessage);
            }
            setHistory(finalHistory);

        } catch (error) {
            console.error("Agent creator chat failed:", error);
            setHistory(h => [...h, {id: crypto.randomUUID(), role: 'model', content: "Sorry, an error occurred."}]);
        } finally {
            setIsThinking(false);
        }
    }

    const isDone = history.some(m => m.role === 'tool');

    return (
        <div className="flex flex-col h-[70vh] max-h-[700px]">
            <h2 className="text-xl font-bold p-6 pb-2">Create Agent with AI</h2>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 max-w-md ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                       <div className={`p-2.5 rounded-lg text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 rounded-bl-none'}`}>{msg.content}</div>
                    </div>
                ))}
                 {isThinking && (
                     <div className="flex items-start gap-3 max-w-md mr-auto">
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 rounded-bl-none">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                            </div>
                        </div>
                    </div>
                 )}
                <div ref={endOfMessagesRef}></div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                {isDone ? (
                     <button onClick={onFinish} className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">Finish</button>
                ) : (
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} disabled={isThinking} placeholder="Your response..." className="flex-1 w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button type="submit" disabled={isThinking || !input.trim()} className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600"><PaperAirplaneIcon className="w-5 h-5" /></button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- Agent Editor Form (for editing existing agents) ---
const AgentEditorForm: React.FC<{ agent: AIAgent, onSave: (agent: AIAgent) => void, onFinish: () => void }> = ({ agent, onSave, onFinish }) => {
    const [editingAgent, setEditingAgent] = useState(agent);

    const handleSave = () => {
        onSave(editingAgent);
        onFinish();
    }
    
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Edit Agent</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input type="text" value={editingAgent.name} onChange={e => setEditingAgent({...editingAgent, name: e.target.value})} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 border border-slate-300 dark:border-slate-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <input type="text" value={editingAgent.description} onChange={e => setEditingAgent({...editingAgent, description: e.target.value})} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 border border-slate-300 dark:border-slate-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">System Instructions</label>
                    <textarea value={editingAgent.systemInstruction} onChange={e => setEditingAgent({...editingAgent, systemInstruction: e.target.value})} rows={5} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 border border-slate-300 dark:border-slate-600"/>
                </div>
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Icon</label>
                        <div className="flex flex-wrap gap-2">{Object.keys(agentIcons).map(iconName => (
                            <button key={iconName} onClick={() => setEditingAgent({...editingAgent, icon: iconName})} className={`p-1 rounded-full ${editingAgent.icon === iconName ? 'ring-2 ring-indigo-500' : ''}`}><AgentAvatar agent={{...editingAgent, icon: iconName} as AIAgent} /></button>
                        ))}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <div className="flex flex-wrap gap-2">{Object.keys(iconColors).map(colorName => (
                            <button key={colorName} onClick={() => setEditingAgent({...editingAgent, color: colorName})} className={`w-8 h-8 rounded-full ${iconColors[colorName].bg} ${editingAgent.color === colorName ? 'ring-2 ring-indigo-500' : ''}`}/>
                        ))}</div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <button onClick={onFinish} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Save</button>
            </div>
        </div>
    )
};

// --- New Chat Modal ---
interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AIAgent[];
  onCreateSession: (participantIds: string[], discussionMode: DiscussionMode) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, agents, onCreateSession }) => {
    const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
    const [discussionMode, setDiscussionMode] = useState<DiscussionMode>('concurrent');

    useEffect(() => {
        if(isOpen) {
            setSelectedAgentIds(new Set());
            setDiscussionMode('concurrent');
        }
    }, [isOpen]);

    const toggleSelection = (agentId: string) => {
        setSelectedAgentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(agentId)) {
                newSet.delete(agentId);
            } else {
                newSet.add(agentId);
            }
            return newSet;
        });
    };

    const handleStartChat = () => {
        if (selectedAgentIds.size > 0) {
            onCreateSession(Array.from(selectedAgentIds), discussionMode);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 transition-all duration-300">
                <h2 className="text-xl font-bold mb-4">Start New Chat</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select one or more AI agents to begin a conversation.</p>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {agents.map(agent => (
                        <button key={agent.id} onClick={() => toggleSelection(agent.id)} className={`w-full text-left p-2 flex items-center gap-3 rounded-lg border-2 transition-colors ${selectedAgentIds.has(agent.id) ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                            <AgentAvatar agent={agent}/>
                            <div className="flex-1">
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{agent.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
                
                <div className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 transition-opacity duration-300 ${selectedAgentIds.size > 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <h3 className="text-base font-semibold mb-3">Discussion Mode</h3>
                    <div className="space-y-2">
                        {discussionModes.map(mode => (
                            <button key={mode.id} onClick={() => setDiscussionMode(mode.id)} className={`w-full text-left p-2 flex items-start gap-3 rounded-lg border-2 transition-colors ${discussionMode === mode.id ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                <mode.icon className="w-5 h-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0"/>
                                <div>
                                    <p className="font-semibold">{mode.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{mode.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={handleStartChat} disabled={selectedAgentIds.size === 0} className="px-4 py-2 font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                        Start Chat
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// --- Add Agents Modal ---
interface AddAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AIAgent[];
  onAddAgents: (agentIds: string[]) => void;
}
const AddAgentsModal: React.FC<AddAgentsModalProps> = ({ isOpen, onClose, agents, onAddAgents }) => {
    const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if(isOpen) setSelectedAgentIds(new Set());
    }, [isOpen]);

    const toggleSelection = (agentId: string) => {
        setSelectedAgentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(agentId)) newSet.delete(agentId);
            else newSet.add(agentId);
            return newSet;
        });
    };

    const handleAdd = () => {
        if (selectedAgentIds.size > 0) {
            onAddAgents(Array.from(selectedAgentIds));
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold mb-4">Add Agents to Chat</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select agents to add to the current conversation.</p>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {agents.map(agent => (
                        <button key={agent.id} onClick={() => toggleSelection(agent.id)} className={`w-full text-left p-2 flex items-center gap-3 rounded-lg border-2 transition-colors ${selectedAgentIds.has(agent.id) ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                            <AgentAvatar agent={agent}/>
                            <div className="flex-1">
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{agent.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="flex justify-end pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={handleAdd} disabled={selectedAgentIds.size === 0} className="px-4 py-2 font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                        Add to Chat
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChatView;
