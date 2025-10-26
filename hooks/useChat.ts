import { useState } from 'react';
import { ChatMessage, Note } from '../types';
import useLocalStorage from './useLocalStorage';
import { generateChatResponse } from '../services/aiService';

export function useChat() {
    const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('ai-notes-chathistory', []);
    const [isChatting, setIsChatting] = useState(false);

    const sendChatMessage = async (message: string, notes: Note[]) => {
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
    
    return {
        chatHistory,
        isChatting,
        sendChatMessage,
    };
}