
import { useChatStore } from '../stores/chatStore';
import { useNotesStore } from '../stores/notesStore';
import { useCommandStore } from '../stores/commandStore';
import { ChatMessage, Note, ToolCall } from '../types';
import { getAgentResponse, searchNotesInCorpus, generateThreadChatResponse, generateProactiveSuggestions } from '../services/aiService';
import { NotesManager } from './NotesManager';

export class ChatManager {
    private notesManager: NotesManager;

    constructor(notesManager: NotesManager) {
        this.notesManager = notesManager;
    }

    fetchProactiveSuggestions = async () => {
        const { isLoadingSuggestions, chatHistory } = useChatStore.getState();
        if (isLoadingSuggestions || chatHistory.length > 0) {
            // Don't fetch if already loading or if there's a conversation history
            return;
        }

        useChatStore.setState({ isLoadingSuggestions: true, proactiveSuggestions: [] });
        try {
            const notes = useNotesStore.getState().notes;
            const suggestions = await generateProactiveSuggestions(notes);
            useChatStore.setState({ proactiveSuggestions: suggestions });
        } catch (error) {
            console.error("Failed to fetch proactive suggestions:", String(error));
            // Silently fail, don't show an error to the user
            useChatStore.setState({ proactiveSuggestions: [] });
        } finally {
            useChatStore.setState({ isLoadingSuggestions: false });
        }
    }

    sendChatMessage = async (message: string) => {
        if (!message.trim() || useChatStore.getState().chatStatus) return;
        
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
        };
        
        useChatStore.setState(state => ({
            chatHistory: [...state.chatHistory, userMessage],
            chatStatus: 'Thinking...',
            proactiveSuggestions: [],
        }));

        try {
            let command;
            if (message.startsWith('/')) {
                const commandName = message.trim().split(' ')[0].substring(1);
                const allCommands = useCommandStore.getState().getCommands();
                command = allCommands.find(c => c.name === commandName);
            }

            let conversationHistoryForAI = [...useChatStore.getState().chatHistory];
            let sourceNotesForFinalAnswer: Note[] = [];

            // Agent loop
            for (let i = 0; i < 5; i++) { // Add a safety break
                const response = await getAgentResponse(conversationHistoryForAI, i === 0 ? command : undefined);

                if (response.toolCalls && response.toolCalls.length > 0) {
                    const toolCalls = response.toolCalls;

                    const toolRequestMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'model',
                        content: response.text || '', // Can contain text like "Okay, I will search for that."
                        toolCalls: toolCalls,
                    };

                    // Update UI with the tool call request
                    useChatStore.setState(state => ({
                        chatHistory: [...state.chatHistory, toolRequestMessage],
                        chatStatus: 'Using tools...',
                    }));
                    
                    conversationHistoryForAI.push(toolRequestMessage);

                    const toolResponses = await Promise.all(
                        toolCalls.map(async (call: ToolCall): Promise<ChatMessage> => {
                            let toolResultContent = '';
                            let structuredContent: ChatMessage['structuredContent'] | undefined = undefined;

                            if (call.name === 'search_notes') {
                                const { query } = call.args;
                                const allNotes = useNotesStore.getState().notes;
                                const relevantNotes = await searchNotesInCorpus(query as string, allNotes);
                                sourceNotesForFinalAnswer = relevantNotes;
                                
                                if (relevantNotes.length > 0) {
                                    toolResultContent = `Found ${relevantNotes.length} relevant notes.`;
                                    structuredContent = { type: 'search_result', notes: relevantNotes };
                                } else {
                                    toolResultContent = "No relevant notes were found for that query.";
                                }
                            } else if (call.name === 'create_note') {
                                const { title, content } = call.args;
                                const newNote = this.notesManager.createNewTextNote();
                                this.notesManager.updateNote(newNote.id, { title: title as string, content: content as string });
                                toolResultContent = `Successfully created a new note titled "${title}".`;
                                structuredContent = { type: 'create_note_result', message: toolResultContent, noteId: newNote.id, title: title as string };
                            }
                            
                            return {
                                id: crypto.randomUUID(),
                                role: 'tool',
                                content: toolResultContent,
                                tool_call_id: call.id, // For OpenAI
                                toolCalls: [call], // For Gemini
                                structuredContent,
                            };
                        })
                    );
                    
                    // Update UI with tool results
                    useChatStore.setState(state => ({
                        chatHistory: [...state.chatHistory, ...toolResponses],
                        chatStatus: 'Thinking...',
                    }));
                    
                    conversationHistoryForAI.push(...toolResponses);
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
            console.error("Agent chat failed:", String(error));
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
            console.error("Thread chat failed:", String(error));
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
}