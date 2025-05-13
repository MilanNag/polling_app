import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock the API request function
export const mockApiRequest = vi.fn();

// Create a fresh query client for testing
export const createTestQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Using gcTime instead of cacheTime in v5
        staleTime: 0,
      },
    },
  });

// Custom wrapper to provide QueryClient in tests
interface ProvidersWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export const MockQueryClientProvider = ({
  children,
  queryClient = createTestQueryClient(),
}: ProvidersWrapperProps) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// Mock the actual query client module
vi.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: mockApiRequest,
  getQueryFn: vi.fn(),
  queryClient: createTestQueryClient(),
  throwIfResNotOk: vi.fn(),
}));