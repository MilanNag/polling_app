import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Fix for React not defined error
global.React = React;

// Mock fetch for API requests
global.fetch = vi.fn();

// Testing Library Jest DOM will automatically extend Vitest's expect

// Mock WebSocket for tests
class MockWebSocket {
  url: string;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState = 1; // OPEN
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    // Automatically trigger the open event
    setTimeout(() => {
      if (this.onopen) this.onopen({ target: this });
    }, 0);
  }

  send(data: string): void {
    // Mock implementation
  }

  close(): void {
    if (this.onclose) this.onclose({ target: this });
  }
}

// Override global WebSocket
global.WebSocket = MockWebSocket as any;

// Mock ResizeObserver which is not available in JSDOM
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});