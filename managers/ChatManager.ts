
import { useChatStore } from '../stores/chatStore';
import { useNotesStore } from '../stores/notesStore';
import { useAgentStore } from '../stores/agentStore';
import { useCommandStore } from '../stores/commandStore';
import { ChatMessage, Note, ToolCall, ChatSession } from '../types';
import { getAgentResponse, searchNotesInCorpus, generateThreadChatResponse } from '../services/aiService';
import { NotesManager } from './NotesManager';

export class ChatManager {
    private notesManager: NotesManager;

    constructor(notesManager: NotesManager) {
        this.notesManager = notesManager;
    }

    createSession = (participantIds: string[]): string => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => participantIds.includes(a.id));
        if (participants.length === 0) {
            throw new Error("Cannot create a session with no participants.");
        }

        const sessionName = participants.length > 1 
            ? `Group Chat with ${participants.map(p => p.name).slice(0, 2).join(', ')}${participants.length > 2 ? '...' : ''}`
            : `Chat with ${participants[0].name}`;

        const newSession: ChatSession = {
            id: crypto.randomUUID(),
            name: sessionName,
            participantIds,
            history: [],
            createdAt: Date.now(),
        };

        useChatStore.setState(state => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: newSession.id,
        }));
        
        return newSession.id;
    }

    sendMessageInSession = async (sessionId: string, message: string) => {
        const { chatStatus, sessions } = useChatStore.getState();
        if (!message.trim() || chatStatus) return;

        const session = sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error("Active session not found!");
            return;
        }

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
            persona: 'User',
        };

        this.addMessageToSession(sessionId, userMessage);
        useChatStore.setState({ chatStatus: 'Thinking...' });

        try {
            const { agents } = useAgentStore.getState();
            const participants = agents.filter(a => session.participantIds.includes(a.id));

            let systemInstruction = '';
            if (participants.length === 1) {
                systemInstruction = participants[0].systemInstruction;
            } else if (participants.length > 1) {
                const personaInstructions = participants
                    .map(p => `- ${p.name} (${p.description}): ${p.systemInstruction}`)
                    .join('\n\n');
                systemInstruction = `You are a team of AI assistants collaborating in a group chat. The user can see messages from each of you. Your goal is to provide a comprehensive answer by synthesizing your unique perspectives.
Here are the members of this chat and their roles:

${personaInstructions}

Based on the user's latest message, have one or more AI assistants respond. Format your response clearly, indicating which AI is speaking. For example:
"[AI Name]: Here is my perspective..."
"[Another AI]: Building on that, I think..."`;
            }

            let command;
            if (message.startsWith('/')) {
                const commandName = message.trim().split(' ')[0].substring(1);
                const allCommands = useCommandStore.getState().getCommands();
                command = allCommands.find(c => c.name === commandName);
            }
            
            const sessionHistory = useChatStore.getState().sessions.find(s => s.id === sessionId)?.history || [];
            let conversationHistoryForAI = [...sessionHistory];
            let sourceNotesForFinalAnswer: Note[] = [];

            for (let i = 0; i < 5; i++) { // Safety break
                const response = await getAgentResponse(conversationHistoryForAI, i === 0 ? command : undefined, systemInstruction);

                if (response.toolCalls && response.toolCalls.length > 0) {
                    const toolCalls = response.toolCalls;
                    const modelPersona = participants.length === 1 ? participants[0].name : "Group AI";

                    const toolRequestMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'model',
                        content: response.text || '',
                        toolCalls: toolCalls,
                        persona: modelPersona,
                    };

                    this.addMessageToSession(sessionId, toolRequestMessage);
                    useChatStore.setState({ chatStatus: 'Using tools...' });
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
                                tool_call_id: call.id,
                                toolCalls: [call],
                                structuredContent,
                            };
                        })
                    );
                    
                    toolResponses.forEach(res => this.addMessageToSession(sessionId, res));
                    useChatStore.setState({ chatStatus: 'Thinking...' });
                    conversationHistoryForAI.push(...toolResponses);
                } else {
                    const modelPersona = participants.length === 1 ? participants[0].name : "Group AI";
                    const modelMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'model',
                        content: response.text || "I'm not sure how to respond to that.",
                        persona: modelPersona,
                        ...(sourceNotesForFinalAnswer.length > 0 && {
                            sourceNotes: sourceNotesForFinalAnswer.map(n => ({ id: n.id, title: n.title || 'Untitled' }))
                        })
                    };
                    this.addMessageToSession(sessionId, modelMessage);
                    break; // Exit loop
                }
            }
        } catch (error) {
            console.error("Agent chat failed:", String(error));
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Sorry, I encountered an error. Please try again.",
                persona: "System",
            };
            this.addMessageToSession(sessionId, errorMessage);
        } finally {
            useChatStore.setState({ chatStatus: null });
        }
    }

    private addMessageToSession(sessionId: string, message: ChatMessage) {
        useChatStore.setState(state => ({
            sessions: state.sessions.map(session =>
                session.id === sessionId
                    ? { ...session, history: [...session.history, message] }
                    : session
            ),
        }));
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
