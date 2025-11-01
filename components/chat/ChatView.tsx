

import React, { useState, useMemo } from 'react';
import { AIAgent, ChatSession, DiscussionMode } from '../../types';
import { usePresenter } from '../../presenter';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { useNotesStore } from '../../stores/notesStore';
import { useCommandStore } from '../../stores/commandStore';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import Cog6ToothIcon from '../icons/Cog6ToothIcon';
import ChevronDoubleLeftIcon from '../icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from '../icons/ChevronDoubleRightIcon';
import HoverPopup from '../ui/HoverPopup';
import AgentManagerModal from './AgentManagerModal';
import NewChatModal from './NewChatModal';
import ChatPanel from './ChatPanel';
import { AgentAvatar, CompositeAvatar, ParticipantAvatarStack } from './ChatUIComponents';

// --- Main ChatView Component ---
const ChatView: React.FC = () => {
  const presenter = usePresenter();
  const { sessions, activeSessionId } = useChatStore();
  const agents = useAgentStore(state => state.agents);
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || null, [sessions, activeSessionId]);

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
                  popupClassName="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-30"
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
                {sessions.map(session => {
                    const participants = agents.filter(a => session.participantIds.includes(a.id));
                    if (participants.length === 0) return null;

                    const lastMessage = [...session.history].reverse().find(m => m.role !== 'system');
                    const lastMessageContent = lastMessage?.content || 'No messages yet';

                    return (
                        <li key={session.id}>
                            <button onClick={() => presenter.handleSetActiveChatSession(session.id)} className={`w-full text-left p-2 rounded-md flex items-center group transition-colors ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} ${activeSession?.id === session.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                
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
                                        <p className={`text-sm font-semibold truncate ${activeSession?.id === session.id ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>{session.name}</p>
                                        <p className={`text-xs truncate ${activeSession?.id === session.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{lastMessageContent.replace(/\s+/g, ' ')}</p>
                                    </div>
                                    <button onClick={(e) => {e.stopPropagation(); presenter.handleDeleteChatSession(session.id)}} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded-full flex-shrink-0 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
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
        <ChatPanel />
      </div>

      {/* Modals */}
      <AgentManagerModal 
        isOpen={isAgentManagerOpen} 
        onClose={() => setIsAgentManagerOpen(false)}
        agents={agents}
        presenter={presenter}
        onUpdateAgent={presenter.handleUpdateAgent}
        onDeleteAgent={presenter.handleDeleteAgent}
      />
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        agents={agents}
        onCreateSession={presenter.handleCreateChatSession}
      />
    </div>
  );
};


export default ChatView;
