import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '../../../client/src/context/user-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock apiRequest
vi.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  getQueryFn: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  }),
  throwIfResNotOk: vi.fn(),
}));

// Import after mock setup
import { apiRequest } from '../../../client/src/lib/queryClient';

// Helper component that uses the context
function UserDisplay() {
  const userContext = useUser();
  
  return (
    <div>
      <div data-testid="user-username">{userContext.user?.username || 'No user'}</div>
      <div data-testid="user-initials">{userContext.userInitials}</div>
      <div data-testid="is-logging-in">{userContext.isLoggingIn ? 'Logging in' : 'Not logging in'}</div>
      <button onClick={() => userContext.login('TestUser')}>Login</button>
      <button onClick={() => userContext.logout()}>Logout</button>
      <button onClick={() => userContext.refreshUserStats()}>Refresh Stats</button>
    </div>
  );
}

describe('UserContext', () => {
  const mockUser = {
    id: 1,
    userId: 'user_123',
    username: 'TestUser',
    createdAt: new Date(),
  };
  
  const mockUserStats = {
    id: 1,
    userId: 'user_123',
    username: 'TestUser',
    pollsCreated: 5,
    votesSubmitted: 10,
    badges: [
      { id: 1, userId: 'user_123', type: 'POLL_CREATOR', level: 1, createdAt: new Date() },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Default mock implementation for apiRequest
    (apiRequest as any).mockImplementation(async ({ endpoint }) => {
      if (endpoint === '/api/users') {
        return mockUser;
      } else if (endpoint.includes('/stats')) {
        return mockUserStats;
      } else if (endpoint.includes('/badges')) {
        return mockUserStats.badges;
      }
      return null;
    });
  });

  it('should load user from localStorage on mount', async () => {
    // Set up localStorage with a user
    localStorageMock.setItem('pollwave_user', JSON.stringify(mockUser));
    
    // Render the component
    render(
      <QueryClientProvider client={new QueryClient()}>
        <UserProvider>
          <UserDisplay />
        </UserProvider>
      </QueryClientProvider>
    );
    
    // Check that the user from localStorage is loaded
    expect(screen.getByTestId('user-username')).toHaveTextContent('TestUser');
  });

  it('should handle localStorage parse errors gracefully', async () => {
    // Set up localStorage with invalid JSON
    localStorageMock.setItem('pollwave_user', 'invalid JSON');
    
    render(
      <QueryClientProvider client={new QueryClient()}>
        <UserProvider>
          <UserDisplay />
        </UserProvider>
      </QueryClientProvider>
    );
    
    // Check that no user is loaded due to parse error
    expect(screen.getByTestId('user-username')).toHaveTextContent('No user');
    
    // Check that localStorage item was removed
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('pollwave_user');
  });

  it('should provide login functionality', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <UserProvider>
          <UserDisplay />
        </UserProvider>
      </QueryClientProvider>
    );
    
    // Initially no user
    expect(screen.getByTestId('user-username')).toHaveTextContent('No user');
    
    // Click login button
    await act(async () => {
      screen.getByText('Login').click();
    });
    
    // Check that isLoggingIn was set during login
    expect(screen.getByTestId('is-logging-in')).toHaveTextContent('Logging in');
    
    // After login completes
    await waitFor(() => {
      expect(screen.getByTestId('user-username')).toHaveTextContent('TestUser');
      expect(screen.getByTestId('is-logging-in')).toHaveTextContent('Not logging in');
    });
    
    // Check that apiRequest was called for login
    expect(apiRequest).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/api/users',
      method: 'POST',
    }));
    
    // Check that user was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pollwave_user',
      JSON.stringify(mockUser)
    );
  });

  it('should provide logout functionality', async () => {
    // Set up localStorage with a user
    localStorageMock.setItem('pollwave_user', JSON.stringify(mockUser));
    
    render(
      <QueryClientProvider client={new QueryClient()}>
        <UserProvider>
          <UserDisplay />
        </UserProvider>
      </QueryClientProvider>
    );
    
    // Initially user is logged in
    expect(screen.getByTestId('user-username')).toHaveTextContent('TestUser');
    
    // Click logout button
    await act(async () => {
      screen.getByText('Logout').click();
    });
    
    // After logout
    expect(screen.getByTestId('user-username')).toHaveTextContent('No user');
    
    // Check that user was removed from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('pollwave_user');
  });

  it('should provide correct user initials', async () => {
    // Set up localStorage with a user
    localStorageMock.setItem('pollwave_user', JSON.stringify(mockUser));
    
    render(
      <QueryClientProvider client={new QueryClient()}>
        <UserProvider>
          <UserDisplay />
        </UserProvider>
      </QueryClientProvider>
    );
    
    // Check user initials
    expect(screen.getByTestId('user-initials')).toHaveTextContent('TE');
  });
  
  it('should handle login errors', async () => {
    // Mock apiRequest to throw an error
    (apiRequest as any).mockRejectedValueOnce(new Error('Login failed'));
    
    render(
      <QueryClientProvider client={new QueryClient()}>
        <UserProvider>
          <UserDisplay />
        </UserProvider>
      </QueryClientProvider>
    );
    
    // Click login button
    await act(async () => {
      screen.getByText('Login').click();
    });
    
    // After login attempt fails
    await waitFor(() => {
      expect(screen.getByTestId('is-logging-in')).toHaveTextContent('Not logging in');
      expect(screen.getByTestId('user-username')).toHaveTextContent('No user');
    });
  });
});