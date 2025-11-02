
import React from 'react';
import { AIAgent } from '../../types';
import { AgentAvatar } from './ChatUIComponents';
import CpuChipIcon from '../icons/CpuChipIcon';

const gradientMap: Record<string, string> = {
    slate: 'from-slate-500 to-slate-700',
    indigo: 'from-indigo-500 to-purple-600',
    sky: 'from-sky-400 to-blue-500',
    purple: 'from-purple-500 to-fuchsia-600',
    amber: 'from-amber-400 to-orange-500',
    rose: 'from-rose-400 to-red-500',
    green: 'from-green-400 to-emerald-500',
};

const AgentProfileCard: React.FC<{ agent: AIAgent }> = ({ agent }) => {
    const gradient = gradientMap[agent.color] || gradientMap.indigo;

    return (
        <div className="w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95">
            <div className={`h-20 bg-gradient-to-br ${gradient}`}></div>
            <div className="relative p-4">
                <div className="absolute top-0 left-4 transform -translate-y-1/2">
                    <div className="p-1 bg-white dark:bg-slate-800 rounded-full ring-4 ring-white dark:ring-slate-800">
                        <AgentAvatar agent={agent} size="lg" />
                    </div>
                </div>
                <div className="pt-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{agent.description}</p>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                            <CpuChipIcon className="w-3.5 h-3.5" />
                            <span>{agent.isCustom ? 'Custom AI Agent' : 'System AI Agent'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfileCard;
