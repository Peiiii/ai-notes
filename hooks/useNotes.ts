import { useState, useEffect } from 'react';
import { Note } from '../types';
import useLocalStorage from './useLocalStorage';
import { generateTitleForNote } from '../services/geminiService';

const TITLE_GENERATION_LENGTH_THRESHOLD = 70;

export function useNotes() {
    const [notes, setNotes] = useLocalStorage<Note[]>('ai-notes-app', []);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [notesNeedingTitle, setNotesNeedingTitle] = useState<Map<string, string>>(new Map());
    const [generatingTitleIds, setGeneratingTitleIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (notesNeedingTitle.size === 0) {
            return;
        }

        const notesToProcess = new Map(notesNeedingTitle);
        setNotesNeedingTitle(new Map());

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
                    setGeneratingTitleIds(prevSet => {
                        const newSet = new Set(prevSet);
                        newSet.delete(id);
                        return newSet;
                    });
                }
            })();
        });
    }, [notesNeedingTitle, setNotes]);

    const createNewNote = ({title = '', content = ''} = {}): Note => {
        const newNote: Note = {
            id: crypto.randomUUID(),
            title,
            content,
            createdAt: Date.now(),
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
        return newNote;
    };

    const deleteNoteById = (id: string) => {
        setNotes(prevNotes => prevNotes.filter((note) => note.id !== id));
    };

    const updateNoteContent = (id: string, title: string, content: string) => {
        setNotes(prevNotes => {
            const newNotes = prevNotes.map(note =>
                note.id === id ? { ...note, title, content } : note
            );

            const updatedNote = newNotes.find(n => n.id === id);
            const shouldGenerateTitle = updatedNote && !updatedNote.title && updatedNote.content.length > TITLE_GENERATION_LENGTH_THRESHOLD;

            if (shouldGenerateTitle) {
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
    
    const activeNote = notes.find((note) => note.id === activeNoteId) || null;

    return {
        notes,
        activeNoteId,
        setActiveNoteId,
        activeNote,
        generatingTitleIds,
        createNewNote,
        deleteNoteById,
        updateNoteContent,
    };
}
