import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import SparklesIcon from '../icons/SparklesIcon';

interface CreateCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCommand: (command: { name: string; description: string; definition: string }) => void;
  initialCommandName?: string;
}

const CreateCommandModal: React.FC<CreateCommandModalProps> = ({
  isOpen,
  onClose,
  onCreateCommand,
  initialCommandName = '',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [definition, setDefinition] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialCommandName);
      setDescription('');
      setDefinition('');
    }
  }, [isOpen, initialCommandName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commandName = name.trim().replace(/\s+/g, '-');
    if (commandName && description.trim() && definition.trim()) {
      onCreateCommand({ name: commandName, description: description.trim(), definition: definition.trim() });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Command</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Teach the AI a new skill.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="command-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Command Name</label>
            <div className="mt-1 flex items-center">
              <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l-md">/</span>
              <input
                id="command-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/\s+/g, '-'))}
                placeholder="e.g., summarize-topic"
                required
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="command-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <input
              id="command-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description for the command palette."
              required
              className="mt-1 w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="command-def" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Definition (AI Instructions)</label>
            <textarea
              id="command-def"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Detailed instructions for the AI. Explain what tools to use and how to respond. E.g., 'Use the search_notes tool, then create a new note with a summary...'"
              required
              rows={5}
              className="mt-1 w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Command
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateCommandModal;
