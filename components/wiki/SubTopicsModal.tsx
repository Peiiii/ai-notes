
import React from 'react';
import Modal from '../ui/Modal';

interface SubTopicsModalProps {
  subTopics: { title: string; topics: string[] } | null;
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

const SubTopicsModal: React.FC<SubTopicsModalProps> = ({ subTopics, onClose, onSelectTopic }) => {
  return (
    <Modal isOpen={!!subTopics} onClose={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-5"
      >
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          Explore topics related to "{subTopics?.title}"
        </h3>
        <div className="mt-4 space-y-2">
          {subTopics?.topics.map(topic => (
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
    </Modal>
  );
};

export default SubTopicsModal;
