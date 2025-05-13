import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket, WebSocketMessageType } from '../../../client/src/hooks/use-websocket';

// Mock WebSocket implementation
class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState: number = 0; // CONNECTING
  CONNECTING: number = 0;
  OPEN: number = 1;
  CLOSING: number = 2;
  CLOSED: number = 3;
  
  constructor(url: string) {
    this.url = url;
    
    // Simulate connection success in next event loop tick
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 0);
  }
  
  send(data: string): void {
    // Mock implementation
  }
  
  close(): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
  
  // Helper to trigger a message
  mockReceiveMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
  
  // Helper to trigger an error
  mockError(event: any): void {
    if (this.onerror) {
      this.onerror(event);
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('useWebSocket hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  it('should establish a websocket connection', async () => {
    const onOpen = vi.fn();
    
    const { result } = renderHook(() => useWebSocket({ onOpen }));
    
    // Wait for the connection to be established
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(true);
  });
  
  it('should handle sending messages', async () => {
    const { result } = renderHook(() => useWebSocket({}));
    
    // Wait for the connection to be established
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    const sendSpy = vi.spyOn(MockWebSocket.prototype, 'send');
    
    const message = {
      type: WebSocketMessageType.JOIN_POLL,
      pollId: 1,
      userId: 'user_123',
    };
    
    // Send the message
    act(() => {
      result.current.sendMessage(message);
    });
    
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message));
  });
  
  it('should handle receiving messages', async () => {
    const onMessage = vi.fn();
    
    const { result } = renderHook(() => useWebSocket({ onMessage }));
    
    // Wait for the connection to be established
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    const mockMessage = {
      type: WebSocketMessageType.ACTIVE_USERS,
      data: { count: 5, users: ['user1', 'user2'] },
      timestamp: Date.now(),
    };
    
    // Simulate receiving a message
    act(() => {
      const wsInstance = (result.current as any).webSocketRef.current;
      wsInstance.mockReceiveMessage(mockMessage);
    });
    
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(mockMessage);
    // The latest message should be in the messageHistory array
    expect(result.current.messageHistory[result.current.messageHistory.length - 1]).toEqual(mockMessage);
  });
  
  it('should handle connection close', async () => {
    const onClose = vi.fn();
    
    const { result } = renderHook(() => useWebSocket({ onClose }));
    
    // Wait for the connection to be established
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(result.current.isConnected).toBe(true);
    
    // Close the connection
    act(() => {
      const wsInstance = (result.current as any).webSocketRef.current;
      wsInstance.close();
    });
    
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(false);
  });
  
  it('should handle errors', async () => {
    const onError = vi.fn();
    
    const { result } = renderHook(() => useWebSocket({ onError }));
    
    // Wait for the connection to be established
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    const errorEvent = new Event('error');
    
    // Trigger an error
    act(() => {
      const wsInstance = (result.current as any).webSocketRef.current;
      wsInstance.mockError(errorEvent);
    });
    
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(errorEvent);
  });
  
  it('should be able to close the connection', async () => {
    const { result } = renderHook(() => useWebSocket({}));
    
    // Wait for the connection to be established
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    const closeSpy = vi.spyOn(MockWebSocket.prototype, 'close');
    
    // Manually close the connection
    act(() => {
      const wsInstance = (result.current as any).webSocketRef.current;
      wsInstance.close();
    });
    
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(false);
  });
  
  it('should simulate a connection lifecycle', async () => {
    const { result } = renderHook(() => useWebSocket({}));
    
    // Wait for the connection to be established
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Verify connection is established
    expect(result.current.isConnected).toBe(true);
    
    // Manually close the connection
    act(() => {
      const wsInstance = (result.current as any).webSocketRef.current;
      wsInstance.close();
    });
    
    // Verify connection is closed
    expect(result.current.isConnected).toBe(false);
    
    // Create a new connection
    act(() => {
      // Simulate reconnection by creating a new WebSocket
      const wsInstance = new MockWebSocket((result.current as any).url);
      (result.current as any).webSocketRef.current = wsInstance;
      // Trigger the onopen callback to update the isConnected state
      if (wsInstance.onopen) wsInstance.onopen();
    });
    
    // Verify connection is established again
    expect(result.current.isConnected).toBe(true);
  });
});