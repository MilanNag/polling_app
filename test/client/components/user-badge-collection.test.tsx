import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserBadgeCollection } from '../../../client/src/components/user-badge';
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
      },
      vote_collector: {
        name: "Vote Collector",
        description: "Collect votes on your polls",
        icon: "🗳️",
        levels: [
          { level: 1, requirement: 10, title: "Vote Gatherer" },
          { level: 2, requirement: 50, title: "Vote Magnet" },
          { level: 3, requirement: 100, title: "Vote Champion" }
        ]
      }
    }
  };
});

describe('UserBadgeCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render multiple badges correctly', () => {
    const mockBadges = [
      createMockBadge({ 
        type: badgeTypes.POLL_CREATOR, 
        level: 2,
        earnedAt: new Date('2023-05-01')
      }),
      createMockBadge({ 
        type: badgeTypes.FIRST_VOTE, 
        level: 1,
        earnedAt: new Date('2023-05-15') 
      }),
      createMockBadge({ 
        type: badgeTypes.VOTE_COLLECTOR, 
        level: 3,
        earnedAt: new Date('2023-05-10')
      })
    ];
    
    render(<UserBadgeCollection badges={mockBadges} />);
    
    // Check that all three badges are rendered
    expect(screen.getByText('📊')).toBeInTheDocument(); // Poll Creator
    expect(screen.getByText('👍')).toBeInTheDocument(); // First Vote
    expect(screen.getByText('🗳️')).toBeInTheDocument(); // Vote Collector
    
    // Check level indicators
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  
  it('should limit the number of badges displayed', () => {
    const mockBadges = [
      createMockBadge({ 
        type: badgeTypes.POLL_CREATOR, 
        level: 3,
        earnedAt: new Date('2023-05-01')
      }),
      createMockBadge({ 
        type: badgeTypes.FIRST_VOTE, 
        level: 2,
        earnedAt: new Date('2023-05-15') 
      }),
      createMockBadge({ 
        type: badgeTypes.VOTE_COLLECTOR, 
        level: 1,
        earnedAt: new Date('2023-05-10')
      }),
      createMockBadge({ 
        type: badgeTypes.POLL_MASTER, 
        level: 2,
        earnedAt: new Date('2023-05-20')
      })
    ];
    
    render(<UserBadgeCollection badges={mockBadges} maxDisplay={2} />);
    
    // Should display only the first two badges (sorted by level descending, then date)
    // and a +2 indicator for the remaining
    
    // Check that the +2 element is present
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
  
  it('should return null for empty badge arrays', () => {
    const { container } = render(<UserBadgeCollection badges={[]} />);
    
    // The container should be empty as the component returned null
    expect(container.firstChild).toBeNull();
  });
  
  it('should sort badges by level and then by earn date', () => {
    const mockBadges = [
      createMockBadge({ 
        type: badgeTypes.POLL_CREATOR, 
        level: 1,
        earnedAt: new Date('2023-05-01')
      }),
      createMockBadge({ 
        type: badgeTypes.FIRST_VOTE, 
        level: 3,
        earnedAt: new Date('2023-05-15') 
      }),
      createMockBadge({ 
        type: badgeTypes.VOTE_COLLECTOR, 
        level: 3,
        earnedAt: new Date('2023-05-20')
      })
    ];
    
    render(<UserBadgeCollection badges={mockBadges} />);
    
    // Check badge order by matching the order of emojis in the DOM
    // The highest level (3) badges should come first, with the most recent one first
    const badgeIcons = screen.getAllByRole('img', { name: /poll creator|first vote|vote collector/i });
    
    // Verify the order: First should be Vote Collector (level 3, newest),
    // then First Vote (level 3, older), then Poll Creator (level 1)
    expect(badgeIcons[0]).toHaveTextContent('🗳️'); // Vote Collector
    expect(badgeIcons[1]).toHaveTextContent('👍'); // First Vote 
    expect(badgeIcons[2]).toHaveTextContent('📊'); // Poll Creator
  });

  it('should handle non-array badge data correctly', () => {
    // @ts-ignore - Testing invalid data
    const { container } = render(<UserBadgeCollection badges={null} />);
    expect(container.firstChild).toBeNull();
    
    // @ts-ignore - Testing invalid data
    const { container: container2 } = render(<UserBadgeCollection badges={undefined} />);
    expect(container2.firstChild).toBeNull();
    
    // @ts-ignore - Testing invalid data type
    const { container: container3 } = render(<UserBadgeCollection badges={'invalid' as any} />);
    expect(container3.firstChild).toBeNull();
  });

  it('should display different sizes for the +remaining indicator', () => {
    // Create badges with unique combinations of type and level
    const mockBadges = [
      createMockBadge({
        id: 1,
        type: badgeTypes.POLL_CREATOR,
        level: 1,
        earnedAt: new Date('2023-05-01')
      }),
      createMockBadge({
        id: 2,
        type: badgeTypes.FIRST_VOTE,
        level: 1,
        earnedAt: new Date('2023-05-02')
      }),
      createMockBadge({
        id: 3,
        type: badgeTypes.VOTE_COLLECTOR,
        level: 1,
        earnedAt: new Date('2023-05-03')
      }),
      createMockBadge({
        id: 4,
        type: badgeTypes.POLL_CREATOR,
        level: 2,
        earnedAt: new Date('2023-05-04')
      }),
      createMockBadge({
        id: 5,
        type: badgeTypes.FIRST_VOTE, 
        level: 2,
        earnedAt: new Date('2023-05-05')
      })
    ];
    
    // Test small size
    const { container, rerender } = render(
      <UserBadgeCollection badges={mockBadges} maxDisplay={3} size="sm" />
    );
    const remainingIndicator = screen.getByText('+2');
    expect(remainingIndicator).toHaveClass('h-8', 'w-8', 'text-xs');
    
    // Test medium size
    rerender(<UserBadgeCollection badges={mockBadges} maxDisplay={3} size="md" />);
    expect(screen.getByText('+2')).toHaveClass('h-12', 'w-12', 'text-sm');
    
    // Test large size
    rerender(<UserBadgeCollection badges={mockBadges} maxDisplay={3} size="lg" />);
    expect(screen.getByText('+2')).toHaveClass('h-16', 'w-16', 'text-base');
  });
});