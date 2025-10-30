import { IDiscussionStrategy } from './IDiscussionStrategy';
import { ChatSession, ChatMessage, AIAgent } from '../../types';
import { ChatManager } from '../ChatManager';
import { useAgentStore } from '../../stores/agentStore';

export class ConcurrentStrategy implements IDiscussionStrategy {
  public async handleMessage(
    manager: ChatManager,
    session: ChatSession,
    userMessage: ChatMessage,
    mentionedAgents: AIAgent[]
  ): Promise<void> {
    const { agents } = useAgentStore.getState();
    const allParticipants = agents.filter(a => session.participantIds.includes(a.id));
    
    const respondingAgents = mentionedAgents.length > 0 ? mentionedAgents : allParticipants;
    
    const conversationHistoryForAI = [...session.history, userMessage].filter(m => m.role !== 'system');
    const participantNames = allParticipants.map(p => p.name);

    const responsePromises = respondingAgents.map(agent => {
        return manager._runAgentTurn(agent, conversationHistoryForAI, session.id, participantNames);
    });

    await Promise.all(responsePromises);
  }
}
