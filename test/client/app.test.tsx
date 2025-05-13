import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../../client/src/App';
import { renderWithProviders } from '../utils/render';

// Mock the router
vi.mock('wouter', () => ({
  useLocation: () => ['/'],
  useRoute: () => [true],
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Switch: ({ children }: any) => <div>{children}</div>,
  Route: ({ children }: any) => <div>{children}</div>,
}));

// Mock the pages
vi.mock('../../client/src/pages/home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock('../../client/src/pages/poll-details', () => ({
  default: () => <div data-testid="poll-details-page">Poll Details Page</div>,
}));

vi.mock('../../client/src/pages/not-found', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>,
}));

// Mock Layout component
vi.mock('../../client/src/components/layout', () => ({
  default: ({ children }: any) => (
    <div data-testid="layout-component">
      <div data-testid="layout-content">{children}</div>
    </div>
  ),
}));

describe('App Component', () => {
  it('should render with the layout component', () => {
    renderWithProviders(<App />);
    
    // Layout should be present
    expect(screen.getByTestId('layout-component')).toBeInTheDocument();
    
    // Content should be inside the layout
    expect(screen.getByTestId('layout-content')).toBeInTheDocument();
  });

  it('should render router with routes', () => {
    renderWithProviders(<App />);
    
    // Home page should be rendered since the mocked router
    // sets the current location to '/'
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});