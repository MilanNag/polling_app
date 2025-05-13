import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../../../client/src/pages/home';
import { renderWithProviders } from '../../utils/render';
import { createMockPollWithOptionsAndVotes } from '../../mocks/data';
import { mockApiRequest } from '../../mocks/queryClient';
import { queryClient } from '../../../client/src/lib/queryClient';

// Mock useWebSocket hook
vi.mock('../../../client/src/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    connected: true,
    sendMessage: vi.fn(),
    lastMessage: null,
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

// Mock the useQuery hook results
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: ({ queryKey }) => {
      if (queryKey.includes('/api/polls/active')) {
        return {
          data: [
            createMockPollWithOptionsAndVotes({ id: 1, question: 'Active Poll 1?' }),
            createMockPollWithOptionsAndVotes({ id: 2, question: 'Active Poll 2?' })
          ],
          isLoading: false,
          error: null,
        };
      } else if (queryKey.includes('/api/polls/closed')) {
        return {
          data: [
            createMockPollWithOptionsAndVotes({ 
              id: 3, 
              question: 'Closed Poll 1?',
              isActive: false 
            })
          ],
          isLoading: false,
          error: null,
        };
      }
      return { data: null, isLoading: false, error: null };
    },
    useMutation: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    }),
  };
});

// Mock the user context
vi.mock('../../../client/src/context/user-context', () => ({
  useUser: () => ({
    user: { userId: 'user_123', username: 'testuser' },
    userStats: {
      id: 1,
      userId: 'user_123',
      username: 'testuser',
      pollsCreated: 5,
      votesSubmitted: 10,
      badges: []
    },
    isBadgesLoading: false,
    refreshUserStats: vi.fn(),
  }),
}));

// Mock queryClient
vi.mock('../../../client/src/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
  apiRequest: vi.fn(),
}));

describe('Home Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiRequest.mockClear();
  });

  it('should render active and closed polls', () => {
    renderWithProviders(<Home />);
    
    // Should show both active polls
    expect(screen.getByText('Active Poll 1?')).toBeInTheDocument();
    expect(screen.getByText('Active Poll 2?')).toBeInTheDocument();
    
    // Should show closed poll
    expect(screen.getByText('Closed Poll 1?')).toBeInTheDocument();
    
    // Should show appropriate section titles
    expect(screen.getByText('Active Polls')).toBeInTheDocument();
    expect(screen.getByText('Closed Polls')).toBeInTheDocument();
  });

  it('should show "Create Poll" button', () => {
    renderWithProviders(<Home />);
    
    // Create Poll button should be present
    expect(screen.getByText('Create Poll')).toBeInTheDocument();
  });

  it('should open CreatePollModal when Create Poll button is clicked', () => {
    renderWithProviders(<Home />);
    
    // Click the Create Poll button
    fireEvent.click(screen.getByText('Create Poll'));
    
    // Modal should be opened
    expect(screen.getByText('Create New Poll')).toBeInTheDocument();
  });

  it('should open VoteModal when vote button is clicked', () => {
    renderWithProviders(<Home />);
    
    // Find and click a vote button
    const voteButtons = screen.getAllByText('Vote Now');
    fireEvent.click(voteButtons[0]);
    
    // Vote modal should be opened
    expect(screen.getByText(/Vote:/)).toBeInTheDocument();
  });

  it('should open PollDetailModal when details button is clicked', () => {
    renderWithProviders(<Home />);
    
    // Find and click a details button
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);
    
    // Detail modal should be opened (check for detailed view elements)
    expect(screen.getByTestId('poll-chart')).toBeInTheDocument();
  });

  it('should handle poll deletion', async () => {
    // Mock API response for delete
    mockApiRequest.mockResolvedValueOnce({ message: 'Poll successfully removed', id: 1 });
    
    renderWithProviders(<Home />);
    
    // Find and click a delete button
    const deleteButtons = screen.getAllByLabelText('Delete poll');
    fireEvent.click(deleteButtons[0]);
    
    // API request should be made
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: '/api/polls/1',
        method: 'DELETE',
      }));
    });
    
    // Queries should be invalidated
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ 
      queryKey: ['/api/polls/active'] 
    });
  });
});