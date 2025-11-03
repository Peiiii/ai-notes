import React, { useState, useEffect, useMemo } from 'react';
import { AIAgent } from '../../types';
import Modal from '../ui/Modal';
import { AgentAvatar } from './ChatUIComponents';
import { useAgentStore } from '../../stores/agentStore';
import MagnifyingGlassIcon from '../icons/MagnifyingGlassIcon';
import XMarkIcon from '../icons/XMarkIcon';

interface AddAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParticipants: AIAgent[];
  onAddAgents: (agentIds: string[]) => void;
}
const AddAgentsModal: React.FC<AddAgentsModalProps> = ({ isOpen, onClose, currentParticipants, onAddAgents }) => {
    const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const allAgents = useAgentStore(state => state.agents);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedAgentIds(new Set());
            setSearchQuery('');
        }
    }, [isOpen]);

    const participantIds = useMemo(() => new Set(currentParticipants.map(p => p.id)), [currentParticipants]);
    
    const availableAgents = useMemo(() => 
        allAgents.filter(agent => 
            !participantIds.has(agent.id) && 
            (agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ), 
    [allAgents, participantIds, searchQuery]);

    const agentsToAdd = useMemo(() => 
        allAgents.filter(agent => selectedAgentIds.has(agent.id)), 
    [allAgents, selectedAgentIds]);

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

    const handleAdd = () => {
        if (selectedAgentIds.size > 0) {
            onAddAgents(Array.from(selectedAgentIds));
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl p-6 flex flex-col h-[80vh] max-h-[700px]">
                <h2 className="text-xl font-bold mb-4 flex-shrink-0">Manage Participants</h2>

                <div className="flex gap-6 flex-1 min-h-0">
                    {/* Left Column: Available Agents */}
                    <div className="w-1/2 flex flex-col">
                        <div className="relative mb-3 flex-shrink-0">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search agents to add..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-scroll pr-2 -mr-4">
                            {availableAgents.length > 0 ? availableAgents.map(agent => (
                                <button key={agent.id} onClick={() => toggleSelection(agent.id)} className={`w-full text-left p-2 flex items-center gap-3 rounded-lg border-2 transition-colors ${selectedAgentIds.has(agent.id) ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                    <AgentAvatar agent={agent} />
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{agent.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{agent.description}</p>
                                    </div>
                                </button>
                            )) : <p className="text-sm text-slate-500 dark:text-slate-400 p-2">No other agents to add.</p>}
                        </div>
                    </div>

                    {/* Right Column: Current & Adding */}
                    <div className="w-1/2 flex flex-col border-l border-slate-200 dark:border-slate-700 pl-6">
                        <div className="flex-shrink-0">
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Adding to Chat ({agentsToAdd.length})</h3>
                            <div className="min-h-[52px] max-h-32 overflow-y-auto p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex flex-wrap gap-2 mb-4">
                                {agentsToAdd.length > 0 ? agentsToAdd.map(agent => (
                                    <div key={agent.id} className="bg-white dark:bg-slate-700 rounded-full flex items-center gap-1.5 p-1 pr-2 shadow-sm animate-in fade-in zoom-in-95">
                                        <AgentAvatar agent={agent} size="sm" />
                                        <span className="text-sm font-medium">{agent.name}</span>
                                        <button onClick={() => toggleSelection(agent.id)} className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                )) : <p className="text-sm text-slate-500 dark:text-slate-400 p-1">Select agents from the left.</p>}
                            </div>
                        </div>
                        <div className="flex flex-col flex-1 min-h-0">
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Already in Chat ({currentParticipants.length})</h3>
                            <div className="space-y-2 flex-1 overflow-y-scroll pr-2 -mr-4">
                                {currentParticipants.map(agent => (
                                    <div key={agent.id} className="p-2 flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <AgentAvatar agent={agent} />
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">{agent.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{agent.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                        Close
                    </button>
                    <button onClick={handleAdd} disabled={selectedAgentIds.size === 0} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800">
                        {`Add ${selectedAgentIds.size > 0 ? selectedAgentIds.size : ''} to Chat`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddAgentsModal;
