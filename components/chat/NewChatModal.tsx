



import React, { useState, useEffect } from 'react';
import { AIAgent, DiscussionMode } from '../../types';
import Modal from '../ui/Modal';
import { AgentAvatar } from './ChatUIComponents';
import SparklesIcon from '../icons/SparklesIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import SpeakerWaveIcon from '../icons/SpeakerWaveIcon';
import MagnifyingGlassIcon from '../icons/MagnifyingGlassIcon';
import XMarkIcon from '../icons/XMarkIcon';

// --- Discussion Modes ---
const discussionModes: { id: DiscussionMode; name: string; description: string; icon: React.FC<any> }[] = [
    { id: 'concurrent', name: 'Concurrent', description: 'All agents respond at the same time.', icon: SparklesIcon },
    { id: 'turn_based', name: 'Turn-Based', description: 'Agents respond one after another.', icon: ArrowPathIcon },
    { id: 'moderated', name: 'Moderated', description: 'A moderator directs the conversation.', icon: SpeakerWaveIcon },
];

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AIAgent[];
  onCreateSession: (participantIds: string[], discussionMode: DiscussionMode, name?: string) => void;
  onBrowsePresets: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, agents, onCreateSession, onBrowsePresets }) => {
    const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
    const [discussionMode, setDiscussionMode] = useState<DiscussionMode>('concurrent');
    const [searchQuery, setSearchQuery] = useState('');
    const [chatName, setChatName] = useState('');

    useEffect(() => {
        if(isOpen) {
            setSelectedAgentIds(new Set());
            setDiscussionMode('concurrent');
            setSearchQuery('');
            setChatName('');
        }
    }, [isOpen]);
    
    const filteredAgents = agents.filter(agent => 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const selectedAgents = agents.filter(agent => selectedAgentIds.has(agent.id));

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
            onCreateSession(
                Array.from(selectedAgentIds), 
                discussionMode, 
                chatName.trim() ? chatName.trim() : undefined
            );
            onClose();
        }
    };
    
    const handleBrowsePresets = () => {
        onBrowsePresets();
        onClose(); // Close this modal
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl p-6 flex flex-col h-[80vh] max-h-[700px]">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Start New Chat</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Build a custom chat or start from a preset.</p>
                    </div>
                    <button onClick={handleBrowsePresets} className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 hover:underline">
                        Browse Presets
                    </button>
                </div>

                <div className="flex gap-6 flex-1 min-h-0">
                    {/* Left Column: Agent List */}
                    <div className="w-2/5 flex flex-col border-r border-slate-200 dark:border-slate-700 pr-6">
                        <div className="relative mb-3 flex-shrink-0">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="search" 
                                placeholder="Search agents..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto -mr-4 pr-3">
                            {filteredAgents.map(agent => (
                                <button key={agent.id} onClick={() => toggleSelection(agent.id)} className={`w-full text-left p-2 flex items-center gap-3 rounded-lg border-2 transition-colors ${selectedAgentIds.has(agent.id) ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                    <AgentAvatar agent={agent}/>
                                    <div className="flex-1">
                                        <p className="font-semibold">{agent.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{agent.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Configuration */}
                    <div className="w-3/5 flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-base font-semibold mb-2">Selected Agents ({selectedAgents.length})</h3>
                            <div className="min-h-[52px] p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex flex-wrap gap-2">
                                {selectedAgents.length > 0 ? selectedAgents.map(agent => (
                                    <div key={agent.id} className="bg-white dark:bg-slate-700 rounded-full flex items-center gap-1.5 p-1 pr-2 shadow-sm animate-in fade-in zoom-in-95">
                                        <AgentAvatar agent={agent} size="sm" />
                                        <span className="text-sm font-medium">{agent.name}</span>
                                        <button onClick={() => toggleSelection(agent.id)} className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400">
                                            <XMarkIcon className="w-3 h-3"/>
                                        </button>
                                    </div>
                                )) : <p className="text-sm text-slate-500 dark:text-slate-400 p-1">Select agents from the left panel.</p>}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="chat-name" className="block text-base font-semibold mb-2">Chat Name (Optional)</label>
                            <input 
                                id="chat-name"
                                type="text"
                                value={chatName}
                                onChange={(e) => setChatName(e.target.value)}
                                placeholder={selectedAgents.length > 0 ? 'e.g., Brainstorming Session' : 'Select agents first'}
                                disabled={selectedAgents.length === 0}
                                className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            />
                        </div>

                        <div className={`transition-opacity duration-300 flex-1 flex flex-col min-h-0 ${selectedAgentIds.size > 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <h3 className="text-base font-semibold mb-2">Discussion Mode</h3>
                            <div className="space-y-2 overflow-y-auto -mr-2 pr-2">
                                {discussionModes.map(mode => (
                                    <button key={mode.id} onClick={() => setDiscussionMode(mode.id)} className={`w-full text-left p-2 flex items-start gap-3 rounded-lg border-2 transition-colors ${discussionMode === mode.id ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                        <mode.icon className="w-5 h-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0"/>
                                        <div>
                                            <p className="font-semibold text-sm">{mode.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{mode.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 mr-2">
                        Cancel
                    </button>
                    <button onClick={handleStartChat} disabled={selectedAgentIds.size === 0} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800">
                        Start Chat
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default NewChatModal;
