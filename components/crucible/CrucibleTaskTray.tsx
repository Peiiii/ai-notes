import React from 'react';
import { CrucibleSession, CrucibleTask } from '../../types';
import { usePresenter } from '../../presenter';
import XMarkIcon from '../icons/XMarkIcon';
import ArrowUpOnSquareIcon from '../icons/ArrowUpOnSquareIcon';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import ExclamationTriangleIcon from '../icons/ExclamationTriangleIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';

const TaskCard: React.FC<{ session: CrucibleSession, task: CrucibleTask }> = ({ session, task }) => {
    const presenter = usePresenter();

    const handleAccept = () => {
        presenter.crucibleManager.acceptExpansionResult(session.id, task.id);
    };

    const handleDismiss = () => {
        presenter.crucibleManager.dismissTask(session.id, task.id);
    };
    
    const handleRetry = () => {
        presenter.crucibleManager.startExpansion(session.id, task.parentBlockId, task.triggerText, task.prompt);
        handleDismiss(); // Dismiss the errored task
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Instruction:</p>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{task.prompt}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate mt-1">From: "{task.triggerText}"</p>
            </div>
            <div className="p-3">
                {task.status === 'loading' && (
                    <div className="flex items-center justify-center h-24">
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {task.status === 'error' && (
                    <div className="text-center p-4">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">Generation Failed</p>
                        <button onClick={handleRetry} className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">
                            <ArrowPathIcon className="w-3.5 h-3.5" />
                            Retry
                        </button>
                    </div>
                )}
                {task.status === 'complete' && task.result && (
                    <div className="max-h-48 overflow-y-auto pr-2 -mr-2">
                        <MarkdownRenderer content={task.result} className="text-sm" />
                    </div>
                )}
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button onClick={handleDismiss} className="p-2 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Dismiss">
                    <XMarkIcon className="w-5 h-5" />
                </button>
                {task.status === 'complete' && (
                    <button 
                        onClick={handleAccept} 
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        title="Accept and Insert"
                    >
                        <ArrowUpOnSquareIcon className="w-4 h-4" />
                        Accept
                    </button>
                )}
            </div>
        </div>
    );
};


const CrucibleTaskTray: React.FC<{ session: CrucibleSession }> = ({ session }) => {
  return (
    <div className="w-80 md:w-96 flex-shrink-0 h-full flex flex-col border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right-10 duration-300">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Active Tasks</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {session.tasks.map(task => (
          <TaskCard 
            key={task.id}
            session={session}
            task={task}
          />
        ))}
      </div>
    </div>
  );
};

export default CrucibleTaskTray;