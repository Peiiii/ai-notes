
import React, { useState, useEffect } from 'react';
import { AIAgent } from '../../types';
import Modal from '../ui/Modal';
import { AgentAvatar } from './ChatUIComponents';

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

export default AddAgentsModal;
