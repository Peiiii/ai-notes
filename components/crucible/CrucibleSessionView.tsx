import React, { useMemo } from 'react';
import { usePresenter } from '../../presenter';
import { useCrucibleStore } from '../../stores/crucibleStore';
import { CrucibleSession, ConceptOperator, CrucibleStoryStructure } from '../../types';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import XMarkIcon from '../icons/XMarkIcon';
import SparklesIcon from '../icons-material/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import BeakerIcon from '../icons/BeakerIcon';
import PencilIcon from '../icons/PencilIcon';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import HoverPopup from '../ui/HoverPopup';
import GlobeAltIcon from '../icons/GlobeAltIcon';
// Operator Icons
import ArrowUpIcon from '../icons/ArrowUpIcon';
import ArrowDownIcon from '../icons/ArrowDownIcon';
import ScaleIcon from '../icons/ScaleIcon';
import UsersIcon from '../icons/UsersIcon';
import ArrowPathRoundedSquareIcon from '../icons-material/ArrowPathRoundedSquareIcon';
import DocumentDuplicateIcon from '../icons/DocumentDuplicateIcon';

const operatorList: { id: ConceptOperator, name: string, icon: React.FC<any> }[] = [
    { id: 'generalize', name: 'Generalize', icon: ArrowUpIcon },
    { id: 'specify', name: 'Specify', icon: ArrowDownIcon },
    { id: 'analogize', name: 'Analogize', icon: ArrowPathRoundedSquareIcon },
    { id: 'synthesize', name: 'Synthesize', icon: DocumentDuplicateIcon },
    { id: 'reverse', name: 'Reverse', icon: ScaleIcon },
    { id: 'perspective', name: 'Perspective', icon: UsersIcon },
];

const CrucibleSessionView: React.FC = () => {
    const presenter = usePresenter();
    const { sessions, activeSessionId } = useCrucibleStore();
    const session = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
    
    if (!session) return null;

    const handleExpand = (term: string, operator: ConceptOperator) => {
        if (session.isLoading === 'expansion') return;
        presenter.crucibleManager.expandConcepts(session.id, [term], operator);
    };
    
    const handleToggleReactorTerm = (term: string) => presenter.crucibleManager.toggleReactorTerm(session.id, term);
    
    const isGenerating = session.isLoading === 'story';

    return (
        <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full animate-in fade-in">
                <button onClick={() => presenter.crucibleManager.viewSession(null)} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to History
                </button>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Initial Concept</h2>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">{session.topic}</h1>
                
                {session.isLoading === 'thoughts' ? (
                    <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div></div>
                ) : session.storyStructure ? (
                    <StoryStructureDisplay structure={session.storyStructure} />
                ) : (
                    <>
                        {/* Divergent Thoughts & Operators */}
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Divergent Thoughts</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Click a concept to add it to the reactor. Hover to expand it with thinking tools.</p>
                            
                            {session.isLoading === 'expansion' && (
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4 animate-in fade-in">
                                    <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Expanding concepts...</span>
                                </div>
                            )}
                            
                            <div className="flex flex-wrap gap-3">
                                {session.divergentThoughts.map((thought) => {
                                    const isInReactor = session.reactorTerms.includes(thought);
                                    return (
                                        <HoverPopup
                                            key={thought}
                                            trigger={
                                                <button 
                                                    onClick={() => handleToggleReactorTerm(thought)}
                                                    className={`px-4 py-2 rounded-full font-medium text-sm border-2 transition-all duration-200 ${
                                                        isInReactor
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200'
                                                        : 'bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500'
                                                    }`}
                                                >
                                                    {thought}
                                                </button>
                                            }
                                            content={
                                                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                                                    {operatorList.map(({ id, name, icon: Icon }) => (
                                                        <button 
                                                            key={id} 
                                                            onClick={() => handleExpand(thought, id)} 
                                                            title={name} 
                                                            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50" 
                                                            disabled={session.isLoading === 'expansion'}
                                                        >
                                                            <Icon className="w-5 h-5" />
                                                        </button>
                                                    ))}
                                                </div>
                                            }
                                            popupClassName="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10"
                                            className="relative"
                                        />
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Reactor */}
                        <div className="mt-10">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Reactor</h2>
                            <div className="min-h-[80px] p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-2 items-center border border-slate-200 dark:border-slate-700">
                                {session.reactorTerms.length > 0 ? session.reactorTerms.map(term => (
                                    <div key={term} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2 animate-in fade-in zoom-in-95">
                                        <span>{term}</span>
                                        <button onClick={() => handleToggleReactorTerm(term)} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )) : <p className="text-sm text-slate-400 dark:text-slate-500">Click concepts above to add them here.</p>}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => presenter.crucibleManager.generateStory(session.id)}
                                disabled={session.reactorTerms.length === 0 || isGenerating}
                                className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                            >
                                {isGenerating ? (
                                    <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div><span>Generating...</span></>
                                ) : (
                                    <><SparklesIcon className="w-5 h-5" />Generate Story Structure</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const StoryStructureDisplay: React.FC<{ structure: CrucibleStoryStructure }> = ({ structure }) => {
    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{structure.title}</h2>
                <p className="mt-2 text-lg text-slate-500 dark:text-slate-400 italic">{structure.logline}</p>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4"><GlobeAltIcon className="w-6 h-6 text-indigo-500"/>Worldview</h3>
                <div className="mt-4 prose prose-slate dark:prose-invert max-w-none">
                    <MarkdownRenderer content={structure.worldview} />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4"><UsersIcon className="w-6 h-6 text-indigo-500"/>Characters</h3>
                <div className="space-y-4">
                    {structure.characters.map(char => (
                        <div key={char.name}>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{char.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{char.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4"><PencilIcon className="w-6 h-6 text-indigo-500"/>Outline</h3>
                <div className="space-y-6">
                    {[structure.outline.act_1, structure.outline.act_2, structure.outline.act_3].map((act, index) => (
                        <div key={index}>
                            <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">Act {index + 1}: {act.title}</h4>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {act.plot_points.map((point, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300">{point}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default CrucibleSessionView;