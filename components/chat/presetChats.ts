import { PresetChat } from '../../types';

export const presetChats: PresetChat[] = [
  {
    id: 'preset-companion',
    name: 'AI Companion',
    description: 'A one-on-one chat with your general-purpose AI assistant.',
    participantIds: ['default-companion'],
    discussionMode: 'concurrent',
    isDefault: true,
  },
  {
    id: 'preset-debate',
    name: 'Debate Chamber',
    description: 'Explore topics from multiple viewpoints with a Pragmatist, Visionary, and Ethicist.',
    participantIds: ['default-pragmatist', 'default-visionary', 'default-ethicist'],
    discussionMode: 'moderated',
    isDefault: true,
  },
  {
    id: 'preset-creative',
    name: 'Creative Council',
    description: 'Brainstorm stories, marketing copy, and novel ideas with a team of creative specialists.',
    participantIds: ['default-creative-writer', 'default-visionary', 'default-companion'],
    discussionMode: 'concurrent',
  },
  {
    id: 'preset-tech',
    name: 'Tech Review Board',
    description: 'Get feedback on technical ideas, code, and architecture from a pragmatic perspective.',
    participantIds: ['default-code-assistant', 'default-pragmatist', 'default-ethicist'],
    discussionMode: 'turn_based',
  },
];
