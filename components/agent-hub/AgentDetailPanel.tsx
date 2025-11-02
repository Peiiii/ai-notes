import React from 'react';
import { AIAgent } from '../../types';
import { AgentAvatar } from '../chat/ChatUIComponents';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';

interface AgentDetailPanelProps {
  agent: AIAgent;
  onStartEdit: () => void;
  onDelete: (agentId: string) => void;
}

const AgentDetailPanel: React.FC<AgentDetailPanelProps> = ({ agent, onStartEdit, onDelete }) => {
  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold">Agent Details</h2>
            <div className="flex items-center gap-1">
                {agent.isCustom && (
                     <button onClick={() => onDelete(agent.id)} title="Delete Agent" className="p-2 rounded-full text-slate-500 hover:text-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                )}
                <button 
                  onClick={onStartEdit} 
                  disabled={!agent.isCustom} 
                  className="px-3 py-1.5 text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <PencilIcon className="w-4 h-4"/>
                  Edit with AI
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <AgentAvatar agent={agent} size="lg" />
                <div className="flex-1">
                    <h3 className="text-2xl font-bold">{agent.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{agent.description}</p>
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">System Instructions</h4>
                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                    {agent.systemInstruction}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AgentDetailPanel;