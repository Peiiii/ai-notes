import { useChatStore } from '../stores/chatStore';
import { useNotesStore } from '../stores/notesStore';
import { ChatMessage } from '../types';
import { generateChatResponse } from '../services/aiService';

export class ChatManager {
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
}