import React from 'react';
// FIX: Replaced missing 'Idea' type with 'KnowledgeCard' to align with the application's data model.
import { Todo, KnowledgeCard } from '../types';
import CheckIcon from './icons/CheckIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import DocumentPlusIcon from './icons/DocumentPlusIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface AiSummaryProps {
  suggestedTodos: Todo[];
  myTodos: Todo[];
  // FIX: Changed prop type from 'Idea[]' to 'KnowledgeCard[]'.
  ideas: KnowledgeCard[];
  onToggleTodo: (id: string) => void;
  onAdoptTodo: (todo: Todo) => void;
  // FIX: Updated event handler to pass the full KnowledgeCard object.
  onIdeaToNote: (idea: KnowledgeCard) => void;
}

const AiSummary: React.FC<AiSummaryProps> = ({
  suggestedTodos,
  myTodos,
  ideas,
  onToggleTodo,
  onAdoptTodo,
  onIdeaToNote,
}) => {
  const hasContent = suggestedTodos.length > 0 || myTodos.length > 0 || ideas.length > 0;

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AI Summary & Actions</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Here's what I found in your notes. Add tasks to your list or create new notes from ideas.</p>

        {!hasContent ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">No summary yet</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Click "Analyze" to generate a summary of your notes.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* To-Do Section */}
            <section>
              <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4">
                <CheckIcon className="w-6 h-6" />
                To-Do List
              </h2>
              
              {/* My Todos */}
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

              {/* Suggested Todos */}
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

            {/* Ideas Section */}
            <section>
              <h2 className="text-2xl font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-4">
                <LightbulbIcon className="w-6 h-6" />
                Ideas
              </h2>
               {ideas.length > 0 ? (
                <ul className="space-y-2">
                  {ideas.map((idea) => (
                    <li key={idea.id} className="flex items-center bg-white dark:bg-slate-700/50 p-3 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      {/* FIX: Use 'idea.title' instead of 'idea.text' to match the KnowledgeCard interface. */}
                      <span className="flex-1 text-slate-800 dark:text-slate-200">{idea.title}</span>
                      {/* FIX: Pass the entire 'idea' object to the handler. */}
                      <button onClick={() => onIdeaToNote(idea)} className="ml-4 p-1.5 rounded-full text-slate-500 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/50 dark:text-slate-400 dark:hover:text-green-400 transition-colors" title="Create note from this idea">
                        <DocumentPlusIcon className="w-6 h-6" />
                      </button>
                    </li>
                  ))}
                </ul>
               ) : (
                <p className="text-slate-500 dark:text-slate-400">No new ideas found in your notes.</p>
               )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSummary;