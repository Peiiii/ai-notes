
import React, { useState, useEffect } from 'react';
import { AIAgent, DiscussionMode } from '../../types';
import Modal from '../ui/Modal';
import { AgentAvatar } from './ChatUIComponents';
import SparklesIcon from '../icons/SparklesIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import SpeakerWaveIcon from '../icons/SpeakerWaveIcon';

// --- Discussion Modes ---
const discussionModes: { id: DiscussionMode; name: string; description: string; icon: React.FC<any> }[] = [
    { id: 'concurrent', name: 'Concurrent', description: 'All agents respond at the same time. Best for quick brainstorming.', icon: SparklesIcon },
    { id: 'turn_based', name: 'Turn-Based', description: 'Agents respond one after another, seeing previous replies.', icon: ArrowPathIcon },
    { id: 'moderated', name: 'Moderated', description: 'A moderator AI directs the conversation, choosing who speaks.', icon: SpeakerWaveIcon },
];

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

export default NewChatModal;
