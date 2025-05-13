import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../../../client/src/components/error-boundary';

// Create a component that throws an error
const ThrowError = ({ message = 'Test error message' }: { message?: string }) => {
  throw new Error(message);
};

// Suppress console.error for cleaner test output
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should render default error UI when child throws error', () => {
    // We need to spy on console.error because React logs the error
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Render will throw an error, but ErrorBoundary should catch it
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Check if the default error message is displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    
    // Check that error was logged
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should render custom fallback when provided and error occurs', () => {
    // We need to spy on console.error because React logs the error
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Render with custom fallback and component that throws
    render(
      <ErrorBoundary 
        fallback={<div data-testid="custom-fallback">Custom Error UI</div>}
      >
        <ThrowError />
      </ErrorBoundary>
    );

    // Check if custom fallback is displayed
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    
    // The default error UI should not be shown
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    
    // Check that error was logged
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should include the error message in the default UI', () => {
    // We need to spy on console.error because React logs the error
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const customErrorMessage = 'Custom error occurred';
    
    // Render will throw an error with custom message
    render(
      <ErrorBoundary>
        <ThrowError message={customErrorMessage} />
      </ErrorBoundary>
    );

    // Check if the custom error message is displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(customErrorMessage)).toBeInTheDocument();
    
    // Check that error was logged
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should show unknown error message when error has no message', () => {
    // We need to spy on console.error because React logs the error
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a component that throws an error without a message
    const ThrowErrorWithoutMessage = () => {
      throw new Error();
    };
    
    // Render will throw an error without message
    render(
      <ErrorBoundary>
        <ThrowErrorWithoutMessage />
      </ErrorBoundary>
    );

    // Check if the default unknown error message is displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    
    // Check that error was logged
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});