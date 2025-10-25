import React, { useState, useMemo, useEffect } from 'react';
import { Note, AISummary, Todo, KnowledgeCard, ChatMessage, ViewMode, PulseReport, WikiEntry } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { generateSummary, generateTitleForNote, generateChatResponse, generatePulseReport, generateThreadResponse, generateWikiEntry, generateWikiTopics } from './services/geminiService';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Studio from './components/Studio';
import ChatView from './components/ChatView';
import PulseReportModal from './components/PulseReportModal';
import WikiStudio from './components/WikiStudio';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; 
  }
  return hash.toString();
}

const TITLE_GENERATION_LENGTH_THRESHOLD = 70;
const PULSE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

function App() {
  const [notes, setNotes] = useLocalStorage<Note[]>('ai-notes-app', []);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useLocalStorage<AISummary | null>('ai-notes-summary', null);
  const [myTodos, setMyTodos] = useLocalStorage<Todo[]>('ai-notes-mytodos', []);
  const [notesHashAtLastSummary, setNotesHashAtLastSummary] = useLocalStorage<string | null>('ai-notes-hash', null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('ai-notes-chathistory', []);
  const [isChatting, setIsChatting] = useState(false);
  
  const [notesNeedingTitle, setNotesNeedingTitle] = useState<Map<string, string>>(new Map());
  const [generatingTitleIds, setGeneratingTitleIds] = useState<Set<string>>(new Set());

  const [isLoadingPulse, setIsLoadingPulse] = useState(false);
  const [lastPulseTimestamp, setLastPulseTimestamp] = useLocalStorage<number | null>('ai-notes-pulse-timestamp', null);
  const [pulseReports, setPulseReports] = useLocalStorage<PulseReport[]>('ai-notes-pulse-reports', []);
  const [viewingPulseReport, setViewingPulseReport] = useState<PulseReport | null>(null);
  
  const [wikis, setWikis] = useLocalStorage<WikiEntry[]>('ai-notes-wikis', []);
  const [isGeneratingWiki, setIsGeneratingWiki] = useState(false);
  const [wikiTopics, setWikiTopics] = useState<string[]>([]);
  const [isLoadingWikiTopics, setIsLoadingWikiTopics] = useState(false);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) || null,
    [notes, activeNoteId]
  );
  
  // Effect for auto-generating Pulse Report
  useEffect(() => {
    const now = Date.now();
    const shouldAutoGenerate = !lastPulseTimestamp || (now - lastPulseTimestamp > PULSE_INTERVAL);
    if (shouldAutoGenerate && notes.length > 0) { 
      console.log("Auto-generating weekly Pulse report...");
      handleGeneratePulse(true); // isAuto flag to prevent view switching
    }
  }, []); // Runs once on app startup


  useEffect(() => {
    if (notesNeedingTitle.size === 0) {
      return;
    }

    const notesToProcess = new Map(notesNeedingTitle);
    setNotesNeedingTitle(new Map()); // Clear the processing queue immediately

    // Add notes to the generating set for UI feedback
    setGeneratingTitleIds(prevSet => {
        const newSet = new Set(prevSet);
        notesToProcess.forEach((_, id) => newSet.add(id));
        return newSet;
    });

    notesToProcess.forEach((content, id) => {
      (async () => {
        try {
          const generatedTitle = await generateTitleForNote(content);
          if (generatedTitle) {
            setNotes(prevNotes =>
              prevNotes.map(note => {
                if (note.id === id && !note.title) {
                  return { ...note, title: generatedTitle };
                }
                return note;
              })
            );
          }
        } catch (error) {
          console.error(`Failed to generate title for note ${id}:`, error);
        } finally {
          // Remove from generating set once done, regardless of success or failure
          setGeneratingTitleIds(prevSet => {
            const newSet = new Set(prevSet);
            newSet.delete(id);
            return newSet;
          });
        }
      })();
    });
  }, [notesNeedingTitle, setNotes]);

  const handleNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      createdAt: Date.now(),
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
    setViewMode('editor');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    setNotes(prevNotes => {
      const newNotes = prevNotes.map(note =>
        note.id === id ? { ...note, title, content } : note
      );

      const updatedNote = newNotes.find(n => n.id === id);
      const shouldGenerateTitle = updatedNote && !updatedNote.title && updatedNote.content.length > TITLE_GENERATION_LENGTH_THRESHOLD;
      
      if (shouldGenerateTitle) {
        // Prevent adding if already queued or currently being generated
        setNotesNeedingTitle(prevMap => {
          if (!prevMap.has(id) && !generatingTitleIds.has(id)) {
            const newMap = new Map(prevMap);
            newMap.set(id, updatedNote.content);
            return newMap;
          }
          return prevMap;
        });
      }
      
      return newNotes;
    });
  };

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    setViewMode('editor');
  };

  const handleShowChat = () => {
    setViewMode('chat');
    setActiveNoteId(null);
  };
  
  const handleShowWikiStudio = async () => {
    setViewMode('wiki_studio');
    setActiveNoteId(null);
    if (notes.length > 0 && wikiTopics.length === 0) {
      setIsLoadingWikiTopics(true);
      try {
        const topics = await generateWikiTopics(notes);
        setWikiTopics(topics);
      } catch (error) {
        console.error("Failed to fetch wiki topics", error);
        setWikiTopics([]); // Set empty on error
      } finally {
        setIsLoadingWikiTopics(false);
      }
    }
  }

  const handleToggleTodo = (id: string) => {
    setMyTodos(myTodos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleAdoptTodo = (todoToAdopt: Todo) => {
    setMyTodos(prev => [todoToAdopt, ...prev]);
    if (aiSummary) {
      const updatedSuggestedTodos = aiSummary.todos.filter(t => t.id !== todoToAdopt.id);
      setAiSummary({ ...aiSummary, todos: updatedSuggestedTodos });
    }
  };

  const handleCardToNote = (card: KnowledgeCard) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: card.title,
      content: card.content,
      createdAt: Date.now(),
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
    setViewMode('editor');
  };
  
  const handleShowStudio = async () => {
      setViewMode('studio');
      setActiveNoteId(null);

      const currentNotesHash = JSON.stringify(notes);
      
      if (notes.length > 0 && currentNotesHash !== notesHashAtLastSummary) {
        setIsLoadingAI(true);
        try {
            const rawSummary = await generateSummary(notes);
            
            const myTodoTexts = new Set(myTodos.map(t => t.text));

            const suggestedTodos = rawSummary.todos
              .filter(text => !myTodoTexts.has(text))
              .map((text: string): Todo => ({
                  id: simpleHash(text),
                  text,
                  completed: false,
              }));
            
            const knowledgeCardsWithIds = rawSummary.knowledgeCards.map((card): KnowledgeCard => ({
              ...card,
              id: simpleHash(card.title + card.content),
            }));

            setAiSummary({
              todos: suggestedTodos,
              knowledgeCards: knowledgeCardsWithIds,
            });

            setNotesHashAtLastSummary(currentNotesHash);
        } catch (error) {
            console.error(error);
            alert('Failed to analyze notes. Please check the console for details.');
        } finally {
            setIsLoadingAI(false);
        }
      }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
    };
    
    const currentHistory = [...chatHistory, userMessage];
    setChatHistory(currentHistory);
    setIsChatting(true);

    try {
      const responseContent = await generateChatResponse(notes, currentHistory, message);
      const modelMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: responseContent,
      };
       setChatHistory(prevHistory => [...prevHistory, modelMessage]);
    } catch (error) {
      console.error("Chat failed:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: "Sorry, I encountered an error. Please try again.",
      };
      setChatHistory(prevHistory => [...prevHistory, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleGeneratePulse = async (isAuto = false) => {
    setIsLoadingPulse(true);
    try {
      const reportData = await generatePulseReport(notes);
      const newReport: PulseReport = {
        id: crypto.randomUUID(),
        ...reportData,
        createdAt: Date.now(),
      };
      setPulseReports(prev => [newReport, ...prev]);
      setLastPulseTimestamp(Date.now());
    } catch (error) {
      console.error("Pulse report generation failed:", error);
      if (!isAuto) {
        alert("Failed to generate Pulse Report. Please check the console for details.");
      }
    } finally {
      setIsLoadingPulse(false);
    }
  };
  
  const handleViewPulseReport = (report: PulseReport) => {
    setViewingPulseReport(report);
  };
  
  const handleClosePulseReport = () => {
    setViewingPulseReport(null);
  }

  const handleGenerateWiki = async (term: string, sourceNoteId: string, contextContent: string): Promise<WikiEntry> => {
    setIsGeneratingWiki(true);
    try {
      const content = await generateWikiEntry(term, contextContent);
      const newWiki: WikiEntry = {
        id: crypto.randomUUID(),
        term,
        content,
        createdAt: Date.now(),
        sourceNoteId: sourceNoteId,
      };
      setWikis(prev => [...prev, newWiki]);
      return newWiki;
    } catch (error) {
        console.error("Wiki generation failed:", error);
        alert("Failed to generate Wiki entry. Please try again.");
        throw error;
    } finally {
        setIsGeneratingWiki(false);
    }
  }

  const renderMainView = () => {
    switch (viewMode) {
      case 'studio':
        return (
          <Studio
            suggestedTodos={aiSummary?.todos || []}
            myTodos={myTodos}
            knowledgeCards={aiSummary?.knowledgeCards || []}
            onToggleTodo={handleToggleTodo}
            onAdoptTodo={handleAdoptTodo}
            onCardToNote={handleCardToNote}
            isLoadingPulse={isLoadingPulse}
            onGeneratePulse={handleGeneratePulse}
            pulseReports={pulseReports}
            onViewPulseReport={handleViewPulseReport}
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
            onSelectNote={handleSelectNote}
            onGenerateWiki={handleGenerateWiki}
            isGeneratingWiki={isGeneratingWiki}
            aiTopics={wikiTopics}
            isLoadingTopics={isLoadingWikiTopics}
          />
        );
      case 'editor':
      default:
        return <NoteEditor 
          note={activeNote} 
          onUpdateNote={handleUpdateNote}
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
      <PulseReportModal report={viewingPulseReport} onClose={handleClosePulseReport} />
    </div>
  );
}

export default App;
