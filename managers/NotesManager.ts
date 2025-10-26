
import { useNotesStore } from '../stores/notesStore';
import { Note } from '../types';
import { generateTitleForNote } from '../services/aiService';

const TITLE_GENERATION_LENGTH_THRESHOLD = 70;

export class NotesManager {
    private notesNeedingTitle = new Map<string, string>();
    private isProcessingTitles = false;

    private processTitleQueue = async () => {
        if (this.isProcessingTitles || this.notesNeedingTitle.size === 0) return;
        this.isProcessingTitles = true;

        const notesToProcess = new Map(this.notesNeedingTitle);
        this.notesNeedingTitle.clear();
        
        useNotesStore.setState(state => ({
            generatingTitleIds: new Set([...state.generatingTitleIds, ...notesToProcess.keys()])
        }));

        const promises = Array.from(notesToProcess.entries()).map(async ([id, content]) => {
            try {
                const generatedTitle = await generateTitleForNote(content);
                if (generatedTitle) {
                    useNotesStore.setState(state => ({
                        notes: state.notes.map(note => 
                            (note.id === id && !note.title) ? { ...note, title: generatedTitle } : note
                        )
                    }));
                }
            } catch (error) {
                console.error(`Failed to generate title for note ${id}:`, error);
            } finally {
                useNotesStore.setState(state => {
                    const newSet = new Set(state.generatingTitleIds);
                    newSet.delete(id);
                    return { generatingTitleIds: newSet };
                });
            }
        });

        await Promise.all(promises);
        this.isProcessingTitles = false;
        if (this.notesNeedingTitle.size > 0) {
            this.processTitleQueue();
        }
    }

    createNewNote({ title = '', content = '' } = {}): Note {
        const newNote: Note = {
            id: crypto.randomUUID(),
            title,
            content,
            createdAt: Date.now(),
        };
        useNotesStore.setState(state => ({ notes: [newNote, ...state.notes] }));
        return newNote;
    }

    deleteNoteById(id: string) {
        useNotesStore.setState(state => ({
            notes: state.notes.filter(note => note.id !== id)
        }));
    }

    updateNoteContent = (id: string, title: string, content: string) => {
        useNotesStore.setState(state => {
            const newNotes = state.notes.map(note =>
                note.id === id ? { ...note, title, content } : note
            );

            const updatedNote = newNotes.find(n => n.id === id);
            const shouldGenerateTitle = updatedNote && !updatedNote.title && updatedNote.content.length > TITLE_GENERATION_LENGTH_THRESHOLD;
            
            if (shouldGenerateTitle && !state.generatingTitleIds.has(id) && !this.notesNeedingTitle.has(id)) {
                this.notesNeedingTitle.set(id, updatedNote.content);
                setTimeout(() => this.processTitleQueue(), 500);
            }

            return { notes: newNotes };
        });
    }
}