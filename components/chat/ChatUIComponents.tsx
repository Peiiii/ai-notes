
import React from 'react';
import { AIAgent } from '../../types';
import SparklesIcon from '../icons/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import CpuChipIcon from '../icons/CpuChipIcon';
import LightbulbIcon from '../icons/LightbulbIcon';
import BeakerIcon from '../icons/BeakerIcon';
import UsersIcon from '../icons/UsersIcon';

// --- Available Icons & Colors for Agent Creation ---
export const agentIcons: Record<string, React.FC<any>> = {
  SparklesIcon, BookOpenIcon, CpuChipIcon, LightbulbIcon, BeakerIcon, UsersIcon
};
export const iconColors: Record<string, { bg: string, text: string }> = {
  slate: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' },
  indigo: { bg: 'bg-indigo-200 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-300' },
  sky: { bg: 'bg-sky-200 dark:bg-sky-900/50', text: 'text-sky-600 dark:text-sky-300' },
  purple: { bg: 'bg-purple-200 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-300' },
  amber: { bg: 'bg-amber-200 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-300' },
  rose: { bg: 'bg-rose-200 dark:bg-rose-900/50', text: 'text-rose-600 dark:text-rose-300' },
  green: { bg: 'bg-green-200 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-300' },
};

export const AgentAvatar: React.FC<{ agent: AIAgent, size?: 'sm' | 'md' | 'lg'}> = ({ agent, size = 'md' }) => {
    const Icon = agentIcons[agent.icon] || SparklesIcon;
    const color = iconColors[agent.color] || iconColors.indigo;
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    };
    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };
    return (
        <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${color.bg} ${sizeClasses[size]}`}>
            <Icon className={`${color.text} ${iconSizeClasses[size]}`} />
        </div>
    );
}

export const ParticipantAvatarStack: React.FC<{ agents: AIAgent[], size?: 'sm' | 'lg'}> = ({ agents, size = 'sm' }) => {
    const maxVisible = size === 'sm' ? 3 : 4;
    const visibleAgents = agents.slice(0, maxVisible);
    const hiddenCount = agents.length - maxVisible;
    const sizeClasses = size === 'sm' ? 'h-6 min-w-6 px-1' : 'h-10 min-w-10 px-1.5';
    
    return (
        <div className="flex items-center flex-shrink-0">
            <div className={`flex ${size === 'sm' ? '-space-x-2' : '-space-x-4'}`}>
                {visibleAgents.map(agent => (
                    <div key={agent.id} className={`ring-2 ring-slate-100 dark:ring-slate-800 rounded-full`}>
                      <AgentAvatar agent={agent} size={size} />
                    </div>
                ))}
            </div>
            {hiddenCount > 0 && (
                <div className={`flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold z-10 ring-2 ring-slate-100 dark:ring-slate-800 ${sizeClasses} ${size === 'sm' ? '-ml-2' : '-ml-4'}`}>
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
};

// --- New WeChat-inspired Composite Avatar ---
export const CompositeAvatar: React.FC<{ agents: AIAgent[] }> = ({ agents }) => {
    const displayAgents = agents.slice(0, 4); // Max 4 in a 2x2 grid
    return (
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 grid grid-cols-2 grid-rows-2 gap-px p-px overflow-hidden">
            {displayAgents.map((agent) => {
                const Icon = agentIcons[agent.icon] || SparklesIcon;
                const color = iconColors[agent.color] || iconColors.indigo;
                // Note: We use rounded-none here because the parent provides the circle mask
                return (
                    <div key={agent.id} className={`w-full h-full flex items-center justify-center ${color.bg}`}>
                        <Icon className={`w-[65%] h-[65%] ${color.text}`} />
                    </div>
                );
            })}
        </div>
    );
};


// --- Agent Mention Popup ---
export const AgentMentionPopup: React.FC<{
  agents: AIAgent[];
  onSelect: (agentName: string) => void;
  selectedIndex: number;
  style: React.CSSProperties;
}> = ({ agents, onSelect, selectedIndex, style }) => (
  <div style={style} className="w-72 max-h-60 overflow-y-auto p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 animate-in fade-in zoom-in-95">
    <ul className="space-y-1">
      {agents.map((agent, index) => (
        <li key={agent.id}>
          <button
            onClick={() => onSelect(agent.name)}
            className={`w-full text-left p-2 rounded-md flex items-center gap-3 ${selectedIndex === index ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <AgentAvatar agent={agent} />
            <div>
              <p className={`font-semibold text-sm ${selectedIndex === index ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>{agent.name}</p>
              <p className={`text-xs truncate ${selectedIndex === index ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{agent.description}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  </div>
);
