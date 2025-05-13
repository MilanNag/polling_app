import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import NotFound from '../../../client/src/pages/not-found';
import { renderWithProviders } from '../../utils/render';

describe('NotFound Page', () => {
  it('should render error message', () => {
    renderWithProviders(React.createElement(NotFound));
    
    // Should show 404 error message
    expect(screen.getByText('404 Page Not Found')).toBeInTheDocument();
    
    // Should show additional text
    expect(screen.getByText('Did you forget to add the page to the router?')).toBeInTheDocument();
  });
  
  it('should render error icon', () => {
    renderWithProviders(React.createElement(NotFound));
    
    // Check if the alert icon is present
    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });
  
  it('should have a home link', () => {
    renderWithProviders(React.createElement(NotFound));
    
    // Check if the back to home link is present and has the correct attributes
    const homeLink = screen.getByRole('link', { name: /back to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
  
  it('should have correct styling', () => {
    renderWithProviders(React.createElement(NotFound));
    
    // Check if main container has the correct styles
    const container = screen.getByRole('main');
    expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    
    // Check heading styling
    const heading = screen.getByRole('heading', { name: /404 page not found/i });
    expect(heading).toHaveClass('text-2xl', 'font-bold');
  });
});