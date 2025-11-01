import React from 'react';
import { ProactiveSuggestion } from '../../types';

interface ProactiveSuggestionsProps {
  suggestions: ProactiveSuggestion[];
  isLoading: boolean;
  onSelectSuggestion: (prompt: string) => void;
}

const ProactiveSuggestions: React.FC<ProactiveSuggestionsProps> = ({ suggestions, isLoading, onSelectSuggestion }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center">Need some inspiration?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
                <button
                    key={i}
                    onClick={() => onSelectSuggestion(s.prompt)}
                    className="w-full text-left p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{s.prompt}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.description}</p>
                </button>
            ))}
        </div>
    </div>
  );
};

export default ProactiveSuggestions;
