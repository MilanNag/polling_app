import type { Poll, Option, Vote, User, Badge, PollWithOptionsAndVotes } from '../../shared/schema';

// Mock data generators
export const createMockUser = (override: Partial<User> = {}): User => ({
  id: 1,
  userId: 'user_123',
  username: 'testuser',
  pollsCreated: 5,
  votesSubmitted: 10,
  ...override
});

export const createMockPoll = (override: Partial<Poll> = {}): Poll => ({
  id: 1,
  question: 'Test Question?',
  description: 'Test Description',
  createdBy: 'user_123',
  createdAt: new Date(),
  endDate: new Date(Date.now() + 86400000), // 1 day later
  isActive: true,
  isRemoved: false,
  ...override
});

export const createMockOption = (override: Partial<Option> = {}): Option => ({
  id: 1,
  pollId: 1,
  text: 'Test Option',
  ...override
});

export const createMockVote = (override: Partial<Vote> = {}): Vote => ({
  id: 1,
  userId: 'user_123',
  pollId: 1,
  optionId: 1,
  votedAt: new Date(),
  ...override
});

export const createMockBadge = (override: Partial<Badge> = {}): Badge => ({
  id: 1,
  userId: 'user_123',
  type: 'POLL_CREATOR',
  level: 1,
  earnedAt: new Date(),
  ...override
});

export const createMockPollWithOptionsAndVotes = (
  override: Partial<PollWithOptionsAndVotes> = {}
): PollWithOptionsAndVotes => {
  const poll = createMockPoll();
  const options = [
    createMockOption({ id: 1, text: 'Option 1' }),
    createMockOption({ id: 2, text: 'Option 2' }),
  ];
  
  // Add user data for display purposes
  const pollWithUser = {
    ...poll,
    username: 'testuser', // This isn't in the Poll type but needed for display
  };
  
  return {
    ...pollWithUser,
    options,
    totalVotes: 10,
    optionsWithVotes: [
      { ...options[0], votes: 6, percentage: 60 },
      { ...options[1], votes: 4, percentage: 40 },
    ],
    userVote: { optionId: 1, text: 'Option 1' },
    ...override
  };
};