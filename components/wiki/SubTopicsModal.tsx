
import React from 'react';

interface SubTopicsModalProps {
  subTopics: { title: string; topics: string[] } | null;
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

const SubTopicsModal: React.FC<SubTopicsModalProps> = ({ subTopics, onClose, onSelectTopic }) => {
  if (!subTopics) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-20 flex items-center justify-center p-4 animate-in fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-5 animate-in fade-in zoom-in-95" 
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          Explore topics related to "{subTopics.title}"
        </h3>
        <div className="mt-4 space-y-2">
          {subTopics.topics.map(topic => (
            <button 
              key={topic} 
              onClick={() => onSelectTopic(topic)} 
              className="w-full text-left p-3 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubTopicsModal;
