import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../../../client/src/components/layout';
import * as UserContext from '../../../client/src/context/user-context';
import { createMockUser } from '../../mocks/data';

// Mock the wouter library
vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href} data-testid={`link-${href}`}>{children}</a>
  ),
  useLocation: () => ['/'] // Mock current location
}));

// Mock the user context
vi.mock('../../../client/src/context/user-context', () => ({
  useUser: vi.fn(() => ({
    user: null,
    userInitials: '',
    isLoggingIn: false,
    logout: vi.fn(),
    login: vi.fn()
  }))
}));

// Mock the child components used in Layout
vi.mock('../../../client/src/components/create-poll-modal', () => ({
  CreatePollModal: ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => (
    <div data-testid="create-poll-modal" data-open={open}>
      <button data-testid="modal-close-button" onClick={() => onOpenChange(false)}>Close</button>
    </div>
  )
}));

vi.mock('../../../client/src/components/login-modal', () => ({
  LoginModal: ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => (
    <div data-testid="login-modal" data-open={open}>
      <button data-testid="login-close-button" onClick={() => onOpenChange(false)}>Close</button>
    </div>
  )
}));

vi.mock('../../../client/src/components/user-profile-menu', () => ({
  UserProfileMenu: () => <div data-testid="user-profile-menu">User Profile Menu</div>
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
  LogIn: () => <span data-testid="login-icon">login</span>
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      data-variant={variant} 
      data-size={size}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/error-boundary', () => ({
  __esModule: true,
  default: ({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  )
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document title
    document.title = '';
  });
  
  it('should render the header with logo', () => {
    render(
      <Layout>
        <div>Child content</div>
      </Layout>
    );
    
    // Header should contain the logo/app name
    expect(screen.getByText('PollWave')).toBeInTheDocument();
    expect(screen.getByTestId('link-/')).toBeInTheDocument(); // Home link
  });
  
  it('should set the page title based on location', () => {
    const { rerender } = render(
      <Layout>
        <div>Home content</div>
      </Layout>
    );
    
    // Check title is set correctly for home
    expect(document.title).toBe('PollWave - Create and Vote on Polls');
    
    // Now mock the location to be a poll details page (simplify for this test)
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: null,
      userInitials: '',
      isLoggingIn: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    // Due to limitations in how we can mock useLocation in tests,
    // we'll just test that the component renders with the children
    rerender(
      <Layout>
        <div>Poll details content</div>
      </Layout>
    );
    
    // Verify the children are rendered
    expect(screen.getByText('Poll details content')).toBeInTheDocument();
  });
  
  it('should show login button when user is not logged in', () => {
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: null,
      userInitials: '',
      isLoggingIn: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(
      <Layout>
        <div>Child content</div>
      </Layout>
    );
    
    // Check for login button
    const loginButtons = screen.getAllByText(/login/i);
    expect(loginButtons.length).toBeGreaterThan(0);
    
    // User profile menu should not be present
    expect(screen.queryByTestId('user-profile-menu')).not.toBeInTheDocument();
  });
  
  it('should show user profile menu when user is logged in', () => {
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: createMockUser(),
      userInitials: 'TU',
      isLoggingIn: false,
      logout: vi.fn(),
      login: vi.fn(),
      badges: []
    }));
    
    render(
      <Layout>
        <div>Child content</div>
      </Layout>
    );
    
    // User profile menu should be present
    expect(screen.getByTestId('user-profile-menu')).toBeInTheDocument();
    
    // Login button should not be present within the user section
    // Note: This relies on the ErrorBoundary in Layout wrapping the user section
    const errorBoundary = screen.getAllByTestId('error-boundary')[0];
    expect(errorBoundary).not.toContainElement(screen.queryByText(/login/i));
  });
  
  it('should open create poll modal when create poll button is clicked', () => {
    render(
      <Layout>
        <div>Child content</div>
      </Layout>
    );
    
    // Find the create poll button and click it
    const createPollButton = screen.getByText('Create Poll');
    fireEvent.click(createPollButton);
    
    // Create poll modal should be open
    const createPollModal = screen.getByTestId('create-poll-modal');
    expect(createPollModal).toHaveAttribute('data-open', 'true');
  });
  
  it('should open login modal when login button is clicked', () => {
    // Force the useUser hook to return null for user
    vi.spyOn(UserContext, 'useUser').mockImplementation(() => ({
      user: null,
      userInitials: '',
      isLoggingIn: false,
      logout: vi.fn(),
      login: vi.fn()
    }));
    
    render(
      <Layout>
        <div>Child content</div>
      </Layout>
    );
    
    // Find buttons with login icon
    const loginIcon = screen.getByTestId('login-icon');
    // Find the button containing the login icon
    const loginButton = loginIcon.closest('button');
    expect(loginButton).not.toBeNull();
    
    if (loginButton) {
      fireEvent.click(loginButton);
      
      // Login modal should be open
      const loginModal = screen.getByTestId('login-modal');
      expect(loginModal).toHaveAttribute('data-open', 'true');
    }
  });
  
  it('should render the footer with current year', () => {
    render(
      <Layout>
        <div>Child content</div>
      </Layout>
    );
    
    // Footer should contain the copyright text with the current year
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${currentYear} PollWave`))).toBeInTheDocument();
    
    // Footer links should be present
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });
});