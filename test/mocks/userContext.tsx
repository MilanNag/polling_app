import React, { ReactNode } from 'react';
import { vi } from 'vitest';

// Create mock types that match what's in the actual context
export type MockUser = {
  id: number;
  userId: string;
  username: string;
};

export type MockUserStats = {
  id: number;
  userId: string;
  username: string;
  pollsCreated: number;
  votesSubmitted: number;
  badges: MockBadge[];
};

export type MockBadge = {
  id: number;
  userId: string;
  type: string;
  level: number;
};

// Create mock context values and functions
export const mockUserContextValue = {
  user: {
    id: 1,
    userId: 'user_123',
    username: 'testuser',
  } as MockUser,
  userInitials: 'TU',
  userStats: {
    id: 1,
    userId: 'user_123',
    username: 'testuser',
    pollsCreated: 5,
    votesSubmitted: 10,
    badges: [
      { id: 1, userId: 'user_123', type: 'POLL_CREATOR', level: 1 },
      { id: 2, userId: 'user_123', type: 'VOTER', level: 2 },
    ],
  } as MockUserStats,
  badges: [
    { id: 1, userId: 'user_123', type: 'POLL_CREATOR', level: 1 },
    { id: 2, userId: 'user_123', type: 'VOTER', level: 2 },
  ] as MockBadge[],
  isBadgesLoading: false,
  refreshUserStats: vi.fn(),
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  isLoggingIn: false,
};

// Mock the UserContext
export const MockUserContext = React.createContext(mockUserContextValue);

// Create a provider for tests
export const MockUserProvider = ({ children, customValue = {} }: { children: ReactNode, customValue?: Partial<typeof mockUserContextValue> }) => {
  const value = { ...mockUserContextValue, ...customValue };
  return <MockUserContext.Provider value={value}>{children}</MockUserContext.Provider>;
};

// Create a mocked version of the useUser hook
export const mockUseUser = vi.fn().mockReturnValue(mockUserContextValue);

// Mock the actual module
vi.mock('../../client/src/context/user-context', () => ({
  UserContext: MockUserContext,
  UserProvider: MockUserProvider,
  useUser: mockUseUser,
}));