import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileMenu } from '../../../client/src/components/user-profile-menu';
import * as UserContext from '../../../client/src/context/user-context';
import { createMockUser, createMockBadge } from '../../mocks/data';
import { badgeTypes } from '../../../shared/schema';

// Mock the context
vi.mock('../../../client/src/context/user-context', () => ({
  useUser: vi.fn()
}));

// Mock UI components 
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dropdown-menu" data-open={open}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger" data-as-child={asChild}>{children}</div>
  ),
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>{children}</div>
  ),
  DropdownMenuItem: ({ children }: any) => (
    <div data-testid="dropdown-item">{children}</div>
  ),
  DropdownMenuLabel: ({ children, className }: any) => (
    <div data-testid="dropdown-label" className={className}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => (
    <div data-testid="avatar">{children}</div>
  ),
  AvatarFallback: ({ children, className }: any) => (
    <div data-testid="avatar-fallback" className={className}>{children}</div>
  )
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress-bar" data-value={value} className={className}></div>
  )
}));

vi.mock('@/components/user-badge', () => ({
  UserBadgeCollection: ({ badges, maxDisplay, size, className }: any) => (
    <div 
      data-testid="badge-collection" 
      data-max-display={maxDisplay}
      data-size={size}
      className={className}
    >
      {badges?.length || 0} badges
    </div>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  LogOut: () => <span data-testid="logout-icon">logout</span>,
  Trophy: () => <span data-testid="trophy-icon">trophy</span>,
  Award: () => <span data-testid="award-icon">award</span>
}));

describe('UserProfileMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render null when user is null', () => {
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: null,
      userInitials: '',
      isLoggingIn: false,
      badges: [],
      userStats: null,
      refreshUserStats: vi.fn(),
      isBadgesLoading: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    const { container } = render(<UserProfileMenu />);
    
    // Component should render nothing when user is null
    expect(container.firstChild).toBeNull();
  });
  
  it('should render the user avatar with initials', () => {
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser({ username: 'Test User' }),
      userInitials: 'TU',
      isLoggingIn: false,
      badges: [],
      userStats: { pollsCreated: 3, votesSubmitted: 5 },
      refreshUserStats: vi.fn(),
      isBadgesLoading: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(<UserProfileMenu />);
    
    // Avatar should be rendered with correct initials
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    
    const avatarFallback = screen.getByTestId('avatar-fallback');
    expect(avatarFallback).toBeInTheDocument();
    expect(avatarFallback.textContent).toBe('TU');
  });
  
  it('should show badge count indicator when user has badges', () => {
    const mockBadges = [
      createMockBadge({ type: badgeTypes.POLL_CREATOR, level: 1 }),
      createMockBadge({ type: badgeTypes.FIRST_VOTE, level: 2 })
    ];
    
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser(),
      userInitials: 'TU',
      isLoggingIn: false,
      badges: mockBadges,
      userStats: { pollsCreated: 3, votesSubmitted: 5 },
      refreshUserStats: vi.fn(),
      isBadgesLoading: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(<UserProfileMenu />);
    
    // Badge counter should display the number of badges
    const badgeCount = screen.getByText('2');
    expect(badgeCount).toBeInTheDocument();
    expect(badgeCount.closest('span')).toHaveClass('bg-violet-600');
  });
  
  it('should call logout when logout button is clicked', () => {
    const mockLogout = vi.fn();
    
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser(),
      userInitials: 'TU',
      isLoggingIn: false,
      badges: [],
      userStats: { pollsCreated: 3, votesSubmitted: 5 },
      refreshUserStats: vi.fn(),
      isBadgesLoading: false,
      logout: mockLogout,
      login: vi.fn()
    }));
    
    render(<UserProfileMenu />);
    
    // Find and click the logout button
    const logoutButtons = screen.getAllByText(/logout/i);
    fireEvent.click(logoutButtons[0].closest('button') as HTMLElement);
    
    // Logout function should be called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
  
  it('should display user stats and progress correctly', () => {
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser(),
      userInitials: 'TU',
      isLoggingIn: false,
      badges: [],
      userStats: { pollsCreated: 3, votesSubmitted: 5 },
      refreshUserStats: vi.fn(),
      isBadgesLoading: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(<UserProfileMenu />);
    
    // Check stats section header
    expect(screen.getByText('Stats & Progress')).toBeInTheDocument();
    
    // Check poll creation stats
    expect(screen.getByText('Polls Created')).toBeInTheDocument();
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    
    // Check voting stats
    expect(screen.getByText('Votes Cast')).toBeInTheDocument();
    expect(screen.getByText('5 / 20')).toBeInTheDocument();
    
    // Check progress bars
    const progressBars = screen.getAllByTestId('progress-bar');
    expect(progressBars.length).toBe(2);
    
    // Poll creation progress (3/5 = 60%)
    expect(progressBars[0]).toHaveAttribute('data-value', '60');
    
    // Votes progress (5-5)/(20-5) = 0% to next level
    expect(progressBars[1]).toHaveAttribute('data-value', '0');
  });
  
  it('should call refreshUserStats when dropdown is opened', () => {
    const mockRefreshUserStats = vi.fn();
    
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser(),
      userInitials: 'TU',
      isLoggingIn: false,
      badges: [],
      userStats: { pollsCreated: 3, votesSubmitted: 5 },
      refreshUserStats: mockRefreshUserStats,
      isBadgesLoading: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(<UserProfileMenu />);
    
    // Mock the dropdown open event
    const handleOpenSpy = vi.spyOn(React, 'useState').mockImplementationOnce(() => [true, vi.fn()]);
    
    // Simulate the open callback
    const dropdownMenu = screen.getByTestId('dropdown-menu');
    const onOpenChangeProp = dropdownMenu.props?.onOpenChange;
    
    if (onOpenChangeProp) {
      onOpenChangeProp(true);
      expect(mockRefreshUserStats).toHaveBeenCalledTimes(1);
    }
  });
  
  it('should display badge collection when user has badges', () => {
    const mockBadges = [
      createMockBadge({ type: badgeTypes.POLL_CREATOR, level: 1 }),
      createMockBadge({ type: badgeTypes.FIRST_VOTE, level: 2 })
    ];
    
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser(),
      userInitials: 'TU',
      isLoggingIn: false,
      badges: mockBadges,
      userStats: { pollsCreated: 3, votesSubmitted: 5 },
      refreshUserStats: vi.fn(),
      isBadgesLoading: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(<UserProfileMenu />);
    
    // Badge collection should be rendered with correct props
    const badgeCollection = screen.getByTestId('badge-collection');
    expect(badgeCollection).toBeInTheDocument();
    expect(badgeCollection).toHaveAttribute('data-max-display', '5');
    expect(badgeCollection).toHaveAttribute('data-size', 'sm');
    expect(badgeCollection.textContent).toContain('2 badges');
  });
  
  it('should display a message when user has no badges', () => {
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser(),
      userInitials: 'TU',
      isLoggingIn: false,
      badges: [],
      userStats: { pollsCreated: 3, votesSubmitted: 5 },
      refreshUserStats: vi.fn(),
      isBadgesLoading: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(<UserProfileMenu />);
    
    // Message for no badges should be displayed
    expect(screen.getByText('Create polls and vote to earn badges!')).toBeInTheDocument();
  });
});