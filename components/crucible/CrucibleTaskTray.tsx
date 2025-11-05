import React from 'react';
import { useCrucibleStore } from '../../stores/crucibleStore';
import { CrucibleTask } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import ExclamationTriangleIcon from '../icons/ExclamationTriangleIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

const TaskCard: React.FC<{ task: CrucibleTask }> = ({ task }) => {
    const removeTask = useCrucibleStore(state => state.removeTask);

    const renderContent = () => {
        switch (task.status) {
            case 'loading':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-slate-400/50 border-t-slate-400 rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Generating for "{task.prompt}"...</p>
                    </div>
                );
            case 'complete':
                return (
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{task.result || 'Generation complete.'}</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Failed: "{task.prompt}"</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300 group">
            <div className="flex-1 min-w-0">{renderContent()}</div>
             <button onClick={() => removeTask(task.id)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Dismiss">
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};


const CrucibleTaskTray: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    // This component is simpler as it gets its tasks directly from the store
    // and doesn't need to filter by session, assuming only one active crucible session at a time.
    const tasks = useCrucibleStore(state => state.tasks);

    if (tasks.length === 0) {
        return null;
    }

    return (
        <div className="w-80 md:w-96 flex-shrink-0 h-full flex flex-col border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right-10 duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Generation Tasks ({tasks.length})</h3>
            </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
};

export default CrucibleTaskTray;