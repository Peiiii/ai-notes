
import React, { useState, useMemo, useEffect } from 'react';
import { Presenter } from '../../presenter';
import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import { AIAgent } from '../../types';
import Modal from '../ui/Modal';
import { AgentAvatar } from '../chat/ChatUIComponents';
import AgentDetailPanel from './AgentDetailPanel';
import AgentCreatorView from './AgentCreatorView';
import AgentEditorView from './AgentEditorView';
import PlusIcon from '../icons/PlusIcon';
import MagnifyingGlassIcon from '../icons/MagnifyingGlassIcon';
import CpuChipIcon from '../icons/CpuChipIcon';

type ViewMode = 'placeholder' | 'detail' | 'create' | 'edit';

interface AgentHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  presenter: Presenter;
}

const AgentHubModal: React.FC<AgentHubModalProps> = ({ isOpen, onClose, presenter }) => {
    const agents = useAgentStore(state => state.agents);
    const sortedAgents = useMemo(() => [...agents].sort((a, b) => a.createdAt - b.createdAt), [agents]);
    const agentToEditId = useAppStore(state => state.agentToEditId);

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('placeholder');
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        // This effect synchronizes the modal's view with the application state when it opens.
        if (isOpen) {
            if (agentToEditId && sortedAgents.some(a => a.id === agentToEditId)) {
                // If an agent ID is passed for editing, switch to edit mode.
                setSelectedAgentId(agentToEditId);
                setViewMode('edit');
            } else {
                // Otherwise, show the default placeholder view.
                setViewMode('placeholder');
                setSelectedAgentId(null);
            }
        }
    }, [isOpen, agentToEditId, sortedAgents]);

    const filteredAgents = useMemo(() => sortedAgents.filter(agent => 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [sortedAgents, searchQuery]);
    
    const selectedAgent = useMemo(() => agents.find(a => a.id === selectedAgentId) || null, [agents, selectedAgentId]);

    const handleCreateNew = () => {
        setSelectedAgentId(null);
        setViewMode('create');
    };

    const handleSelectAgent = (agentId: string) => {
        setViewMode('detail');
        setSelectedAgentId(agentId);
    };

    const handleCreationSuccess = (newAgentId: string) => {
        setViewMode('detail');
        setSelectedAgentId(newAgentId);
    };

    const handleEditSuccess = () => {
        setViewMode('detail');
    };
    
    const handleDelete = (agentId: string) => {
        presenter.handleDeleteAgent(agentId);
        if (selectedAgentId === agentId) {
            setSelectedAgentId(null);
            setViewMode('placeholder');
        }
    }

    const renderRightPanel = () => {
        switch (viewMode) {
            case 'create':
                return <AgentCreatorView presenter={presenter} onCreationSuccess={handleCreationSuccess} onCancel={() => setViewMode('placeholder')} />;
            case 'edit':
                if (selectedAgent) {
                    return <AgentEditorView presenter={presenter} agent={selectedAgent} onEditSuccess={handleEditSuccess} onCancel={() => setViewMode('detail')} />;
                }
                return null;
            case 'detail':
                if (selectedAgent) {
                    return <AgentDetailPanel agent={selectedAgent} onStartEdit={() => setViewMode('edit')} onDelete={handleDelete} />;
                }
                return null;
            case 'placeholder':
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-8">
                        <CpuChipIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />
                        <h3 className="text-xl font-semibold">Agent Hub</h3>
                        <p className="max-w-xs mt-1">Select an agent to view their details, or create a new one.</p>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl flex h-[80vh] max-h-[700px]" style={{width: '56rem'}}>
                {/* Left Column: Agent Roster */}
                <div className="w-1/3 flex flex-col border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                         <div className="relative mb-3">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="search" 
                                placeholder="Search agents..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button onClick={handleCreateNew} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                            <PlusIcon className="w-5 h-5" />
                            Create New Agent
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <ul className="space-y-1">
                            {filteredAgents.map(agent => (
                                <li key={agent.id}>
                                    <button
                                        onClick={() => handleSelectAgent(agent.id)}
                                        className={`w-full text-left p-2 flex items-center gap-3 rounded-lg transition-colors ${selectedAgentId === agent.id && (viewMode === 'detail' || viewMode === 'edit') ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <AgentAvatar agent={agent} />
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`font-semibold text-sm ${selectedAgentId === agent.id ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>{agent.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{agent.description}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column: Detail Panel */}
                <div className="w-2/3 flex flex-col min-w-0">
                    {renderRightPanel()}
                </div>
            </div>
        </Modal>
    );
};

export default AgentHubModal;
