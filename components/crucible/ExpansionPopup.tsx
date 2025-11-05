import React, { useState, useEffect } from 'react';
import { usePresenter } from '../../presenter';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';

interface ExpansionPopupProps {
  triggerText: string;
  onGenerate: (prompt: string) => void;
}

const ExpansionPopup: React.FC<ExpansionPopupProps> = ({ triggerText, onGenerate }) => {
  const presenter = usePresenter();
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      const result = await presenter.crucibleManager.getSuggestedActions(triggerText);
      if (isMounted) {
        setSuggestions(result);
        setIsLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
    return () => { isMounted = false; };
  }, [triggerText, presenter]);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onGenerate(suggestion);
  };

  return (
    <div className="w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
      <div className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md text-sm text-slate-500 dark:text-slate-400 italic truncate">
        "{triggerText}"
      </div>

      {isLoadingSuggestions ? (
        <div className="flex justify-center p-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="Or type your own prompt..."
          className="flex-1 w-full bg-transparent text-sm focus:outline-none truncate-placeholder"
          autoFocus
        />
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ExpansionPopup;