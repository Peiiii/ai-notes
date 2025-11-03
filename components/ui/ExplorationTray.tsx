import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { usePresenter } from '../../presenter';
import { Exploration } from '../../types';
import BookOpenIcon from '../icons/BookOpenIcon';
import XMarkIcon from '../icons/XMarkIcon';
import ArrowTopRightOnSquareIcon from '../icons/ArrowTopRightOnSquareIcon';
import ExclamationTriangleIcon from '../icons/ExclamationTriangleIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import Square2StackIcon from '../icons/Square2StackIcon';
import XCircleIcon from '../icons/XCircleIcon';
import CpuChipIcon from '../icons/CpuChipIcon';
import ViewColumnsIcon from '../icons/ViewColumnsIcon';

const ExplorationCard: React.FC<{ exploration: Exploration }> = ({ exploration }) => {
    const presenter = usePresenter();

    const handleNavigate = () => {
        if (exploration.wikiEntry) {
            presenter.handleNavigateToWikiFromExploration(exploration.wikiEntry, exploration.id);
        }
    };
    
    const handleRetry = () => {
        if (exploration.wikiEntry?.parentId && exploration.wikiEntry?.sourceNoteId) {
            presenter.handleStartWikiExploration(exploration.term, exploration.wikiEntry.parentId, exploration.wikiEntry.sourceNoteId, '');
            presenter.handleDismissExploration(exploration.id);
        } else {
             presenter.handleStartWikiExploration(exploration.term, 'wiki_root', 'no-source', '');
             presenter.handleDismissExploration(exploration.id);
        }
    }

    const renderContent = () => {
        switch (exploration.status) {
            case 'loading':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-slate-400/50 border-t-slate-400 rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Exploring "{exploration.term}"...</p>
                    </div>
                );
            case 'complete':
                return (
                    <>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <BookOpenIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{exploration.wikiEntry?.term}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{exploration.wikiEntry?.content}</p>
                            </div>
                        </div>
                        <button onClick={handleNavigate} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ml-2" title="Go to Entry">
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </button>
                    </>
                );
            case 'visited':
                return (
                     <>
                        <div className="flex items-center gap-3 flex-1 min-w-0 opacity-60 group-hover:opacity-100 transition-opacity">
                            <BookOpenIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{exploration.wikiEntry?.term}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{exploration.wikiEntry?.content}</p>
                            </div>
                        </div>
                        <button onClick={handleNavigate} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ml-2" title="Go to Entry">
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </button>
                    </>
                );
            case 'error':
                 return (
                    <>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Error</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Failed to explore "{exploration.term}"</p>
                            </div>
                        </div>
                        <button onClick={handleRetry} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ml-2" title="Retry">
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300 group">
            {renderContent()}
             <button onClick={() => presenter.handleDismissExploration(exploration.id)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Dismiss">
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const ExplorationTray: React.FC = () => {
    const { explorations, explorationPanelMode } = useAppStore();
    const presenter = usePresenter();
    
    if (explorationPanelMode === 'tray' && explorations.length === 0) {
        return null;
    }

    const isSidebar = explorationPanelMode === 'sidebar';
    const hasCompleted = explorations.some(e => e.status !== 'loading');

    const loadingExplorations = explorations.filter(e => e.status === 'loading');
    const readyExplorations = explorations.filter(e => e.status === 'complete' || e.status === 'error');
    const visitedExplorations = explorations.filter(e => e.status === 'visited');


    const PanelWrapper: React.FC<{children: React.ReactNode}> = ({children}) => {
        if (isSidebar) {
            return (
                <div className="h-full w-80 md:w-96 flex-shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-right-10 duration-300">
                    {children}
                </div>
            )
        }
        return <div className="fixed bottom-4 right-4 w-full max-w-sm z-50 space-y-2">{children}</div>
    }

    return (
        <PanelWrapper>
            <div className={`p-2 flex items-center justify-between ${isSidebar ? 'border-b border-slate-200 dark:border-slate-700 flex-shrink-0' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-t-lg'}`}>
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 ml-2">Explorations ({explorations.length})</h3>
                <div className="flex items-center">
                    <button 
                        onClick={() => presenter.handleSetExplorationPanelMode(isSidebar ? 'tray' : 'sidebar')} 
                        title={isSidebar ? "Undock Panel" : "Dock Panel as Sidebar"}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {isSidebar ? <Square2StackIcon className="w-5 h-5" /> : <ViewColumnsIcon className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={presenter.handleClearCompletedExplorations} 
                        title="Clear Completed"
                        disabled={!hasCompleted}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <XCircleIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            <div className={isSidebar ? "flex-1 overflow-y-auto p-2 space-y-2" : ""}>
                {explorations.length > 0 ? (
                    <>
                        {loadingExplorations.map(exp => (
                            <ExplorationCard key={exp.id} exploration={exp} />
                        ))}
                        {readyExplorations.map(exp => (
                            <ExplorationCard key={exp.id} exploration={exp} />
                        ))}
                        {visitedExplorations.length > 0 && (
                            <div className="pt-2">
                                {(loadingExplorations.length > 0 || readyExplorations.length > 0) && (
                                    <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 pb-1 uppercase tracking-wider">Visited</h4>
                                )}
                                <div className="space-y-2">
                                    {visitedExplorations.map(exp => (
                                        <ExplorationCard key={exp.id} exploration={exp} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 h-full flex flex-col items-center justify-center">
                        <CpuChipIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-2" />
                        <p className="font-semibold">Exploration Panel</p>
                        <p>Active and completed explorations will appear here.</p>
                    </div>
                )}
            </div>
        </PanelWrapper>
    );
};

export default ExplorationTray;