// WebSocket message types
export enum WebSocketMessageType {
  JOIN_POLL = 'JOIN_POLL',
  LEAVE_POLL = 'LEAVE_POLL',
  NEW_VOTE = 'NEW_VOTE',
  POLL_UPDATE = 'POLL_UPDATE',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  ACTIVE_USERS = 'ACTIVE_USERS',
  ERROR = 'ERROR'
}

// WebSocket client message structure
export interface WebSocketClientMessage {
  type: WebSocketMessageType;
  pollId?: number;
  userId?: string;
  data?: any;
}

// WebSocket server message structure
export interface WebSocketServerMessage {
  type: WebSocketMessageType;
  pollId?: number;
  data?: any;
  message?: string;
  timestamp: number;
}

// Client info stored in a Map
export interface ClientInfo {
  isAlive: boolean;
  userId?: string;
  activePoll?: number;
}