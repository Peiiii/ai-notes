import React, { useState } from 'react';
import { Note, KnowledgeCard, ViewMode, WikiEntry } from './types';
import { generateSubTopics } from './services/aiService';
import { useNotes } from './hooks/useNotes';
import { useChat } from './hooks/useChat';
import { useStudioAndPulse } from './hooks/useStudioAndPulse';
import { useWiki } from './hooks/useWiki';

import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Studio from './components/Studio';
import ChatView from './components/ChatView';
import PulseReportModal from './components/PulseReportModal';
import WikiStudio from './components/WikiStudio';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  const {
    notes,
    activeNoteId,
    setActiveNoteId,
    activeNote,
    generatingTitleIds,
    createNewNote,
    deleteNoteById,
    updateNoteContent,
  } = useNotes();

  const {
    chatHistory,
    isChatting,
    sendChatMessage,
  } = useChat();

  const {
    aiSummary,
    myTodos,
    isLoadingAI,
    isLoadingPulse,
    pulseReports,
    viewingPulseReport,
    setViewingPulseReport,
    generateNewSummary,
    toggleTodo,
    adoptTodo,
    generateNewPulseReport,
  } = useStudioAndPulse(notes);

  const {
    wikis,
    wikiTopics,
    isLoadingWikiTopics,
    initialWikiHistory,
    setInitialWikiHistory,
    fetchWikiTopics,
    generateWiki,
    updateWikiWithTopics,
    regenerateWiki,
    deleteWikisBySourceNoteId,
  } = useWiki(notes);

  // --- Handlers that orchestrate hooks ---

  const handleNewNote = () => {
    const newNote = createNewNote();
    setActiveNoteId(newNote.id);
    setViewMode('editor');
  };

  const handleDeleteNote = (id: string) => {
    // Call functions from two different hooks
    deleteNoteById(id);
    deleteWikisBySourceNoteId(id);
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    setViewMode('editor');
  };

  const handleShowChat = () => {
    setViewMode('chat');
    setActiveNoteId(null);
  };

  const handleShowStudio = () => {
    setViewMode('studio');
    setActiveNoteId(null);
    generateNewSummary();
  };

  const handleShowWikiStudio = () => {
    setInitialWikiHistory(null); // Clear any deep links
    setViewMode('wiki_studio');
    setActiveNoteId(null);
    fetchWikiTopics();
  };

  const handleCardToNote = (card: KnowledgeCard) => {
    const newNote = createNewNote({ title: card.title, content: card.content });
    setActiveNoteId(newNote.id);
    setViewMode('editor');
  };

  const handleSendMessage = (message: string) => {
    sendChatMessage(message, notes);
  };

  const handleViewWikiInStudio = (wikiId: string) => {
    const targetWiki = wikis.find(w => w.id === wikiId);
    if (!targetWiki) return;

    const sourceNote = notes.find(n => n.id === targetWiki.sourceNoteId);
    if (!sourceNote) return;

    const historyPath: WikiEntry[] = [targetWiki];
    let current = targetWiki;
    while (current.parentId) {
      const parent = wikis.find(w => w.id === current.parentId);
      if (parent) {
        historyPath.unshift(parent);
        current = parent;
      } else {
        break; // Parent not found, stop traversing
      }
    }

    setInitialWikiHistory([sourceNote, ...historyPath]);
    setViewMode('wiki_studio');
    setActiveNoteId(null);
  };

  const renderMainView = () => {
    switch (viewMode) {
      case 'studio':
        return (
          <Studio
            suggestedTodos={aiSummary?.todos || []}
            myTodos={myTodos}
            knowledgeCards={aiSummary?.knowledgeCards || []}
            onToggleTodo={toggleTodo}
            onAdoptTodo={adoptTodo}
            onCardToNote={handleCardToNote}
            isLoadingPulse={isLoadingPulse}
            onGeneratePulse={generateNewPulseReport}
            pulseReports={pulseReports}
            onViewPulseReport={setViewingPulseReport}
          />
        );
      case 'chat':
        return (
          <ChatView
            chatHistory={chatHistory}
            isChatting={isChatting}
            onSendMessage={handleSendMessage}
          />
        );
      case 'wiki_studio':
        return (
          <WikiStudio
            notes={notes}
            wikis={wikis}
            onGenerateWiki={generateWiki}
            onRegenerateWiki={regenerateWiki}
            onGenerateSubTopics={generateSubTopics}
            aiTopics={wikiTopics}
            isLoadingTopics={isLoadingWikiTopics}
            initialHistory={initialWikiHistory}
            onUpdateWiki={updateWikiWithTopics}
          />
        );
      case 'editor':
      default:
        return <NoteEditor
          note={activeNote}
          onUpdateNote={updateNoteContent}
          wikis={wikis}
          onViewWikiInStudio={handleViewWikiInStudio}
        />;
    }
  };

  return (
    <div className="h-screen w-screen flex antialiased text-slate-800 dark:text-slate-200">
      <div className="w-full max-w-xs md:w-1/3 md:max-w-sm lg:w-1/4 border-r border-slate-200 dark:border-slate-700">
        <NoteList
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={handleSelectNote}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onShowStudio={handleShowStudio}
          onShowChat={handleShowChat}
          onShowWikiStudio={handleShowWikiStudio}
          isLoadingAI={isLoadingAI}
          generatingTitleIds={generatingTitleIds}
          viewMode={viewMode}
        />
      </div>
      <main className="flex-1">{renderMainView()}</main>
      <PulseReportModal report={viewingPulseReport} onClose={() => setViewingPulseReport(null)} />
    </div>
  );
}

export default App;