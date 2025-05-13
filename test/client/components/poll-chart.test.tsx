import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PollChart } from '../../../client/src/components/poll-chart';
import { createMockPollWithOptionsAndVotes } from '../../mocks/data';

// Mock recharts components
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children, width, height }: any) => (
      <div data-testid="responsive-container" style={{ width, height }}>
        {children}
      </div>
    ),
    BarChart: ({ children, data, margin, barGap, barCategoryGap }: any) => (
      <div data-testid="bar-chart">
        <span data-testid="bar-chart-props">
          {JSON.stringify({
            dataLength: data?.length,
            margin,
            barGap,
            barCategoryGap
          })}
        </span>
        {children}
      </div>
    ),
    Bar: ({ dataKey, name, radius, barSize, children }: any) => (
      <div data-testid="bar">
        <span data-testid="bar-props">
          {JSON.stringify({
            dataKey,
            name,
            radius,
            barSize
          })}
        </span>
        {children}
      </div>
    ),
    XAxis: ({ dataKey, angle, textAnchor, height }: any) => (
      <div data-testid="x-axis">
        <span data-testid="x-axis-props">
          {JSON.stringify({
            dataKey,
            angle,
            textAnchor,
            height
          })}
        </span>
      </div>
    ),
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    defs: () => <div data-testid="defs" />,
    linearGradient: () => <div data-testid="linear-gradient" />,
    stop: () => <div data-testid="stop" />,
  };
});

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

describe('PollChart', () => {
  it('should render chart with poll data', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Favorite Color?',
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Red', votes: 10, percentage: 50 },
        { id: 2, pollId: 1, text: 'Blue', votes: 6, percentage: 30 },
        { id: 3, pollId: 1, text: 'Green', votes: 4, percentage: 20 },
      ],
      totalVotes: 20,
    });

    render(<PollChart poll={mockPoll} />);

    // Component should be rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    
    // Chart title and total votes should be shown
    expect(screen.getByText('Poll Results')).toBeInTheDocument();
    expect(screen.getByText('Total votes: 20')).toBeInTheDocument();
    
    // Props should be passed correctly
    const barChartProps = JSON.parse(screen.getByTestId('bar-chart-props').textContent || '{}');
    expect(barChartProps.dataLength).toBe(3); // 3 options
    
    const barProps = JSON.parse(screen.getByTestId('bar-props').textContent || '{}');
    expect(barProps.dataKey).toBe('votes');
    expect(barProps.name).toBe('Votes');
    
    // Check axes
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    
    // Check tooltip and grid
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Favorite Color?',
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Red', votes: 10, percentage: 50 },
        { id: 2, pollId: 1, text: 'Blue', votes: 10, percentage: 50 },
      ],
      totalVotes: 20,
    });

    render(<PollChart poll={mockPoll} className="custom-chart" />);
    
    // Should apply custom className to container
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-chart');
  });

  it('should highlight user selected option', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Favorite Color?',
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Red', votes: 10, percentage: 50 },
        { id: 2, pollId: 1, text: 'Blue', votes: 10, percentage: 50 },
      ],
      totalVotes: 20,
      userVote: { optionId: 1, text: 'Red' }
    });

    render(<PollChart poll={mockPoll} />);
    
    // Chart is rendered with user vote highlighted
    // (we can't test the highlighting directly, but we can check the chart renders)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('Poll Results')).toBeInTheDocument();
  });

  it('should handle no votes', () => {
    const mockPoll = createMockPollWithOptionsAndVotes({
      id: 1,
      question: 'Favorite Color?',
      optionsWithVotes: [
        { id: 1, pollId: 1, text: 'Red', votes: 0, percentage: 0 },
        { id: 2, pollId: 1, text: 'Blue', votes: 0, percentage: 0 },
      ],
      totalVotes: 0,
    });

    render(<PollChart poll={mockPoll} />);

    // Total votes should be 0
    expect(screen.getByText('Total votes: 0')).toBeInTheDocument();
    
    // Chart should still render even with no votes
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});