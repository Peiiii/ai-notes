import { useChatStore } from '../stores/chatStore';
import { useNotesStore } from '../stores/notesStore';
import { useAgentStore } from '../stores/agentStore';
import { ChatMessage, Note, ChatSession, AIAgent, DiscussionMode } from '../types';
// Fix: Import 'generateThreadChatResponse' to resolve 'Cannot find name' error.
import { getAgentResponse, getModeratorResponse, getAgentToolResponse, searchNotesInCorpus, generateThreadChatResponse } from '../services/aiService';
import { NotesManager } from './NotesManager';

const discussionModeNames: Record<DiscussionMode, string> = {
    concurrent: 'Concurrent',
    turn_based: 'Turn-Based',
    moderated: 'Moderated',
};

export class ChatManager {
    private notesManager: NotesManager;

    constructor(notesManager: NotesManager) {
        this.notesManager = notesManager;
    }

    createSession = (participantIds: string[], discussionMode: DiscussionMode): string => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => participantIds.includes(a.id));
        if (participants.length === 0) {
            throw new Error("Cannot create a session with no participants.");
        }

        const sessionName = this.generateSessionName(participants);

        const newSession: ChatSession = {
            id: crypto.randomUUID(),
            name: sessionName,
            participantIds,
            history: [],
            createdAt: Date.now(),
            discussionMode,
        };

        useChatStore.setState(state => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: newSession.id,
        }));
        
        return newSession.id;
    }
    
    addAgentsToSession = (sessionId: string, agentIdsToAdd: string[]) => {
        const { sessions, addMessage } = useChatStore.getState();
        const session = sessions.find(s => s.id === sessionId);
        if (!session || agentIdsToAdd.length === 0) return;

        const { agents } = useAgentStore.getState();
        const newParticipantIds = [...new Set([...session.participantIds, ...agentIdsToAdd])];
        
        const agentsAdded = agents.filter(a => agentIdsToAdd.includes(a.id));
        if (agentsAdded.length === 0) return;

        const agentNames = agentsAdded.map(a => a.name).join(', ');
        const systemMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `${agentNames} ${agentsAdded.length > 1 ? 'have' : 'has'} joined the conversation.`
        };
        
        const newParticipants = agents.filter(a => newParticipantIds.includes(a.id));
        const newSessionName = this.generateSessionName(newParticipants);

        useChatStore.getState().updateSession(sessionId, { participantIds: newParticipantIds, name: newSessionName });
        addMessage(sessionId, systemMessage);
    }

    updateSessionMode = (sessionId: string, newMode: DiscussionMode) => {
        const { sessions, updateSession, addMessage } = useChatStore.getState();
        const session = sessions.find(s => s.id === sessionId);
        if (!session || session.discussionMode === newMode) return;

        updateSession(sessionId, { discussionMode: newMode });
        
        const modeName = discussionModeNames[newMode] || newMode;
        const systemMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Discussion mode has been changed to ${modeName}.`
        };
        addMessage(sessionId, systemMessage);
    }
    
    clearSessionHistory = (sessionId: string) => {
        const { updateSession, addMessage } = useChatStore.getState();
        updateSession(sessionId, { history: [] });
        const systemMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Chat history cleared.`
        };
        addMessage(sessionId, systemMessage);
    }

    private generateSessionName = (participants: AIAgent[]): string => {
        if (participants.length === 0) return "Empty Chat";
        if (participants.length === 1) return `Chat with ${participants[0].name}`;
        
        const nameList = participants.map(p => p.name);
        if (participants.length <= 2) {
            return nameList.join(' & ');
        }
        
        return `${nameList.slice(0, 2).join(', ')} + ${participants.length - 2} more`;
    }

    sendMessageInSession = async (sessionId: string, message: string) => {
        const { sessions } = useChatStore.getState();
        const session = sessions.find(s => s.id === sessionId);
        if (!session || !message.trim()) return;

        const isCurrentlyStreaming = session.history.some(m => m.status === 'thinking' || m.status === 'streaming');
        if (isCurrentlyStreaming) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
            persona: 'User',
            status: 'complete',
        };

        useChatStore.getState().addMessage(sessionId, userMessage);
        
        switch (session.discussionMode) {
            case 'turn_based':
                await this._handleTurnBasedMessage(session, userMessage);
                break;
            case 'moderated':
                await this._handleModeratedMessage(session, userMessage);
                break;
            case 'concurrent':
            default:
                await this._handleConcurrentMessage(session, userMessage);
                break;
        }
    }

    private _handleConcurrentMessage = async (session: ChatSession, userMessage: ChatMessage) => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => session.participantIds.includes(a.id));
        const conversationHistoryForAI = [...session.history, userMessage].filter(m => m.role !== 'system');
        const participantNames = participants.map(p => p.name);

        const responsePromises = participants.map(agent => {
            return this._runAgentTurn(agent, conversationHistoryForAI, session.id, participantNames);
        });

        await Promise.all(responsePromises);
    }
    
    private _handleTurnBasedMessage = async (session: ChatSession, userMessage: ChatMessage) => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => session.participantIds.includes(a.id));
        const participantNames = participants.map(p => p.name);
        
        let turnHistory = [...session.history, userMessage].filter(m => m.role !== 'system');

        for (const agent of participants) {
            try {
                const newMessages = await this._runAgentTurn(agent, turnHistory, session.id, participantNames);
                turnHistory.push(...newMessages);
            } catch (error) {
                 console.error(`Error from agent ${agent.name} in turn-based mode:`, error);
                 // The error message is already added inside _runAgentTurn
                 break; // Stop the sequence on error
            }
        }
    }
    
    private async _runAgentTurn(agent: AIAgent, turnHistory: ChatMessage[], sessionId: string, allAgentNames: string[]): Promise<ChatMessage[]> {
        const { updateMessage, addMessage } = useChatStore.getState();
        let currentTurnHistory = [...turnHistory];
        const newMessagesForParentHistory: ChatMessage[] = [];
        
        const MAX_TOOL_CALLS = 5;
        let toolCallCount = 0;

        // Create initial placeholder
        const placeholderId = crypto.randomUUID();
        const placeholderMessage: ChatMessage = { id: placeholderId, role: 'model', content: '', persona: agent.name, status: 'thinking' };
        addMessage(sessionId, placeholderMessage);

        try {
            while (toolCallCount < MAX_TOOL_CALLS) {
                toolCallCount++;

                let response;
                // If only one agent is in the chat, use the simpler `getAgentResponse` which has broader instructions.
                // Otherwise, use the multi-agent specific `getAgentToolResponse`.
                if (allAgentNames.length <= 1) {
                    response = await getAgentResponse(currentTurnHistory, undefined, agent.systemInstruction);
                } else {
                    response = await getAgentToolResponse(currentTurnHistory, agent, allAgentNames);
                }
                
                // On the first loop, update the initial placeholder. On subsequent loops (after a tool call), create new messages.
                const messageId = toolCallCount === 1 ? placeholderId : crypto.randomUUID();

                const modelMessage: ChatMessage = {
                    id: messageId,
                    role: 'model',
                    content: response.text || '',
                    persona: agent.name,
                    status: 'complete',
                    toolCalls: response.toolCalls || undefined,
                    groundingChunks: response.groundingChunks || undefined,
                };
                
                if (toolCallCount === 1) {
                    updateMessage(sessionId, messageId, modelMessage);
                } else {
                    addMessage(sessionId, modelMessage);
                }

                currentTurnHistory.push(modelMessage);
                newMessagesForParentHistory.push(modelMessage);

                if (!response.toolCalls || response.toolCalls.length === 0) {
                    break; // Agent's turn is over, no more tools to call.
                }
                
                // If there are tool calls, process them.
                for (const call of response.toolCalls) {
                    let toolResultContent = "An unknown error occurred with the tool.";
                    let structuredContent: ChatMessage['structuredContent'] | undefined;
                    
                    try {
                        if (call.name === 'create_note') {
                            const { title, content } = call.args;
                            const newNote = this.notesManager.createNewTextNote();
                            this.notesManager.updateNote(newNote.id, { title, content });
                            toolResultContent = `Successfully created note titled "${title}".`;
                            structuredContent = { type: 'create_note_result', message: toolResultContent, noteId: newNote.id, title };
                        } else if (call.name === 'search_notes') {
                            const { query } = call.args;
                            const notes = useNotesStore.getState().notes;
                            const results = await searchNotesInCorpus(query as string, notes);
                            toolResultContent = `Found ${results.length} notes matching query: "${query}".`;
                            structuredContent = { type: 'search_result', notes: results };
                        }
                    } catch(e) {
                        console.error("Error executing tool:", e);
                        toolResultContent = `Error executing tool ${call.name}: ${e instanceof Error ? e.message : String(e)}`;
                    }

                    const toolMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'tool',
                        content: toolResultContent,
                        tool_call_id: call.id,
                        toolCalls: [{...call}], // Carry over the call info
                        structuredContent,
                    };

                    addMessage(sessionId, toolMessage);
                    currentTurnHistory.push(toolMessage);
                    newMessagesForParentHistory.push(toolMessage);
                }
            }
        } catch (error) {
            console.error(`Error during agent ${agent.name}'s turn:`, error);
            updateMessage(sessionId, placeholderId, {
                content: "Sorry, I encountered an error and cannot respond.",
                status: 'error',
            });
            // Propagate error to stop turn-based sequence
            throw error;
        }

        return newMessagesForParentHistory;
    }

    private _handleModeratedMessage = async (session: ChatSession, userMessage: ChatMessage) => {
        const { agents } = useAgentStore.getState();
        const participants = agents.filter(a => session.participantIds.includes(a.id));
        const participantNames = participants.map(p => p.name);
        
        let turnHistory = [...session.history, userMessage].filter(m => m.role !== 'system');
        const spokenAgentNames = new Set<string>();
        let turns = 0;
        const MAX_TURNS = participants.length + 3; // Prevent infinite loops

        while (turns < MAX_TURNS) {
            turns++;
            const moderatorResponse = await getModeratorResponse(turnHistory, participantNames, Array.from(spokenAgentNames));
            const toolCall = moderatorResponse.toolCalls?.[0];

            if (!toolCall || toolCall.name === 'pass_control_to_user') {
                const reason = toolCall?.args.reason || "The discussion goal has been met.";
                const systemMessage: ChatMessage = {
                    id: crypto.randomUUID(), role: 'system', content: `[Moderator]: ${reason}`
                };
                useChatStore.getState().addMessage(session.id, systemMessage);
                break;
            }

            if (toolCall.name === 'select_next_speaker') {
                const agentName = toolCall.args.agent_name as string;
                const reason = toolCall.args.reason as string;
                const nextAgent = participants.find(p => p.name === agentName);
                
                if (!nextAgent) {
                    console.warn(`Moderator chose an invalid agent: ${agentName}`);
                    continue;
                }
                
                const reasonMessage: ChatMessage = {
                    id: crypto.randomUUID(), role: 'system', content: `[Moderator chose ${agentName}]: ${reason}`
                };
                useChatStore.getState().addMessage(session.id, reasonMessage);

                try {
                    const newMessages = await this._runAgentTurn(nextAgent, turnHistory, session.id, participantNames);
                    turnHistory.push(...newMessages);
                    spokenAgentNames.add(nextAgent.name);
                } catch (error) {
                    console.error(`Error during agent ${nextAgent.name}'s turn:`, error);
                    // Error message is already added inside _runAgentTurn, so we just break the loop.
                    break;
                }
            }
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
            // Note: Thread chat is simple, so we keep the old text-only generation.
            // If it needed tools, we would refactor this to use `_runAgentTurn`.
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
