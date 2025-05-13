import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import PollDetails from '../../../client/src/pages/poll-details';
import { createMockPollWithOptionsAndVotes } from '../../mocks/data';

// Mock the hooks
const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockRefetch = vi.fn();

// Mock the modules
vi.mock('wouter', () => ({
  useParams: vi.fn(() => ({ id: '1' })),
  useLocation: vi.fn(() => ['/', mockNavigate]),
}));

vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 1, 2023'),
}));

vi.mock('@tanstack/react-query', () => {
  const QueryClient = vi.fn().mockImplementation(() => ({
    setDefaultOptions: vi.fn(),
    invalidateQueries: vi.fn(),
    getQueryCache: vi.fn(() => ({
      find: vi.fn(),
      subscribe: vi.fn(),
    }))
  }));
  
  return {
    useQuery: vi.fn(),
    useMutation: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null
    }),
    useQueryClient: vi.fn().mockReturnValue({
      invalidateQueries: vi.fn(),
    }),
    QueryClient,
  };
});

vi.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: mockToast, dismiss: vi.fn() })),
}));

vi.mock('../../../client/src/context/user-context', () => ({
  useUser: vi.fn(() => ({
    user: { userId: 'user_123', username: 'testuser' },
    userInitials: 'TU',
    userStats: {
      id: 1,
      userId: 'user_123',
      username: 'testuser',
      pollsCreated: 5,
      votesSubmitted: 10,
      badges: []
    },
    badges: [],
    isBadgesLoading: false,
    refreshUserStats: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    isLoggingIn: false
  })),
}));

// Import mocked modules
import * as reactQuery from '@tanstack/react-query';
const { useQuery } = reactQuery;

describe('PollDetails Page', () => {
  // Common test data
  const mockPoll = createMockPollWithOptionsAndVotes({
    id: 1,
    question: 'Test Question',
    description: 'Test Description',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    endDate: new Date('2023-02-01'),
    totalVotes: 10,
    optionsWithVotes: [
      { id: 1, pollId: 1, text: 'Option 1', votes: 6, percentage: 60 },
      { id: 2, pollId: 1, text: 'Option 2', votes: 4, percentage: 40 }
    ],
    userVote: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set default mock values
    (useQuery as any).mockReturnValue({
      data: mockPoll,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('should render loading state when data is loading', () => {
    // Mock loading state
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<PollDetails />);

    // Check for loading skeleton
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('should render error state when poll is not found', () => {
    // Mock poll not found
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PollDetails />);

    // Check for not found message
    expect(screen.getByText('Poll Not Found')).toBeInTheDocument();
    expect(screen.getByText("The poll you're looking for doesn't exist or has been removed.")).toBeInTheDocument();
  });

  it('should render poll details correctly', () => {
    render(<PollDetails />);

    // Check for poll title
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    
    // Check for active badge
    expect(screen.getByText('Active')).toBeInTheDocument();
    
    // Check for dates
    expect(screen.getByText(/Created Jan 1, 2023 · Ends Jan 1, 2023/)).toBeInTheDocument();
    
    // Check for votes
    expect(screen.getByText(/Results \(10 total votes\)/)).toBeInTheDocument();
    
    // Check for options and vote counts
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('60% (6 votes)')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('40% (4 votes)')).toBeInTheDocument();
    
    // Check for vote button
    const voteButton = screen.getByRole('button', { name: /vote now/i });
    expect(voteButton).toBeInTheDocument();
  });

  it('should show user vote when user has voted', () => {
    // Create poll with user vote
    const pollWithUserVote = {
      ...mockPoll,
      userVote: { optionId: 1, text: 'Option 1' },
    };
    
    (useQuery as any).mockReturnValue({
      data: pollWithUserVote,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<PollDetails />);

    // Check for user vote section
    expect(screen.getByText('Your Vote')).toBeInTheDocument();
    expect(screen.getByText(/You voted for/)).toBeInTheDocument();
    
    // Check for vote again button
    const voteAgainButton = screen.getByRole('button', { name: /vote again/i });
    expect(voteAgainButton).toBeInTheDocument();
  });

  it('should hide vote button for closed polls', () => {
    // Create closed poll
    const closedPoll = {
      ...mockPoll,
      isActive: false,
    };
    
    (useQuery as any).mockReturnValue({
      data: closedPoll,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<PollDetails />);

    // Check for closed badge
    expect(screen.getByText('Closed')).toBeInTheDocument();
    
    // Check for ended date format
    expect(screen.getByText(/Created Jan 1, 2023 · Ended Jan 1, 2023/)).toBeInTheDocument();
    
    // Vote button should not be shown
    const voteButton = screen.queryByRole('button', { name: /vote now/i });
    expect(voteButton).not.toBeInTheDocument();
  });

  it('should show toast on error', async () => {
    // Mock error state
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch poll'),
      refetch: mockRefetch,
    });
    
    render(<PollDetails />);

    // Wait for toast to be called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load poll details. Please try again.',
        variant: 'destructive'
      }));
    });
  });
});