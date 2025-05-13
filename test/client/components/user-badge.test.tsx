import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserBadge } from '../../../client/src/components/user-badge';
import { createMockBadge } from '../../mocks/data';
import { badgeTypes } from '../../../shared/schema';

// We need to mock the badgeInfo from shared/schema
vi.mock('../../../shared/schema', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    badgeInfo: {
      poll_creator: {
        name: "Poll Creator",
        description: "Create your first poll",
        icon: "📊",
        levels: [
          { level: 1, requirement: 1, title: "Novice Pollster" },
          { level: 2, requirement: 5, title: "Poll Enthusiast" },
          { level: 3, requirement: 10, title: "Poll Master" }
        ]
      },
      first_vote: {
        name: "First Vote",
        description: "Cast your first vote",
        icon: "👍",
        levels: [
          { level: 1, requirement: 1, title: "First-time Voter" },
          { level: 2, requirement: 5, title: "Regular Voter" },
          { level: 3, requirement: 20, title: "Dedicated Voter" }
        ]
      }
    }
  };
});

describe('UserBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render the badge with correct icon and level', () => {
    const mockBadge = createMockBadge({
      type: badgeTypes.POLL_CREATOR,
      level: 2
    });
    
    render(<UserBadge badge={mockBadge} />);
    
    // Check if badge is rendered with the poll creator icon
    const badgeIcon = screen.getByText('📊');
    expect(badgeIcon).toBeInTheDocument();
    
    // Check if badge level is rendered
    const levelIndicator = screen.getByText('2');
    expect(levelIndicator).toBeInTheDocument();
  });
  
  it('should render the badge tooltip when hovered', () => {
    const mockBadge = createMockBadge({
      type: badgeTypes.POLL_CREATOR,
      level: 1
    });
    
    render(<UserBadge badge={mockBadge} />);
    
    // Check for tooltip elements (they're in the DOM but hidden by default)
    const tooltipTitleElement = screen.getByText('Poll Creator');
    expect(tooltipTitleElement).toBeInTheDocument();
    expect(tooltipTitleElement.closest('div')).toHaveClass('hidden', 'group-hover:block');
    
    // Check for level title
    const levelTitleElement = screen.getByText('Novice Pollster');
    expect(levelTitleElement).toBeInTheDocument();
  });
  
  it('should render the first vote badge correctly', () => {
    const mockBadge = createMockBadge({
      type: badgeTypes.FIRST_VOTE,
      level: 3
    });
    
    render(<UserBadge badge={mockBadge} />);
    
    // Check for the First Vote icon
    const badgeIcon = screen.getByText('👍');
    expect(badgeIcon).toBeInTheDocument();
    
    // Check level indicator
    const levelIndicator = screen.getByText('3');
    expect(levelIndicator).toBeInTheDocument();
    
    // Check tooltip contains First Vote text and level 3 title
    const tooltipTitleElement = screen.getByText('First Vote (Level 3)');
    expect(tooltipTitleElement).toBeInTheDocument();
    expect(screen.getByText('Dedicated Voter')).toBeInTheDocument();
  });
  
  it('should render a fallback for unknown badge types', () => {
    const mockBadge = createMockBadge({
      type: 'UNKNOWN_TYPE' as any,
      level: 1
    });
    
    render(<UserBadge badge={mockBadge} />);
    
    // Check for the fallback question mark for unknown badge types
    const fallbackIndicator = screen.getByText('?');
    expect(fallbackIndicator).toBeInTheDocument();
    
    // Verify the badge has the fallback styling
    expect(fallbackIndicator.closest('div')).toHaveClass('bg-gray-200', 'text-gray-600');
  });

  it('should return null for invalid badge data', () => {
    // @ts-ignore - Testing invalid data
    const { container } = render(<UserBadge badge={null} />);
    expect(container.firstChild).toBeNull();
    
    // @ts-ignore - Testing invalid data
    const { container: container2 } = render(<UserBadge badge={{}} />);
    expect(container2.firstChild).toBeNull();
  });

  it('should use default level when badge level is undefined', () => {
    const mockBadge = createMockBadge({
      type: badgeTypes.POLL_CREATOR,
      level: undefined as any
    });
    
    render(<UserBadge badge={mockBadge} />);
    
    // Should show title for level 1 since that's the default
    expect(screen.getByText('Novice Pollster')).toBeInTheDocument();
    
    // Check the badge is rendered
    expect(screen.getByText('📊')).toBeInTheDocument();
    
    // When level is undefined, the badge div should be empty
    const levelIndicator = document.querySelector('.border-indigo-500');
    expect(levelIndicator).toBeInTheDocument();
    // The level indicator should be empty (no text content)
    expect(levelIndicator).toHaveTextContent('');
  });

  it('should display different sizes based on the size prop', () => {
    const mockBadge = createMockBadge({
      type: badgeTypes.POLL_CREATOR,
      level: 2
    });
    
    // Test small size
    const { container, rerender } = render(<UserBadge badge={mockBadge} size="sm" />);
    const smallBadge = container.firstChild?.firstChild;
    expect(smallBadge).toHaveClass('h-8', 'w-8', 'text-sm');
    
    // Test medium size (default)
    rerender(<UserBadge badge={mockBadge} size="md" />);
    const mediumBadge = container.firstChild?.firstChild;
    expect(mediumBadge).toHaveClass('h-12', 'w-12', 'text-xl');
    
    // Test large size
    rerender(<UserBadge badge={mockBadge} size="lg" />);
    const largeBadge = container.firstChild?.firstChild;
    expect(largeBadge).toHaveClass('h-16', 'w-16', 'text-2xl');
  });
});