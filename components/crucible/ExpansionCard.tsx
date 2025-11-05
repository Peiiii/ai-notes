import React from 'react';
import { CrucibleExpansionState, CrucibleSession } from '../../types';
import { usePresenter } from '../../presenter';
import XMarkIcon from '../icons/XMarkIcon';
import PlusIcon from '../icons/PlusIcon';

interface ExpansionCardProps {
  expansion: CrucibleExpansionState;
  session: CrucibleSession;
}

export const ExpansionCard: React.FC<ExpansionCardProps> = ({ expansion, session }) => {
  const presenter = usePresenter();

  const handleAddAll = () => {
    presenter.crucibleManager.addMultipleToReactor(session.id, expansion.thoughts);
  };
  
  const handleToggleTerm = (term: string) => {
    presenter.crucibleManager.toggleReactorTerm(session.id, term);
  }

  const handleRemoveCard = () => {
    presenter.crucibleManager.removeExpansion(session.id, expansion.id);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Expanded:</p>
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">{expansion.term}</h4>
        </div>
        <button onClick={handleRemoveCard} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" title="Dismiss">
            <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3">
        {expansion.isLoading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <button
                onClick={handleAddAll}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900 mb-3"
            >
                <PlusIcon className="w-3.5 h-3.5"/>
                Add All to Reactor
            </button>
            <div className="flex flex-wrap gap-1.5">
              {expansion.thoughts.map(thought => {
                const isInReactor = session.reactorTerms.includes(thought);
                return (
                  <button 
                    key={thought}
                    onClick={() => handleToggleTerm(thought)}
                    className={`px-2.5 py-1 rounded-full font-medium text-xs border transition-colors ${
                      isInReactor
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                        : 'bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500'
                    }`}
                  >
                    {thought}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
