import React from 'react';
import { CrucibleSession } from '../../types';
import { usePresenter } from '../../presenter';
import XMarkIcon from '../icons/XMarkIcon';
import { ExpansionCard } from './ExpansionCard';

interface ExpansionSidebarProps {
  session: CrucibleSession;
}

export const ExpansionSidebar: React.FC<ExpansionSidebarProps> = ({ session }) => {
  const presenter = usePresenter();
  const { expansionHistory = [] } = session;

  return (
    <div className="w-80 md:w-96 flex-shrink-0 h-full flex flex-col border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right-10 duration-300">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Concept Expansion</h3>
        <button
          onClick={() => presenter.crucibleManager.clearExpansionHistory(session.id)}
          className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Close Expansion History"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {expansionHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Hover over a concept and click the ✨ icon to expand it here.</p>
          </div>
        ) : (
          expansionHistory.map(expansion => (
            <ExpansionCard 
              key={expansion.id}
              expansion={expansion}
              session={session}
            />
          ))
        )}
      </div>
    </div>
  );
};
