
import React, { useState } from 'react';
import { usePresenter } from '../../presenter';
import { useStudioStore } from '../../stores/studioStore';
import { Todo, KnowledgeCard, KnowledgeCardType, PulseReport, MindMapData } from '../../types';
import CheckIcon from '../icons/CheckIcon';
import LightbulbIcon from '../icons/LightbulbIcon';
import DocumentPlusIcon from '../icons/DocumentPlusIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import SparklesIcon from '../icons/SparklesIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import CpuChipIcon from '../icons/CpuChipIcon';
import BeakerIcon from '../icons/BeakerIcon';
import PulseIcon from '../icons/PulseIcon';
import MindMapIcon from '../icons/MindMapIcon';
import MindMap from './MindMap';

type StudioTab = 'synthesis' | 'mindmap';

const cardTypeDetails: Record<KnowledgeCardType, { icon: React.FC<React.SVGProps<SVGSVGElement>>, color: string, iconColor: string }> = {
  encyclopedia: { icon: BookOpenIcon, color: 'bg-sky-50 dark:bg-sky-900/50', iconColor: 'text-sky-600 dark:text-sky-400' },
  creative_story: { icon: SparklesIcon, color: 'bg-purple-50 dark:bg-purple-900/50', iconColor: 'text-purple-600 dark:text-purple-400' },
  note_synthesis: { icon: CpuChipIcon, color: 'bg-amber-50 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400' },
  new_theory: { icon: BeakerIcon, color: 'bg-rose-50 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-400' },
  idea: { icon: LightbulbIcon, color: 'bg-green-50 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-400' },
};

const Studio: React.FC = () => {
  const presenter = usePresenter();
  const { suggestedTodos, myTodos, knowledgeCards, pulseReports, isLoadingPulse, mindMapData, isLoadingMindMap } = useStudioStore(
    state => ({
        suggestedTodos: state.aiSummary?.todos || [],
        myTodos: state.myTodos,
        knowledgeCards: state.aiSummary?.knowledgeCards || [],
        pulseReports: state.pulseReports,
        isLoadingPulse: state.isLoadingPulse,
        mindMapData: state.mindMapData,
        isLoadingMindMap: state.isLoadingMindMap
    })
  );

  const [activeTab, setActiveTab] = useState<StudioTab>('synthesis');

  const hasSummaryContent = suggestedTodos.length > 0 || myTodos.length > 0 || knowledgeCards.length > 0;
  const sortedPulseReports = [...pulseReports].sort((a, b) => b.createdAt - a.createdAt);

  const TabButton: React.FC<{ tabId: StudioTab; icon: React.FC<any>; children: React.ReactNode }> = ({ tabId, icon: Icon, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center gap-2.5 px-4 py-2 font-semibold text-sm rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
        activeTab === tabId
          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-600/60'
      }`}
    >
      <Icon className={`w-5 h-5 transition-colors ${activeTab === tabId ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
      {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm mb-8 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <SparklesIcon className="w-8 h-8 text-indigo-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Studio</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage tasks and synthesize ideas from your notes.</p>
                </div>
            </div>
        </div>
        
        <div className="mb-8">
            <div className="inline-flex items-center p-1 space-x-1 bg-slate-200/80 dark:bg-slate-700/50 rounded-xl">
                <TabButton tabId="synthesis" icon={SparklesIcon}>Synthesis</TabButton>
                <TabButton tabId="mindmap" icon={MindMapIcon}>Mind Map</TabButton>
            </div>
        </div>

        {activeTab === 'synthesis' && (
           <div className="space-y-12 animate-in fade-in-50">
            {!hasSummaryContent ? (
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">Start by creating some notes</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">When you're ready, visit the Studio again to see what the AI finds.</p>
              </div>
            ) : (
              <>
                <section>
                  <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4">
                    <CheckIcon className="w-6 h-6" />
                    To-Do List
                  </h2>
                  {myTodos.length === 0 && suggestedTodos.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400">No actionable tasks found in your notes.</p>
                  )}
                  {myTodos.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-3">My Tasks</h3>
                      <ul className="space-y-2">
                        {myTodos.map((todo) => (
                          <li key={todo.id} className="flex items-center bg-white dark:bg-slate-700/50 p-3 rounded-lg shadow-sm">
                            <button onClick={() => presenter.studioManager.toggleTodo(todo.id)} className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center mr-3 ${todo.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-500'}`}>
                              {todo.completed && <CheckIcon className="w-4 h-4 text-white" />}
                            </button>
                            <span className={`flex-1 ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                              {todo.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {suggestedTodos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-3">Suggestions</h3>
                      <ul className="space-y-2">
                        {suggestedTodos.map((todo) => (
                          <li key={todo.id} className="flex items-center bg-white dark:bg-slate-700/50 p-3 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <span className="flex-1 text-slate-800 dark:text-slate-200">{todo.text}</span>
                            <button onClick={() => presenter.studioManager.adoptTodo(todo)} className="ml-4 p-1.5 rounded-full text-slate-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:text-slate-400 dark:hover:text-blue-400 transition-colors" title="Add to my tasks">
                              <PlusCircleIcon className="w-6 h-6" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4">
                    <SparklesIcon className="w-6 h-6" />
                    Knowledge Cards
                  </h2>
                  {knowledgeCards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {knowledgeCards.map((card) => {
                        const details = cardTypeDetails[card.type] || cardTypeDetails.idea;
                        const Icon = details.icon;
                        return (
                          <div key={card.id} className={`p-4 rounded-lg shadow-sm flex flex-col ${details.color} border border-black/5 dark:border-white/5`}>
                            <div className="flex items-center mb-2">
                              <Icon className={`w-6 h-6 mr-3 flex-shrink-0 ${details.iconColor}`} />
                              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex-1">{card.title}</h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 flex-1 leading-relaxed">{card.content}</p>
                            
                            {card.sources && card.sources.length > 0 && (
                              <div className="mt-auto pt-3 border-t border-black/10 dark:border-white/10">
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Sources</h4>
                                <ul className="space-y-1">
                                  {card.sources.map((source, index) => (
                                    <li key={index} className="text-xs">
                                      <a href={source} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate block">
                                        {source}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="text-right mt-4">
                                <button onClick={() => presenter.handleCardToNote(card)} className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/10 px-2.5 py-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                                    <DocumentPlusIcon className="w-4 h-4 mr-1.5" />
                                    Create Note
                                </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">No special insights or ideas found in your notes this time.</p>
                  )}
                </section>
              </>
            )}
           </div>
        )}

        {activeTab === 'mindmap' && (
          <div className="space-y-6 animate-in fade-in-50">
            {mindMapData ? (
              <MindMap
                data={mindMapData.root}
                onRegenerate={() => presenter.studioManager.generateNewMindMap(true)}
                isLoading={isLoadingMindMap}
              />
            ) : (
              <div className="text-center py-10 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm">
                <MindMapIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">Visualize Your Thoughts</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Generate a mind map from all your notes to see how your ideas connect.</p>
                <button
                  onClick={() => presenter.studioManager.generateNewMindMap()}
                  disabled={isLoadingMindMap}
                  className="mt-6 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-colors"
                >
                  {isLoadingMindMap ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Mind Map'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-12">
            <section>
              <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4">
                <PulseIcon className="w-6 h-6" />
                The Pulse
              </h2>
              <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Get a periodic, narrative report of your thought evolution, new connections, and forgotten threads.</p>
                <button 
                  onClick={() => presenter.studioManager.generateNewPulseReport()}
                  disabled={isLoadingPulse}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-colors"
                >
                  {isLoadingPulse ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate New Pulse Report'
                  )}
                </button>
                {sortedPulseReports.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Recent Reports</h3>
                    <ul className="space-y-2">
                      {sortedPulseReports.map(report => (
                        <li key={report.id}>
                          <button 
                            onClick={() => presenter.appManager.setViewingPulseReport(report)}
                            className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{report.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(report.createdAt).toLocaleString()}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
        </div>

      </div>
    </div>
  );
};

export default Studio;
