import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { PresetChat } from '../../types';
import Modal from '../ui/Modal';
import { ParticipantAvatarStack } from './ChatUIComponents';
import { presetChats } from './presetChats';
import UsersIcon from '../icons/UsersIcon';

interface PresetChatModalProps {
  isOpen: boolean;
  onConfirm: (selectedPresets: PresetChat[]) => void;
  onSkip: () => void;
  isFirstTimeSetup: boolean;
}

const PresetChatModal: React.FC<PresetChatModalProps> = ({ isOpen, onConfirm, onSkip, isFirstTimeSetup }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const agents = useAgentStore(state => state.agents);

    useEffect(() => {
        if (isOpen) {
            // Pre-select the default chats for the first-time setup
            const defaultIds = isFirstTimeSetup ? new Set(presetChats.filter(p => p.isDefault).map(p => p.id)) : new Set();
            setSelectedIds(defaultIds);
        }
    }, [isOpen, isFirstTimeSetup]);

    const toggleSelection = (presetId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(presetId)) {
                newSet.delete(presetId);
            } else {
                newSet.add(presetId);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        const selectedPresets = presetChats.filter(p => selectedIds.has(p.id));
        if (selectedPresets.length > 0) {
            onConfirm(selectedPresets);
        } else if (!isFirstTimeSetup) {
             // If not first time, closing without selection is just a cancel
            onSkip();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onSkip}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                        <UsersIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isFirstTimeSetup ? "Welcome! Let's Set Up Your Chats" : "Create from Presets"}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Select from our recommended setups to get started instantly.
                        </p>
                    </div>
                </div>

                <div className="my-6 space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {presetChats.map(preset => {
                        const participants = agents.filter(a => preset.participantIds.includes(a.id));
                        return (
                             <button
                                key={preset.id}
                                onClick={() => toggleSelection(preset.id)}
                                className={`w-full text-left p-3 flex items-center gap-3 rounded-lg border-2 transition-colors ${selectedIds.has(preset.id) ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}
                            >
                               <div className="flex-shrink-0">
                                 <ParticipantAvatarStack agents={participants} size="sm" />
                               </div>
                               <div className="flex-1">
                                    <p className="font-semibold">{preset.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{preset.description}</p>
                               </div>
                            </button>
                        );
                    })}
                </div>

                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {isFirstTimeSetup && (
                         <button
                            onClick={onSkip}
                            className="px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                            Maybe Later
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800"
                    >
                        {`Create ${selectedIds.size} Chat${selectedIds.size === 1 ? '' : 's'}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PresetChatModal;
