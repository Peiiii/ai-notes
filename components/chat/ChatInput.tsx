import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePresenter } from '../../presenter';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { useCommandStore } from '../../stores/commandStore';
import { AIAgent } from '../../types';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import CommandPalette from './CommandPalette';
import { AgentMentionPopup } from './ChatUIComponents';

const ChatInput: React.FC = () => {
    const presenter = usePresenter();
    const { activeSessionId, sessions } = useChatStore();
    const agents = useAgentStore(state => state.agents);
    const commands = useCommandStore(state => state.getCommands());
    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || null, [sessions, activeSessionId]);
    
    const [chatInput, setChatInput] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

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
        setChatInput('');
        setMentionPopup(null);
    }, [activeSessionId]);
    
    useEffect(() => {
        const textarea = inputRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto'; // reset so shrinking works after submit
        if (chatInput.length > 0) {
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [chatInput]);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    const handleChatSubmit = () => {
        if (!activeSession) return;
        if (chatInput.trim() && !isChatting) {
            presenter.handleSendMessage(activeSession.id, chatInput);
            setChatInput('');
            setShowCommands(false);
            setMentionPopup(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        
        if (showCommands) {
            const commandCount = filteredCommands.length + (filteredCommands.length === 0 && commandQuery ? 1 : 0);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if(commandCount > 0) setSelectedCommandIndex((selectedCommandIndex + 1) % commandCount);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if(commandCount > 0) setSelectedCommandIndex((selectedCommandIndex - 1 + commandCount) % commandCount);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands.length > 0 && selectedCommandIndex < filteredCommands.length) {
                    handleSelectCommand(filteredCommands[selectedCommandIndex].name);
                } else if (filteredCommands.length === 0 && commandQuery) {
                    presenter.handleOpenCreateCommandModal(commandQuery);
                    setChatInput('');
                    setShowCommands(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommands(false);
            }
            return;
        }
        
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit();
        }
    };
    
    if (!activeSession) return null;

    return (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }} className="max-w-4xl mx-auto relative">
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
                <div className="flex gap-2 items-start">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={chatInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${activeSession.name}... (Shift + Enter for newline)`}
                        disabled={isChatting}
                        className="flex-1 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-[150px]"
                    />
                    <button
                        type="submit"
                        disabled={isChatting || !chatInput.trim()}
                        className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
