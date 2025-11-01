import React, { useEffect, useMemo } from 'react';
import { usePresenter } from '../../presenter';
import { useChatStore } from '../../stores/chatStore';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ProactiveSuggestions from './ProactiveSuggestions';
import ChatInput from './ChatInput';
import ChatBubbleLeftRightIcon from '../icons/ChatBubbleLeftRightIcon';

const ChatPanel: React.FC = () => {
  const presenter = usePresenter();
  const { activeSessionId, sessions, suggestions, isLoadingSuggestions } = useChatStore();
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || null, [sessions, activeSessionId]);

  useEffect(() => {
    presenter.chatManager.fetchProactiveSuggestions();
  }, [activeSessionId, presenter.chatManager]);

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
          <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-xl font-semibold">Select a conversation</h2>
          <p className="max-w-sm mt-2">Choose a chat from the sidebar or start a new one to begin.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800/50">
      <ChatHeader />
      {activeSession.history.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <ProactiveSuggestions
              suggestions={suggestions}
              isLoading={isLoadingSuggestions}
              onSelectSuggestion={(prompt) => presenter.handleSendMessage(activeSession.id, prompt)}
            />
          </div>
        ) : (
          <ChatHistory />
      )}
      <ChatInput />
    </div>
  );
};

export default ChatPanel;