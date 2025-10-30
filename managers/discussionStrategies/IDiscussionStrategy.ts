import { ChatSession, ChatMessage, AIAgent } from '../../types';
import { ChatManager } from '../ChatManager';

export interface IDiscussionStrategy {
  handleMessage(
    manager: ChatManager,
    session: ChatSession,
    userMessage: ChatMessage,
    mentionedAgents: AIAgent[]
  ): Promise<void>;
}
