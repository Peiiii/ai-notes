import { useChatStore } from '../stores/chatStore';
import { useNotesStore } from '../stores/notesStore';
import { useCommandStore } from '../stores/commandStore';
import { ChatMessage, Note } from '../types';
// FIX: Imported `generateThreadChatResponse` to resolve reference error.
import { getAgentResponse, searchNotesInCorpus, generateThreadChatResponse } from '../services/aiService';
import { NotesManager } from './NotesManager';
import { FunctionCall } from '@google/genai';

export class ChatManager {
    private notesManager: NotesManager;

    constructor(notesManager: NotesManager) {
        this.notesManager = notesManager;
    }

    sendChatMessage = async (message: string) => {
        if (!message.trim() || useChatStore.getState().chatStatus) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
        };
        
        const history = [...useChatStore.getState().chatHistory, userMessage];
        useChatStore.setState({
            chatHistory: history,
            chatStatus: 'Thinking...',
        });

        try {
            let command;
            if (message.startsWith('/')) {
                const commandName = message.trim().split(' ')[0].substring(1);
                const allCommands = useCommandStore.getState().getCommands();
                command = allCommands.find(c => c.name === commandName);
            }

            let currentHistory = [...history];
            let sourceNotesForFinalAnswer: Note[] = [];

            // Agent loop
            while (true) {
                // Pass the command on the first turn of the loop
                const response = await getAgentResponse(currentHistory, command);
                command = undefined; // Ensure command is only sent once

                if (response.toolCalls && response.toolCalls.length > 0) {
                    const toolCalls = response.toolCalls;

                    const toolRequestMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'model',
                        content: '', // No text content for tool requests
                        toolCalls: toolCalls,
                    };
                    currentHistory.push(toolRequestMessage);

                    const toolResponses: ChatMessage[] = await Promise.all(
                        toolCalls.map(async (call: FunctionCall) => {
                            let toolResultContent = '';
                            if (call.name === 'search_notes') {
                                useChatStore.setState({ chatStatus: 'Searching notes...' });
                                const { query } = call.args;
                                const allNotes = useNotesStore.getState().notes;
                                const relevantNotes = await searchNotesInCorpus(query, allNotes);
                                sourceNotesForFinalAnswer = relevantNotes;
                                if (relevantNotes.length > 0) {
                                    toolResultContent = "Relevant notes found:\n" + relevantNotes.map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n---\n');
                                } else {
                                    toolResultContent = "No relevant notes were found for that query.";
                                }
                            } else if (call.name === 'create_note') {
                                useChatStore.setState({ chatStatus: 'Creating note...' });
                                const { title, content } = call.args;
                                const newNote = this.notesManager.createNewTextNote();
                                this.notesManager.updateNote(newNote.id, { title, content });
                                toolResultContent = `Successfully created a new note titled "${title}".`;
                            }
                            return {
                                id: crypto.randomUUID(),
                                role: 'tool',
                                content: toolResultContent,
                                toolCalls: [call],
                            };
                        })
                    );
                    
                    currentHistory.push(...toolResponses);
                    useChatStore.setState({ chatStatus: 'Thinking...' });

                } else { // It's a final text response
                    const modelMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'model',
                        content: response.text || "I'm not sure how to respond to that.",
                        ...(sourceNotesForFinalAnswer.length > 0 && {
                            sourceNotes: sourceNotesForFinalAnswer.map(n => ({ id: n.id, title: n.title || 'Untitled' }))
                        })
                    };
                    useChatStore.setState(state => ({
                        chatHistory: [...state.chatHistory, modelMessage]
                    }));
                    break; // Exit loop
                }
            }
        } catch (error) {
            console.error("Agent chat failed:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Sorry, I encountered an error. Please try again.",
            };
            useChatStore.setState(state => ({
                chatHistory: [...state.chatHistory, errorMessage]
            }));
        } finally {
            useChatStore.setState({ chatStatus: null });
        }
    }

    sendThreadChatMessage = async (noteId: string, message: string) => {
        // ... (existing implementation)
    }
}

// Re-exporting for brevity
ChatManager.prototype.sendThreadChatMessage = async function(noteId: string, message: string) {
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
};