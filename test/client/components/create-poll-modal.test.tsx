import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreatePollModal } from '../../../client/src/components/create-poll-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useUser hook
vi.mock('../../../client/src/context/user-context', () => ({
  useUser: () => ({
    user: { userId: 'user123', username: 'testuser' },
    userInitials: 'TU',
    isLoggingIn: false,
    logout: vi.fn(),
    login: vi.fn()
  })
}));

// Mock toast hook
vi.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock apiRequest and queryClient
vi.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) }),
  queryClient: {
    invalidateQueries: vi.fn()
  }
}));

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn((fn) => fn),
    formState: { errors: {} },
    control: {},
    reset: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn().mockReturnValue(['option1', 'option2']),
  }),
  Controller: ({ render }) => render({ field: { onChange: vi.fn(), value: '' } })
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }) => <div data-testid="dialog-footer">{children}</div>
}));

// Mock form components
vi.mock('@/components/ui/form', () => ({
  Form: ({ children }) => <form data-testid="form">{children}</form>,
  FormField: ({ children }) => <div data-testid="form-field">{children}</div>,
  FormItem: ({ children }) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }) => <label data-testid="form-label">{children}</label>,
  FormControl: ({ children }) => <div data-testid="form-control">{children}</div>,
  FormDescription: ({ children }) => <div data-testid="form-description">{children}</div>,
  FormMessage: ({ children }) => <div data-testid="form-message">{children}</div>,
  useFormField: () => ({ id: 'test-id' })
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, type }) => (
    <button 
      data-testid={`button-${variant || 'default'}`} 
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}));

// Mock Input component
vi.mock('@/components/ui/input', () => ({
  Input: (props) => <input data-testid="input" {...props} />
}));

// Mock Textarea component
vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props) => <textarea data-testid="textarea" {...props} />
}));

// Mock DatePicker component
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ value, onChange }) => (
    <input 
      data-testid="date-picker" 
      type="date" 
      value={value?.toISOString().split('T')[0] || ''} 
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  )
}));

describe('CreatePollModal', () => {
  const mockOnOpenChange = vi.fn();
  let queryClient: QueryClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });
  
  // Helper function to render component with query client
  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };
  
  it('should render the create poll form when open is true', () => {
    renderWithQueryClient(
      <CreatePollModal
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );
    
    // Check if the dialog is rendered
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByTestId('create-poll-form')).toBeInTheDocument();
    // Check that the options count is rendered
    expect(screen.getByTestId('options-count')).toBeInTheDocument();
  });
  
  it('should not render when open is false', () => {
    renderWithQueryClient(
      <CreatePollModal
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    );
    
    // Dialog should not be rendered
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });
  
  it('should handle form input changes', async () => {
    renderWithQueryClient(
      <CreatePollModal
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );
    
    // Get input fields
    const inputs = screen.getAllByTestId('input');
    const textarea = screen.getByTestId('textarea');
    
    // Set values
    if (inputs.length >= 3) {
      // Question input
      fireEvent.change(inputs[0], { target: { value: 'Test Question?' } });
      
      // Option inputs
      fireEvent.change(inputs[1], { target: { value: 'Option 1' } });
      fireEvent.change(inputs[2], { target: { value: 'Option 2' } });
    }
    
    // Description
    fireEvent.change(textarea, { target: { value: 'Test Description' } });
    
    // Verify values were set in DOM
    expect(inputs[0]).toHaveValue('Test Question?');
    expect(inputs[1]).toHaveValue('Option 1');
    expect(inputs[2]).toHaveValue('Option 2');
    expect(textarea).toHaveValue('Test Description');
  });
});