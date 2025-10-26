
import React from 'react';
import { PresenterProvider, usePresenter } from './presenter';
import { useAppStore } from './stores/appStore';
import { useNotesStore } from './stores/notesStore';
import { useChatStore } from './stores/chatStore';
import { useStudioStore } from './stores/studioStore';
import { useWikiStore } from './stores/wikiStore';

import NoteList from './components/note/NoteList';
import NoteEditor from './components/note/NoteEditor';
import Studio from './components/studio/Studio';
import ChatView from './components/chat/ChatView';
import PulseReportModal from './components/studio/PulseReportModal';
import WikiStudio from './components/wiki/WikiStudio';

function AppContent() {
  const presenter = usePresenter();

  // Subscribe to state from stores
  const { viewMode, activeNoteId, initialWikiHistory, viewingPulseReport } = useAppStore();
  const { notes, generatingTitleIds } = useNotesStore();
  const { chatHistory, isChatting } = useChatStore();
  const { aiSummary, myTodos, isLoadingAI, isLoadingPulse, pulseReports } = useStudioStore();
  const { wikis, wikiTopics, isLoadingWikiTopics } = useWikiStore();

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
      case 'wiki_studio':
        return (
          <WikiStudio
            notes={notes}
            wikis={wikis}
            onGenerateWiki={presenter.wikiManager.generateWiki}
            onRegenerateWiki={presenter.wikiManager.regenerateWiki}
            // Fix: Property 'generateSubTopics' does not exist on type 'WikiManager'. This is fixed by adding the method to WikiManager.
            onGenerateSubTopics={presenter.wikiManager.generateSubTopics}
            aiTopics={wikiTopics}
            isLoadingTopics={isLoadingWikiTopics}
            initialHistory={initialWikiHistory}
            onUpdateWiki={presenter.wikiManager.updateWikiWithTopics}
          />
        );
      case 'editor':
      default:
        return <NoteEditor
          note={activeNote}
          onUpdateNote={presenter.notesManager.updateNoteContent}
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
          onNewNote={presenter.handleNewNote}
          onDeleteNote={presenter.handleDeleteNote}
          onShowStudio={presenter.handleShowStudio}
          onShowChat={presenter.handleShowChat}
          onShowWikiStudio={presenter.handleShowWikiStudio}
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
      <AppContent />
    </PresenterProvider>
  );
}

export default App;
