import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket message types - must match server-side
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

// Message interfaces
export interface WebSocketMessage {
  type: WebSocketMessageType;
  pollId?: number;
  userId?: string;
  data?: any;
  message?: string;
  timestamp?: number;
}

// Hook options
interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (data: WebSocketMessage) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

/**
 * Hook for WebSocket connections
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<{count: number, users: string[]}>({ count: 0, users: [] });
  
  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  
  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnectInterval = 3000,
    reconnectAttempts = 5
  } = options;
  
  // Connect to WebSocket server
  const connect = useCallback(() => {
    // Close any existing connection
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log('Connecting to WebSocket at:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        
        if (onOpen) {
          onOpen();
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        
        if (onClose) {
          onClose();
        }
        
        // Try to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
      
      ws.onerror = (error) => {
        if (onError) {
          onError(error);
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setMessageHistory((prev) => [...prev, message]);
          
          // Handle active users count
          if (message.type === WebSocketMessageType.ACTIVE_USERS && message.data) {
            setActiveUsers(message.data);
          }
          
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      webSocketRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [onOpen, onClose, onMessage, onError, reconnectInterval, reconnectAttempts]);
  
  // Send message to WebSocket server
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (webSocketRef.current && isConnected && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('Cannot send message - WebSocket not connected');
      return false;
    }
  }, [isConnected]);
  
  // Join a poll
  const joinPoll = useCallback((pollId: number, userId: string) => {
    // Only send if connection is ready
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      return sendMessage({
        type: WebSocketMessageType.JOIN_POLL,
        pollId,
        userId
      });
    }
    return false;
  }, [sendMessage]);
  
  // Leave a poll
  const leavePoll = useCallback(() => {
    // Only send if connection is ready
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      return sendMessage({
        type: WebSocketMessageType.LEAVE_POLL
      });
    }
    return false;
  }, [sendMessage]);
  
  // Connect on mount, cleanup on unmount
  useEffect(() => {
    connect();
    
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
  
  return {
    isConnected,
    sendMessage,
    joinPoll,
    leavePoll,
    activeUsers,
    messageHistory
  };
}