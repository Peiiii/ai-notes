import React from 'react';
import { AIAgent } from '../../types';
import { AgentAvatar } from './ChatUIComponents';
import CpuChipIcon from '../icons/CpuChipIcon';
import PencilIcon from '../icons/PencilIcon';

const gradientMap: Record<string, string> = {
    slate: 'from-slate-500 to-slate-700',
    indigo: 'from-indigo-500 to-purple-600',
    sky: 'from-sky-400 to-blue-500',
    purple: 'from-purple-500 to-fuchsia-600',
    amber: 'from-amber-400 to-orange-500',
    rose: 'from-rose-400 to-red-500',
    green: 'from-green-400 to-emerald-500',
};

interface AgentProfileCardProps {
    agent: AIAgent;
    onEdit?: (agentId: string) => void;
}

const AgentProfileCard: React.FC<AgentProfileCardProps> = ({ agent, onEdit }) => {
    const gradient = gradientMap[agent.color] || gradientMap.indigo;

    return (
        <div className="w-72 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Container for header and avatar positioning */}
            <div className="relative">
                <div className={`h-20 bg-gradient-to-br ${gradient}`}></div>
                {/* Position avatar to overlap the boundary */}
                <div className="absolute top-20 left-4 transform -translate-y-1/2">
                    <div className="p-1 bg-white dark:bg-slate-800 rounded-full ring-4 ring-white dark:ring-slate-800">
                        <AgentAvatar agent={agent} size="lg" />
                    </div>
                </div>
            </div>
            
            {/* A single container for all content below the header */}
            <div className="bg-white dark:bg-slate-800">
                <div className="px-4 pt-10 pb-4"> {/* pt-10 to clear avatar */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{agent.description}</p>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                            <CpuChipIcon className="w-3.5 h-3.5" />
                            <span>{agent.isCustom ? 'Custom AI Agent' : 'System AI Agent'}</span>
                        </div>
                    </div>
                </div>
                
                {agent.isCustom && onEdit && (
                    <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => onEdit(agent.id)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <PencilIcon className="w-4 h-4" />
                            Edit Agent
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentProfileCard;
