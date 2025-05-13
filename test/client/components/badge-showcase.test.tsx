import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BadgeShowcase } from '../../../client/src/components/badge-showcase';
import { createMockBadge } from '../../mocks/data';

// Mock the user context
vi.mock('../../../client/src/context/user-context', () => ({
  useUser: vi.fn(),
}));

// Mock the badgeInfo from schema
vi.mock('@shared/schema', () => ({
  badgeInfo: {
    poll_creator: {
      name: 'Poll Creator',
      description: 'Created polls',
      levels: [
        { level: 1, title: 'Novice Pollster', requirement: 1 },
        { level: 2, title: 'Poll Enthusiast', requirement: 5 },
        { level: 3, title: 'Poll Master', requirement: 10 },
      ],
      icon: '🗳️'
    },
    vote_collector: {
      name: 'Vote Collector',
      description: 'Collected votes on polls',
      levels: [
        { level: 1, title: 'First Votes', requirement: 1 },
        { level: 2, title: 'Vote Collector', requirement: 10 },
        { level: 3, title: 'Vote Master', requirement: 25 },
      ],
      icon: '✓'
    },
    top_contributor: {
      name: 'Top Contributor',
      description: 'Active community member',
      levels: [
        { level: 1, title: 'Active Member', requirement: 7 },
        { level: 2, title: 'Top Contributor', requirement: 30 },
        { level: 3, title: 'Community Leader', requirement: 100 },
      ],
      icon: '🏆'
    },
  },
}));

// Import mocked version
import { useUser } from '../../../client/src/context/user-context';

describe('BadgeShowcase Component', () => {
  const refreshUserStatsMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when user is not available', () => {
    (useUser as any).mockReturnValue({
      user: null,
      badges: [],
      refreshUserStats: refreshUserStatsMock
    });

    const { container } = render(<BadgeShowcase />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when badges array is empty', () => {
    (useUser as any).mockReturnValue({
      user: { userId: 'user_123', username: 'testuser' },
      badges: [],
      refreshUserStats: refreshUserStatsMock
    });

    const { container } = render(<BadgeShowcase />);
    expect(container.firstChild).toBeNull();
  });

  it('should render badges when available', () => {
    const mockBadges = [
      createMockBadge({ 
        type: 'poll_creator', 
        level: 1 
      }),
      createMockBadge({ 
        type: 'vote_collector', 
        level: 2 
      }),
    ];

    (useUser as any).mockReturnValue({
      user: { userId: 'user_123', username: 'testuser' },
      badges: mockBadges,
      refreshUserStats: refreshUserStatsMock
    });

    render(<BadgeShowcase />);

    // Check if the component title is rendered
    expect(screen.getByText('Your Achievements')).toBeInTheDocument();
    
    // Check if both badges are rendered - we need to use getAllByText since text appears in multiple elements
    const pollCreatorElements = screen.getAllByText('Poll Creator');
    expect(pollCreatorElements.length).toBeGreaterThan(0);
    
    const voteCollectorElements = screen.getAllByText('Vote Collector');
    expect(voteCollectorElements.length).toBeGreaterThan(0);
    
    // Check if the level text is displayed - we need to use getAllByText since text appears in multiple elements
    const novicePollsterElements = screen.getAllByText('Novice Pollster');
    expect(novicePollsterElements.length).toBeGreaterThan(0);
    
    // Level 2 badge should have a level indicator
    const levelIndicator = screen.getByText('Level 2');
    expect(levelIndicator).toBeInTheDocument();
    expect(levelIndicator).toHaveClass('bg-violet-100', 'text-violet-800');
  });

  it('should call refreshUserStats when refresh button is clicked', () => {
    // Clear the previous calls counter
    refreshUserStatsMock.mockClear();
    
    const mockBadges = [
      createMockBadge({ type: 'poll_creator', level: 1 }),
    ];

    (useUser as any).mockReturnValue({
      user: { userId: 'user_123', username: 'testuser' },
      badges: mockBadges,
      refreshUserStats: refreshUserStatsMock
    });

    render(<BadgeShowcase />);
    
    // The function is called on mount, so clear it again before our test
    refreshUserStatsMock.mockClear();

    // Find and click the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Check if the refreshUserStats function was called
    expect(refreshUserStatsMock).toHaveBeenCalledTimes(1);
  });

  it('should not render invalid badge types', () => {
    const mockBadges = [
      createMockBadge({ type: 'poll_creator', level: 1 }),
      createMockBadge({ type: 'invalid_type' as any, level: 1 }), // Invalid type should be filtered out
    ];

    (useUser as any).mockReturnValue({
      user: { userId: 'user_123', username: 'testuser' },
      badges: mockBadges,
      refreshUserStats: refreshUserStatsMock
    });

    render(<BadgeShowcase />);

    // Only the valid badge should be rendered
    const pollCreatorElements = screen.getAllByText('Poll Creator');
    expect(pollCreatorElements.length).toBeGreaterThan(0);
    expect(screen.queryByText('invalid_type')).not.toBeInTheDocument();
  });

  it('should call refreshUserStats on mount', () => {
    const mockBadges = [
      createMockBadge({ type: 'poll_creator', level: 1 }),
    ];

    (useUser as any).mockReturnValue({
      user: { userId: 'user_123', username: 'testuser' },
      badges: mockBadges,
      refreshUserStats: refreshUserStatsMock
    });

    render(<BadgeShowcase />);

    // refreshUserStats should be called once when component mounts
    expect(refreshUserStatsMock).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', () => {
    // Mock console.error to avoid test output noise
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockBadges = [
      createMockBadge({ type: 'poll_creator', level: 1 }),
    ];

    // Make refreshUserStats throw an error
    const errorRefreshUserStats = vi.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    (useUser as any).mockReturnValue({
      user: { userId: 'user_123', username: 'testuser' },
      badges: mockBadges,
      refreshUserStats: errorRefreshUserStats
    });

    const { container } = render(<BadgeShowcase />);

    // Component should set hasError and not render anything
    expect(container.firstChild).toBeNull();
    
    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error refreshing user stats:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });
});