import React from 'react';
import { PresenterProvider, usePresenter } from './presenter';
import { useAppStore } from './stores/appStore';
import { useChatStore } from './stores/chatStore';
import { useAgentStore } from './stores/agentStore';
import NoteList from './components/note/NoteList';
import NoteEditor from './components/note/NoteEditor';
import Studio from './components/studio/Studio';
import ChatView from './components/chat/ChatView';
import PulseReportModal from './components/studio/PulseReportModal';
import WikiStudio from './components/wiki/WikiStudio';
import ParliamentView from './components/parliament/ParliamentView';
import ErrorBoundary from './components/ui/ErrorBoundary';
import CreateCommandModal from './components/chat/CreateCommandModal';
import AddAgentsModal from './components/chat/AddAgentsModal';
import ConfirmationModal from './components/ui/ConfirmationModal';
import RenameChatModal from './components/chat/RenameChatModal';
import NotePreviewSidebar from './components/ui/NotePreviewSidebar';
import AgentHubModal from './components/agent-hub/AgentHubModal';


function AppContent() {
  const presenter = usePresenter();
  const { viewMode, activeNoteId, viewingPulseReport, commandToCreate, activeModal, previewingNoteId, isAgentHubOpen } = useAppStore();
  const { activeSessionId, sessions } = useChatStore();
  const agents = useAgentStore(state => state.agents);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const renderMainView = () => {
    switch (viewMode) {
      case 'studio':
        return <Studio />;
      case 'chat':
        return <ChatView />;
      case 'wiki':
        return <WikiStudio />;
      case 'parliament':
        return <ParliamentView />;
      case 'editor':
      default:
        return <NoteEditor key={activeNoteId} />;
    }
  };

  const participants = activeSession ? agents.filter(a => activeSession.participantIds.includes(a.id)) : [];
  const availableAgentsToAdd = activeSession ? agents.filter(a => !activeSession.participantIds.includes(a.id)) : [];

  const handleGoToNoteFromPreview = (noteId: string) => {
    presenter.handleSelectNote(noteId);
    presenter.appManager.setPreviewingNoteId(null);
  };

  return (
    <div className="h-screen w-screen flex antialiased text-slate-800 dark:text-slate-200 overflow-x-hidden">
      {viewMode !== 'chat' && (
        <div className="w-full max-w-xs md:w-1/3 md:max-w-sm lg:w-1/4 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
          <NoteList />
        </div>
      )}
      <main className="flex-1 min-w-0">{renderMainView()}</main>
      <PulseReportModal 
        report={viewingPulseReport} 
        onClose={() => presenter.appManager.setViewingPulseReport(null)} 
      />
      <CreateCommandModal
        isOpen={!!commandToCreate}
        onClose={() => presenter.appManager.setCommandToCreate(null)}
        onCreateCommand={presenter.handleCreateCommand}
        initialCommandName={commandToCreate || ''}
      />
      <AgentHubModal
        isOpen={isAgentHubOpen}
        onClose={presenter.handleCloseAgentHub}
        presenter={presenter}
      />
       {activeSession && (
        <>
          <AddAgentsModal
            isOpen={activeModal === 'addAgents'}
            onClose={presenter.handleCloseModal}
            currentParticipants={participants}
            availableAgents={availableAgentsToAdd}
            onAddAgents={(agentIds) => presenter.handleAddAgentsToSession(activeSession.id, agentIds)}
          />
          <ConfirmationModal
            isOpen={activeModal === 'clearChatConfirm'}
            onClose={presenter.handleCloseModal}
            onConfirm={() => {
              presenter.handleClearSessionHistory(activeSession.id);
              presenter.handleCloseModal();
            }}
            title="Clear Chat History"
            message="Are you sure you want to clear this chat history? This action cannot be undone."
            confirmButtonText="Clear History"
            confirmButtonClassName="bg-red-600 hover:bg-red-700"
          />
          <RenameChatModal
            isOpen={activeModal === 'renameChat'}
            onClose={presenter.handleCloseModal}
            currentName={activeSession.name}
            onSave={(newName) => {
              presenter.handleRenameSession(activeSession.id, newName);
              presenter.handleCloseModal();
            }}
          />
        </>
      )}
      {previewingNoteId && (
        <NotePreviewSidebar
          noteId={previewingNoteId}
          onClose={() => presenter.appManager.setPreviewingNoteId(null)}
          onGoToNote={handleGoToNoteFromPreview}
        />
      )}
    </div>
  );
}


function App() {
  return (
    <PresenterProvider>
      {/* Fix: Wrap AppContent in ErrorBoundary to provide children and fix missing property error. */}
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </PresenterProvider>
  );
}

export default App;