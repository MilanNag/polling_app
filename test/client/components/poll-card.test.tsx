import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PollCard } from '../../../client/src/components/poll-card';
import { createMockPollWithOptionsAndVotes } from '../../mocks/data';

// Mock user context
vi.mock('../../../client/src/context/user-context', () => ({
  useUser: vi.fn(() => ({
    user: { userId: 'user123', username: 'testuser' },
    userInitials: 'TU',
    userStats: {
      id: 1,
      userId: 'user123',
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
  }))
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
  CardDescription: ({ children, className }: any) => (
    <div data-testid="card-description" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }: any) => (
    <div data-testid="card-footer" className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, disabled, className, size, title }: any) => (
    <button
      data-testid={`button-${variant || 'default'}`}
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-size={size}
      title={title}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span
      data-testid={`badge-${variant || 'default'}`}
      className={className}
    >
      {children}
    </span>
  ),
}));

vi.mock('lucide-react', () => ({
  Clock: () => <span data-testid="clock-icon">clock</span>,
  BarChart: () => <span data-testid="bar-chart-icon">chart</span>,
  BarChart2: () => <span data-testid="bar-chart2-icon">chart2</span>,
  Vote: () => <span data-testid="vote-icon">vote</span>,
  Info: () => <span data-testid="info-icon">info</span>,
  Trash2: () => <span data-testid="trash-icon">delete</span>,
  Calendar: () => <span data-testid="calendar-icon">calendar</span>,
  CheckCircle: () => <span data-testid="check-circle-icon">check</span>,
  Users: () => <span data-testid="users-icon">users</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">down</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">up</span>,
  Heart: () => <span data-testid="heart-icon">heart</span>,
  X: () => <span data-testid="x-icon">x</span>,
  Plus: () => <span data-testid="plus-icon">plus</span>,
  Minus: () => <span data-testid="minus-icon">minus</span>,
  Loader: () => <span data-testid="loader-icon">loading</span>,
  LogOut: () => <span data-testid="logout-icon">logout</span>,
  Award: () => <span data-testid="award-icon">award</span>,
  AlertTriangle: () => <span data-testid="alert-icon">alert</span>,
  ExternalLink: () => <span data-testid="external-link-icon">external</span>
}));

// Mock poll chart component
vi.mock('../../../client/src/components/poll-chart', () => ({
  PollChart: ({ poll }: any) => (
    <div data-testid="poll-chart">
      Chart for poll: {poll.question}
    </div>
  ),
}));

describe('PollCard', () => {
  const mockOnVote = vi.fn();
  const mockOnViewDetails = vi.fn();
  const mockOnDelete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render an active poll with options', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      description: 'Test Description',
      isActive: true,
      endDate: new Date(Date.now() + 3600000), // 1 hour from now
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
      totalVotes: 10,
      createdBy: 'user123',
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Check poll title is present (description may not be displayed in the component)
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    
    // Check for active badge
    expect(screen.getByText('Active')).toBeInTheDocument();
    
    // Check for vote count by finding the vote icon and its parent containing the text
    const chartIcon = screen.getByTestId('bar-chart2-icon');
    const voteCountElement = chartIcon.parentElement;
    expect(voteCountElement?.textContent).toContain('10');
    expect(voteCountElement?.textContent).toContain('votes');
    
    // Check for vote and details buttons
    expect(screen.getByText('Vote Now')).toBeInTheDocument(); // Vote button
    expect(screen.getByText('Details')).toBeInTheDocument(); // Details button
    
    // Check for trash/delete button
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });
  
  it('should render an inactive/closed poll', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      description: 'Test Description',
      isActive: false,
      endDate: new Date(Date.now() - 3600000), // 1 hour ago
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
      totalVotes: 10,
      createdBy: 'user123',
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={false}
      />
    );
    
    // Check for closed badge
    expect(screen.getByText('Closed')).toBeInTheDocument();
    
    // For closed polls, verify the footer's card content exists
    const cardFooter = screen.getByTestId('card-footer');
    expect(cardFooter).toBeDefined();
    
    // For a closed poll, we expect to see the Details button
    expect(screen.getByText('Details')).toBeInTheDocument();
  });
  
  it('should call onVote when vote button is clicked', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: true,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Find and click the Vote button
    const voteButton = screen.getByText('Vote Now');
    fireEvent.click(voteButton);
    
    // onVote should have been called
    expect(mockOnVote).toHaveBeenCalledTimes(1);
  });
  
  it('should call onViewDetails when details button is clicked', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: true,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Find the Details button by its text and the external-link icon
    const detailsButtonWithIcon = screen.getByTestId('external-link-icon').closest('button');
    if (detailsButtonWithIcon) {
      fireEvent.click(detailsButtonWithIcon);
    }
    
    // onViewDetails should have been called
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
  });
  
  it('should call onDelete when delete button is clicked', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: true,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Find and click the Delete button (trash icon)
    const deleteIcon = screen.getByTestId('trash-icon');
    const deleteButton = deleteIcon.closest('button');
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    // onDelete should have been called with the poll ID
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(1); // poll.id
  });
  
  it('should show user vote if the user has voted', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: true,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
      userVote: { optionId: 1, text: 'Option 1' }
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Should show that the user voted for Option 1
    expect(screen.getByText('Your vote')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
  
  it('should not render delete button if onDelete is not provided', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: true,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        // onDelete is not provided
        isActive={true}
      />
    );
    
    // There should be no trash icon
    expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
  });

  it('should show correct progress bars for options', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: true,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 10, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 6, percentage: 30 },
        { id: 3, pollId: 1, text: 'Option 3', votes: 4, percentage: 20 },
      ],
      totalVotes: 20
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Check the options are displayed with correct text
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    
    // Check percentages are displayed correctly
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    
    // Verify vote counts
    expect(screen.getByText('10 votes')).toBeInTheDocument();
    expect(screen.getByText('6 votes')).toBeInTheDocument();
    expect(screen.getByText('4 votes')).toBeInTheDocument();
  });

  it('should handle singular vote text correctly', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: true,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 1, percentage: 100 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 0, percentage: 0 },
      ],
      totalVotes: 1
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Check singular form is used correctly
    expect(screen.getByText('1 vote')).toBeInTheDocument(); // For the total votes
    
    // Check singular form for option vote count
    const voteCountElements = screen.getAllByText('1 vote');
    expect(voteCountElements.length).toBe(1); // Just one instance of "1 vote" is found
    
    // Check zero votes text
    expect(screen.getByText('0 votes')).toBeInTheDocument();
  });

  it('should not show Vote Now button when poll is inactive', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Test Question',
      isActive: false,
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Option 1', votes: 5, percentage: 50 },
        { id: 2, pollId: 1, text: 'Option 2', votes: 5, percentage: 50 },
      ],
    });
    
    render(
      <PollCard
        poll={mockPoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={false}
      />
    );
    
    // Vote button should not be present for inactive polls
    expect(screen.queryByText('Vote Now')).not.toBeInTheDocument();
  });

  it('should use different color gradients for active and inactive polls', () => {
    // Render an active poll
    const activePoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Active Poll',
      isActive: true,
      optionsWithVotes: [{ id: 1, pollId: 1, text: 'Option', votes: 5, percentage: 100 }],
    });
    
    const { rerender } = render(
      <PollCard
        poll={activePoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );
    
    // Check active poll has green gradient indicator
    const activeIndicator = document.querySelector('.bg-gradient-to-r.from-green-400.to-emerald-500');
    expect(activeIndicator).not.toBeNull();
    
    // Rerender with inactive poll
    const inactivePoll = createMockPollWithOptionsAndVotes({
      id: 2,
      question: 'Inactive Poll',
      isActive: false,
      optionsWithVotes: [{ id: 2, pollId: 2, text: 'Option', votes: 5, percentage: 100 }],
    });
    
    rerender(
      <PollCard
        poll={inactivePoll}
        onVote={mockOnVote}
        onViewDetails={mockOnViewDetails}
        onDelete={mockOnDelete}
        isActive={false}
      />
    );
    
    // Check inactive poll has gray gradient indicator
    const inactiveIndicator = document.querySelector('.bg-gradient-to-r.from-gray-300.to-gray-400');
    expect(inactiveIndicator).not.toBeNull();
  });
});