import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { PollDetailModal } from '../../../client/src/components/poll-detail-modal';
import { createMockPollWithOptionsAndVotes } from '../../mocks/data';

// Mock setState function
const mockSetState = vi.fn();

// Mock useState but don't modify React directly as it's too complex for our tests
// Instead we'll just use the default React behavior

// Mock the useUser hook
const mockUserContext = {
  user: { userId: 'user123', username: 'testuser' },
  userInitials: 'TU',
  isLoggingIn: false,
  logout: vi.fn(),
  login: vi.fn(),
  refreshUserStats: vi.fn(),
  userStats: { pollsCreated: 5, votesSubmitted: 10 },
  badges: [],
  isBadgesLoading: false
};

vi.mock('../../../client/src/context/user-context', () => ({
  useUser: () => mockUserContext
}));

// Mock useWebSocket hook
const mockJoinPoll = vi.fn();
const mockLeavePoll = vi.fn();
const mockSendMessage = vi.fn();
let mockWebSocketIsConnected = true;
let mockActiveUsers = { count: 5 };

vi.mock('../../../client/src/hooks/use-websocket', () => ({
  useWebSocket: ({ onMessage }) => ({
    isConnected: mockWebSocketIsConnected,
    sendMessage: mockSendMessage,
    joinPoll: mockJoinPoll,
    leavePoll: mockLeavePoll,
    activeUsers: mockActiveUsers
  }),
  WebSocketMessageType: {
    JOIN_POLL: 'JOIN_POLL',
    LEAVE_POLL: 'LEAVE_POLL',
    POLL_UPDATE: 'POLL_UPDATE',
    NEW_VOTE: 'NEW_VOTE'
  }
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock apiRequest
const mockApiRequest = vi.fn().mockResolvedValue({ ok: true });
vi.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: (method, url) => mockApiRequest(method, url)
}));

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey }) => <div data-testid={`bar-${dataKey}`}></div>,
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>,
  Cell: () => <div data-testid="cell"></div>
}));

// Mock UI components that are causing testing issues
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }) => open ? (
    <div data-testid="dialog" className="modal-dialog">
      {children}
      <button data-testid="close-modal" onClick={() => onOpenChange(false)}>X</button>
    </div>
  ) : null,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
  DialogFooter: ({ children }) => <div data-testid="dialog-footer">{children}</div>
}));

// Mock Badge component
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }) => (
    <span data-testid={`badge-${variant || 'default'}`}>
      {children}
    </span>
  )
}));

// Mock Tabs components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }) => (
    <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>
  ),
  TabsContent: ({ children, value }) => (
    <div data-testid={`tabs-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, onClick }) => (
    <button 
      data-testid={`tab-trigger-${value}`} 
      onClick={onClick}
    >
      {children}
    </button>
  )
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, disabled, 'aria-label': ariaLabel }) => (
    <button 
      data-testid={`button-${variant || 'default'}`} 
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  BarChart3: () => <span data-testid="icon-barchart">BarChart3</span>,
  ListChecks: () => <span data-testid="icon-listchecks">ListChecks</span>,
  Users: () => <span data-testid="icon-users">Users</span>,
  Trash2: () => <span data-testid="icon-trash">Trash2</span>
}));

// Mock PollChart component
vi.mock('@/components/poll-chart', () => ({
  PollChart: ({ poll }) => <div data-testid="poll-chart">Chart for {poll.question}</div>
}));

describe('PollDetailModal', () => {
  const mockPoll = createMockPollWithOptionsAndVotes({
    id: 123,
    question: "Test Poll Question",
    description: "Test Poll Description",
    isActive: true
  });
  
  const mockInactivePoll = createMockPollWithOptionsAndVotes({
    id: 124,
    question: "Inactive Poll",
    description: "This poll is inactive",
    isActive: false
  });
  
  const mockOnOpenChange = vi.fn();
  const mockOnVoteAgain = vi.fn();
  const mockOnDelete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketIsConnected = true;
    mockActiveUsers = { count: 5 };
    
    // Reset setTimeout
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should render the poll details when open is true', () => {
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Check if the dialog is rendered when open is true
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Verify poll question is in the document
    expect(screen.getByText("Test Poll Question")).toBeInTheDocument();
    
    // Check for active badge
    expect(screen.getByTestId('badge-outline')).toHaveTextContent('Active');
    
    // Check tabs are rendered
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    expect(screen.getByTestId('tab-trigger-bars')).toBeInTheDocument();
    expect(screen.getByTestId('tab-trigger-chart')).toBeInTheDocument();
    
    // Check stats section
    expect(screen.getByText('Total Votes')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total votes from mock data
    
    // Check active viewers
    expect(screen.getByText('Active Viewers')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // From mock activeUsers
    
    // Check connection status
    expect(screen.getByText('Live: Results update in real-time')).toBeInTheDocument();
  });
  
  it('should not render when open is false', () => {
    render(
      <PollDetailModal
        open={false}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // The dialog should not be rendered when open is false
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });
  
  it('should show "Closed" badge for inactive polls', () => {
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockInactivePoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Check for closed badge
    expect(screen.getByTestId('badge-secondary')).toHaveTextContent('Closed');
    
    // Vote Again button should not be present for inactive polls
    const buttons = screen.getAllByRole('button');
    const voteAgainButton = Array.from(buttons).find(button => 
      /vote again/i.test(button.textContent || '')
    );
    expect(voteAgainButton).toBeUndefined();
  });
  
  it('should show disconnected status when WebSocket is not connected', () => {
    mockWebSocketIsConnected = false;
    
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Check connection status
    expect(screen.getByText('Connecting to live updates...')).toBeInTheDocument();
  });
  
  it('should call onVoteAgain when vote again button is clicked', () => {
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Find all buttons
    const buttons = screen.getAllByRole('button');
    
    // Find the Vote Again button by text content
    const voteAgainButton = Array.from(buttons).find(button => 
      /vote again/i.test(button.textContent || '')
    );
    
    expect(voteAgainButton).toBeDefined();
    
    if (voteAgainButton) {
      fireEvent.click(voteAgainButton);
      expect(mockOnVoteAgain).toHaveBeenCalledTimes(1);
    }
  });
  
  it('should call onOpenChange when close button is clicked', () => {
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Find the close button
    const closeButton = screen.getByText('Close');
    expect(closeButton).toBeInTheDocument();
    
    // Click the close button
    fireEvent.click(closeButton);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
  
  it('should call onDelete when delete button is clicked', async () => {
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Find the delete button
    const deleteButton = screen.getByLabelText('Delete poll');
    expect(deleteButton).toBeInTheDocument();
    
    // Click the delete button
    fireEvent.click(deleteButton);
    
    // Wait for the API request to resolve
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        'DELETE', 
        '/api/polls/123?userId=user123'
      );
    });
    
    // Verify toast was called and modal closed
    expect(mockToast).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
  
  it('should display error toast when delete fails', async () => {
    // Setup mockApiRequest to return an error
    mockApiRequest.mockResolvedValueOnce({ 
      ok: false,
      json: () => Promise.resolve({ message: 'Permission denied' })
    });
    
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Find and click the delete button
    const deleteButton = screen.getByLabelText('Delete poll');
    fireEvent.click(deleteButton);
    
    // Wait for the API request to resolve
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalled();
    });
    
    // Verify error toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'Permission denied',
      variant: 'destructive'
    }));
    
    // Modal should not be closed on error
    expect(mockOnOpenChange).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
  
  it('should show votes with proper bars and percentages', () => {
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Check for option text and vote counts
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('60% (6 votes)')).toBeInTheDocument();
    
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('40% (4 votes)')).toBeInTheDocument();
    
    // Check for "Your vote" badge
    expect(screen.getByText('Your vote')).toBeInTheDocument();
  });
  
  it('should render chart view when tab is switched', () => {
    render(
      <PollDetailModal
        open={true}
        onOpenChange={mockOnOpenChange}
        poll={mockPoll}
        onVoteAgain={mockOnVoteAgain}
        onDelete={mockOnDelete}
      />
    );
    
    // Click the chart tab
    const chartTab = screen.getByTestId('tab-trigger-chart');
    fireEvent.click(chartTab);
    
    // Verify chart component is shown
    expect(screen.getByTestId('tabs-content-chart')).toBeInTheDocument();
    expect(screen.getByTestId('poll-chart')).toBeInTheDocument();
  });
});