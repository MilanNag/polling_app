import { vi } from 'vitest';

export enum MockWebSocketMessageType {
  JOIN_POLL = 'JOIN_POLL',
  LEAVE_POLL = 'LEAVE_POLL',
  NEW_VOTE = 'NEW_VOTE',
  POLL_UPDATE = 'POLL_UPDATE',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  ACTIVE_USERS = 'ACTIVE_USERS',
  ERROR = 'ERROR'
}

export interface MockWebSocketMessage {
  type: MockWebSocketMessageType;
  pollId?: number;
  userId?: string;
  data?: any;
  message?: string;
  timestamp?: number;
}

export const mockWebSocketHook = {
  isConnected: true,
  connecting: false,
  sendMessage: vi.fn(),
  lastMessage: null as MockWebSocketMessage | null,
  joinPoll: vi.fn(),
  leavePoll: vi.fn(),
  disconnect: vi.fn(),
  reconnect: vi.fn(),
  activeUsers: { count: 0, users: [] },
  messageHistory: [],
};

export const mockUseWebSocket = vi.fn().mockReturnValue(mockWebSocketHook);

vi.mock('../../client/src/hooks/use-websocket', () => ({
  useWebSocket: mockUseWebSocket,
  WebSocketMessageType: MockWebSocketMessageType,
}));