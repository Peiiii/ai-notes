import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePresenter } from '../../presenter';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { DiscussionMode } from '../../types';
import { ParticipantAvatarStack } from './ChatUIComponents';
import PencilIcon from '../icons/PencilIcon';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';
import UserPlusIcon from '../icons/UserPlusIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import SpeakerWaveIcon from '../icons/SpeakerWaveIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import SparklesIcon from '../icons/SparklesIcon';

const discussionModes: { id: DiscussionMode; name: string; description: string; icon: React.FC<any> }[] = [
    { id: 'concurrent', name: 'Concurrent', description: 'All agents respond at the same time.', icon: SparklesIcon },
    { id: 'turn_based', name: 'Turn-Based', description: 'Agents respond one after another.', icon: ArrowPathIcon },
    { id: 'moderated', name: 'Moderated', description: 'A moderator directs the conversation.', icon: SpeakerWaveIcon },
];

const ChatHeader: React.FC = () => {
    const presenter = usePresenter();
    const { activeSessionId, sessions } = useChatStore();
    const agents = useAgentStore(state => state.agents);
    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || null, [sessions, activeSessionId]);
    
    const [isModeDropdownOpen, setModeDropdownOpen] = useState(false);
    const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
    const modeDropdownRef = useRef<HTMLDivElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
                setModeDropdownOpen(false);
            }
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setActionsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [modeDropdownRef, actionsMenuRef]);

    if (!activeSession) return null;

    const participants = agents.filter(a => activeSession.participantIds.includes(a.id));
    const currentMode = discussionModes.find(m => m.id === activeSession.discussionMode) || discussionModes[0];
    const CurrentModeIcon = currentMode.icon;

    return (
         <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <ParticipantAvatarStack agents={participants} size="lg"/>
                <div className="flex-1 min-w-0 group/title">
                    <button
                        onClick={presenter.handleOpenRenameChatModal}
                        className="flex items-center gap-2 rounded-md -m-1 p-1"
                    >
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                            {activeSession.name}
                        </h1>
                        <PencilIcon className="w-4 h-4 text-slate-500 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate ml-1">
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
                <button 
                    onClick={presenter.handleOpenAddAgentsModal} 
                    title="Manage participants"
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex-shrink-0"
                >
                    <UserPlusIcon className="w-5 h-5"/>
                </button>
                <div className="relative" ref={actionsMenuRef}>
                    <button
                        onClick={() => setActionsMenuOpen(prev => !prev)}
                        title="More actions"
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    >
                        <EllipsisVerticalIcon className="w-5 h-5"/>
                    </button>
                    {isActionsMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 p-1 animate-in fade-in zoom-in-95">
                            <button
                                onClick={() => {
                                    presenter.handleOpenClearChatConfirmModal();
                                    setActionsMenuOpen(false);
                                }}
                                className="w-full text-left p-2 flex items-center gap-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
                            >
                                <ArrowPathIcon className="w-4 h-4"/>
                                Clear History
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
