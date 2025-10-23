import React, { useState, useMemo, useEffect } from 'react';
import { Note, AISummary, Todo, KnowledgeCard } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { generateSummary, generateTitleForNote } from './services/geminiService';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Studio from './components/Studio';

type ViewMode = 'editor' | 'studio';

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

function App() {
  const [notes, setNotes] = useLocalStorage<Note[]>('ai-notes-app', []);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useLocalStorage<AISummary | null>('ai-notes-summary', null);
  const [myTodos, setMyTodos] = useLocalStorage<Todo[]>('ai-notes-mytodos', []);
  const [notesHashAtLastSummary, setNotesHashAtLastSummary] = useLocalStorage<string | null>('ai-notes-hash', null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  
  // State to queue notes for title generation
  const [notesNeedingTitle, setNotesNeedingTitle] = useState<Map<string, string>>(new Map());

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) || null,
    [notes, activeNoteId]
  );

  // Effect to process the title generation queue
  useEffect(() => {
    if (notesNeedingTitle.size === 0) {
      return;
    }

    notesNeedingTitle.forEach((content, id) => {
      (async () => {
        try {
          const generatedTitle = await generateTitleForNote(content);
          if (generatedTitle) {
            setNotes(prevNotes =>
              prevNotes.map(note => {
                // Apply title only if the note is the correct one AND still has no title
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
          // Remove from queue regardless of success/failure to prevent retries on the same content
          setNotesNeedingTitle(prevMap => {
            const newMap = new Map(prevMap);
            newMap.delete(id);
            return newMap;
          });
        }
      })();
    });
  }, [notesNeedingTitle, setNotes]);

  const handleNewNote = (title: string = '', content: string = '') => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
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
        setNotesNeedingTitle(prevMap => {
          // Only add if not already being processed to avoid duplicate calls
          if (!prevMap.has(id)) {
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
    handleNewNote(card.title, card.content);
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

  return (
    <div className="h-screen w-screen flex antialiased text-slate-800 dark:text-slate-200">
      <div className="w-full max-w-xs md:w-1/3 md:max-w-sm lg:w-1/4 border-r border-slate-200 dark:border-slate-700">
        <NoteList
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={handleSelectNote}
          onNewNote={() => handleNewNote()}
          onDeleteNote={handleDeleteNote}
          onShowStudio={handleShowStudio}
          isLoadingAI={isLoadingAI}
          viewMode={viewMode}
        />
      </div>
      <main className="flex-1">
        {viewMode === 'studio' ? (
          <Studio 
            suggestedTodos={aiSummary?.todos || []}
            myTodos={myTodos}
            knowledgeCards={aiSummary?.knowledgeCards || []}
            onToggleTodo={handleToggleTodo}
            onAdoptTodo={handleAdoptTodo}
            onCardToNote={handleCardToNote}
          />
        ) : (
          <NoteEditor note={activeNote} onUpdateNote={handleUpdateNote} />
        )}
      </main>
    </div>
  );
}

export default App;