import React from 'react';
import { Todo, KnowledgeCard, KnowledgeCardType } from '../types';
import CheckIcon from './icons/CheckIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import DocumentPlusIcon from './icons/DocumentPlusIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import SparklesIcon from './icons/SparklesIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import CpuChipIcon from './icons/CpuChipIcon';
import BeakerIcon from './icons/BeakerIcon';

interface StudioProps {
  suggestedTodos: Todo[];
  myTodos: Todo[];
  knowledgeCards: KnowledgeCard[];
  onToggleTodo: (id: string) => void;
  onAdoptTodo: (todo: Todo) => void;
  onCardToNote: (card: KnowledgeCard) => void;
}

const cardTypeDetails: Record<KnowledgeCardType, { icon: React.FC<React.SVGProps<SVGSVGElement>>, color: string, iconColor: string }> = {
  encyclopedia: { icon: BookOpenIcon, color: 'bg-sky-50 dark:bg-sky-900/50', iconColor: 'text-sky-600 dark:text-sky-400' },
  creative_story: { icon: SparklesIcon, color: 'bg-purple-50 dark:bg-purple-900/50', iconColor: 'text-purple-600 dark:text-purple-400' },
  note_synthesis: { icon: CpuChipIcon, color: 'bg-amber-50 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400' },
  new_theory: { icon: BeakerIcon, color: 'bg-rose-50 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-400' },
  idea: { icon: LightbulbIcon, color: 'bg-green-50 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-400' },
};

const Studio: React.FC<StudioProps> = ({
  suggestedTodos,
  myTodos,
  knowledgeCards,
  onToggleTodo,
  onAdoptTodo,
  onCardToNote,
}) => {
  const hasSummaryContent = suggestedTodos.length > 0 || myTodos.length > 0 || knowledgeCards.length > 0;

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Studio</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Your notes, synthesized. Ideas, tasks, and new perspectives.</p>

        {!hasSummaryContent ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">Nothing here yet</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Create some notes and visit the Studio to see what the AI finds.</p>
          </div>
        ) : (
          <div className="space-y-12">
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
                        <button onClick={() => onToggleTodo(todo.id)} className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center mr-3 ${todo.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-500'}`}>
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
                        <button onClick={() => onAdoptTodo(todo)} className="ml-4 p-1.5 rounded-full text-slate-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:text-slate-400 dark:hover:text-blue-400 transition-colors" title="Add to my tasks">
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
                        <div className="text-right mt-auto">
                            <button onClick={() => onCardToNote(card)} className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/10 px-2.5 py-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Studio;
