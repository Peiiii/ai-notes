
import React from 'react';
import { PresenterProvider, usePresenter } from './presenter';
import { useAppStore } from './stores/appStore';
import { useNotesStore } from './stores/notesStore';
import { useChatStore } from './stores/chatStore';
import { useStudioStore } from './stores/studioStore';
import { useWikiStore } from './stores/wikiStore';
import { useParliamentStore } from './stores/parliamentStore';

import NoteList from './components/note/NoteList';
import NoteEditor from './components/note/NoteEditor';
import Studio from './components/studio/Studio';
import ChatView from './components/chat/ChatView';
import PulseReportModal from './components/studio/PulseReportModal';
import WikiStudio from './components/wiki/WikiStudio';
import ParliamentView from './components/parliament/ParliamentView';
import ErrorBoundary from './components/ui/ErrorBoundary';


function AppContent() {
  const presenter = usePresenter();

  // Subscribe to state from stores
  const { viewMode, activeNoteId, initialWikiHistory, viewingPulseReport } = useAppStore();
  const { notes, generatingTitleIds } = useNotesStore();
  const { chatHistory, isChatting } = useChatStore();
  const { aiSummary, myTodos, isLoadingAI, isLoadingPulse, pulseReports } = useStudioStore();
  const { wikis, wikiTopics, isLoadingWikiTopics } = useWikiStore();
  const { topics, isLoadingTopics, sessionHistory, isSessionActive, currentSession } = useParliamentStore();


  const activeNote = notes.find((note) => note.id === activeNoteId) || null;

  const renderMainView = () => {
    switch (viewMode) {
      case 'studio':
        return (
          <Studio
            suggestedTodos={aiSummary?.todos || []}
            myTodos={myTodos}
            knowledgeCards={aiSummary?.knowledgeCards || []}
            pulseReports={pulseReports}
            onToggleTodo={presenter.studioManager.toggleTodo}
            onAdoptTodo={presenter.studioManager.adoptTodo}
            onCardToNote={presenter.handleCardToNote}
            isLoadingPulse={isLoadingPulse}
            onGeneratePulse={() => presenter.studioManager.generateNewPulseReport()}
            onViewPulseReport={presenter.appManager.setViewingPulseReport}
          />
        );
      case 'chat':
        return (
          <ChatView
            chatHistory={chatHistory}
            isChatting={isChatting}
            onSendMessage={presenter.chatManager.sendChatMessage}
          />
        );
      case 'wiki':
        return (
          <WikiStudio
            notes={notes}
            wikis={wikis}
            onGenerateWiki={presenter.wikiManager.generateWiki}
            onRegenerateWiki={presenter.wikiManager.regenerateWiki}
            onGenerateSubTopics={presenter.wikiManager.generateSubTopics}
            aiTopics={wikiTopics}
            isLoadingTopics={isLoadingWikiTopics}
            initialHistory={initialWikiHistory}
            onUpdateWiki={presenter.wikiManager.updateWikiWithTopics}
          />
        );
      case 'parliament':
        return (
          <ParliamentView
            notes={notes}
            topics={topics}
            isLoadingTopics={isLoadingTopics}
            sessionHistory={sessionHistory}
            isSessionActive={isSessionActive}
            currentSession={currentSession}
            onStartDebate={presenter.parliamentManager.startDebate}
            onStartPodcast={presenter.parliamentManager.startPodcast}
            onResetSession={presenter.parliamentManager.resetSession}
            onSaveSynthesis={presenter.handleSaveDebateSynthesisAsNote}
          />
        );
      case 'editor':
      default:
        return <NoteEditor
          note={activeNote}
          onUpdateNote={(id, title, content) => presenter.notesManager.updateNote(id, { title, content })}
          wikis={wikis}
          onViewWikiInStudio={presenter.handleViewWikiInStudio}
        />;
    }
  };

  return (
    <div className="h-screen w-screen flex antialiased text-slate-800 dark:text-slate-200">
      <div className="w-full max-w-xs md:w-1/3 md:max-w-sm lg:w-1/4 border-r border-slate-200 dark:border-slate-700">
        <NoteList
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={presenter.handleSelectNote}
          onNewTextNote={presenter.handleNewTextNote}
          onDeleteNote={presenter.handleDeleteNote}
          onShowStudio={presenter.handleShowStudio}
          onShowChat={presenter.handleShowChat}
          onShowWiki={presenter.handleShowWiki}
          onShowParliament={presenter.handleShowParliament}
          isLoadingAI={isLoadingAI}
          generatingTitleIds={generatingTitleIds}
          viewMode={viewMode}
        />
      </div>
      <main className="flex-1">{renderMainView()}</main>
      <PulseReportModal 
        report={viewingPulseReport} 
        onClose={() => presenter.appManager.setViewingPulseReport(null)} 
      />
    </div>
  );
}


function App() {
  return (
    <PresenterProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </PresenterProvider>
  );
}

export default App;