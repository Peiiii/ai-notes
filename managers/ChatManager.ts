import { useChatStore } from '../stores/chatStore';
import { useNotesStore } from '../stores/notesStore';
import { ChatMessage, Note } from '../types';
import { generateChatResponse, generateThreadChatResponse } from '../services/aiService';
import { NotesManager } from './NotesManager';

export class ChatManager {
    private notesManager: NotesManager;

    constructor(notesManager: NotesManager) {
        this.notesManager = notesManager;
    }

    sendChatMessage = async (message: string) => {
        if (!message.trim()) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
        };
        
        useChatStore.setState(state => ({
            chatHistory: [...state.chatHistory, userMessage],
            isChatting: true,
        }));

        try {
            const notes = useNotesStore.getState().notes;
            const currentHistory = useChatStore.getState().chatHistory;
            const responseContent = await generateChatResponse(notes, currentHistory, message);
            const modelMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: responseContent,
            };
            useChatStore.setState(state => ({
                chatHistory: [...state.chatHistory, modelMessage]
            }));
        } catch (error) {
            console.error("Chat failed:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Sorry, I encountered an error. Please try again.",
            };
            useChatStore.setState(state => ({
                chatHistory: [...state.chatHistory, errorMessage]
            }));
        } finally {
            useChatStore.setState({ isChatting: false });
        }
    }

    sendThreadChatMessage = async (noteId: string, message: string) => {
        if (!message.trim()) return;

        const note = useNotesStore.getState().notes.find(n => n.id === noteId);
        if (!note) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
        };

        useChatStore.setState({ isThreadChatting: true });
        this.notesManager.appendThreadMessage(noteId, userMessage);

        try {
            // Get the note with the new user message for context
            const updatedNote = useNotesStore.getState().notes.find(n => n.id === noteId)!;
            
            const responseContent = await generateThreadChatResponse(updatedNote, message);
            
            const modelMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: responseContent,
            };
            this.notesManager.appendThreadMessage(noteId, modelMessage);

        } catch (error) {
            console.error("Thread chat failed:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Sorry, I encountered an error. Please try again.",
            };
            this.notesManager.appendThreadMessage(noteId, errorMessage);
        } finally {
            useChatStore.setState({ isThreadChatting: false });
        }
    }
}