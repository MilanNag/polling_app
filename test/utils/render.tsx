import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MockQueryClientProvider, createTestQueryClient } from '../mocks/queryClient';
import { MockUserProvider, mockUserContextValue } from '../mocks/userContext';
import type { QueryClient } from '@tanstack/react-query';

// Extended render options
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  userProviderProps?: {
    customValue?: Partial<typeof mockUserContextValue>;
  };
}

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    userProviderProps = {},
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockQueryClientProvider queryClient={queryClient}>
        <MockUserProvider {...userProviderProps}>
          {children}
        </MockUserProvider>
      </MockQueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}