import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock websocket
vi.mock('../client/src/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    sendMessage: vi.fn(),
    joinPoll: vi.fn(),
    leavePoll: vi.fn(),
    activeUsers: { count: 0, users: [] },
    messageHistory: [],
  }),
  WebSocketMessageType: {
    JOIN_POLL: 'JOIN_POLL',
    LEAVE_POLL: 'LEAVE_POLL',
    NEW_VOTE: 'NEW_VOTE',
    POLL_UPDATE: 'POLL_UPDATE',
    USER_JOINED: 'USER_JOINED',
    USER_LEFT: 'USER_LEFT',
    ACTIVE_USERS: 'ACTIVE_USERS',
    ERROR: 'ERROR'
  }
}));

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { 
    queryClient = createTestQueryClient(),
    ...renderOptions 
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return { 
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }) 
  };
}

// Mock data creators
export const createMockPoll = (overrides = {}) => ({
  id: 1,
  question: 'Test Poll',
  description: 'Test Description',
  userId: 'user_123',
  username: 'testuser',
  isActive: true,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  isRemoved: false,
  options: [
    { id: 1, pollId: 1, text: 'Option 1' },
    { id: 2, pollId: 1, text: 'Option 2' }
  ],
  totalVotes: 10,
  optionsWithVotes: [
    { id: 1, pollId: 1, text: 'Option 1', votes: 6, percentage: 60 },
    { id: 2, pollId: 1, text: 'Option 2', votes: 4, percentage: 40 }
  ],
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 1,
  userId: 'user_123',
  username: 'testuser',
  createdAt: new Date().toISOString(),
  ...overrides
});

export const createMockBadge = (overrides = {}) => ({
  id: 1,
  userId: 'user_123',
  type: 'POLL_CREATOR',
  level: 1,
  createdAt: new Date().toISOString(),
  ...overrides
});