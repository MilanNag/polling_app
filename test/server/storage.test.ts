import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'jest-mock-extended';
import { DatabaseStorage } from '../../server/storage';
import { PgSelect, PgInsert, PgUpdate, PgDelete } from 'drizzle-orm/pg-core';

// Mock the db operations
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}));

// Mock Drizzle's table schemas
vi.mock('@shared/schema', () => ({
  users: { id: 'id' },
  polls: { id: 'id', userId: 'userId', isActive: 'isActive', isRemoved: 'isRemoved' },
  options: { id: 'id', pollId: 'pollId' },
  votes: { id: 'id', pollId: 'pollId', userId: 'userId', optionId: 'optionId' },
  badges: { id: 'id', userId: 'userId', type: 'type', level: 'level' },
  badgeTypes: {
    POLL_CREATOR: 'POLL_CREATOR',
    VOTER: 'VOTER',
    VETERAN: 'VETERAN',
    INFLUENCER: 'INFLUENCER'
  },
  badgeInfo: {
    POLL_CREATOR: { 
      name: 'Poll Creator', 
      description: 'Created polls',
      levels: [
        { threshold: 1, name: 'Novice Pollster' },
        { threshold: 5, name: 'Poll Enthusiast' },
        { threshold: 10, name: 'Poll Master' }
      ]
    },
    VOTER: {
      name: 'Voter',
      description: 'Voted in polls',
      levels: [
        { threshold: 1, name: 'First Vote' },
        { threshold: 10, name: 'Active Voter' },
        { threshold: 25, name: 'Voting Enthusiast' }
      ]
    },
  }
}));

import { db } from '../../server/db';
import { 
  users, polls, options, votes, badges, 
  badgeTypes, badgeInfo 
} from '@shared/schema';

describe('DatabaseStorage', () => {
  let storage: DatabaseStorage;
  
  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });
  
  describe('User Methods', () => {
    it('should get a user by ID', async () => {
      const mockUser = { id: 1, userId: 'user_123', username: 'test' };
      (db.select().from(users).where().returning as any).mockResolvedValueOnce([mockUser]);
      
      const result = await storage.getUser(1);
      
      expect(result).toEqual(mockUser);
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalledWith(users);
    });
    
    it('should return undefined if user not found', async () => {
      (db.select().from(users).where().returning as any).mockResolvedValueOnce([]);
      
      const result = await storage.getUser(999);
      
      expect(result).toBeUndefined();
    });
    
    it('should create a user', async () => {
      const mockUser = { 
        userId: 'user_123', 
        username: 'test' 
      };
      const createdUser = { 
        id: 1, 
        ...mockUser, 
        createdAt: new Date()
      };
      
      (db.insert().values().returning as any).mockResolvedValueOnce([createdUser]);
      
      const result = await storage.createUser(mockUser);
      
      expect(result).toEqual(createdUser);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(mockUser);
    });
    
    it('should increment user poll count', async () => {
      const mockUser = { 
        id: 1, 
        userId: 'user_123', 
        username: 'test',
        pollsCreated: 5
      };
      
      (db.select().from(users).where().returning as any).mockResolvedValueOnce([mockUser]);
      (db.update().set().where().returning as any).mockResolvedValueOnce([
        { ...mockUser, pollsCreated: 6 }
      ]);
      
      const result = await storage.incrementUserPollCount('user_123');
      
      expect(result?.pollsCreated).toBe(6);
      expect(db.update).toHaveBeenCalled();
    });
  });
  
  describe('Poll Methods', () => {
    it('should create a poll', async () => {
      const mockPoll = { 
        question: 'Test?', 
        userId: 'user_123',
        username: 'test',
        description: '',
        isActive: true
      };
      const createdPoll = { 
        id: 1, 
        ...mockPoll, 
        createdAt: new Date(),
        expiresAt: new Date(),
        isRemoved: false
      };
      
      (db.insert().values().returning as any).mockResolvedValueOnce([createdPoll]);
      
      const result = await storage.createPoll(mockPoll);
      
      expect(result).toEqual(createdPoll);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(mockPoll);
    });
    
    it('should get polls by active status', async () => {
      const mockPolls = [
        { id: 1, question: 'Test 1?', isActive: true },
        { id: 2, question: 'Test 2?', isActive: true }
      ];
      
      (db.select().from(polls).where().returning as any).mockResolvedValueOnce(mockPolls);
      
      const result = await storage.getPolls(true);
      
      expect(result).toEqual(mockPolls);
      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
    
    it('should update poll status', async () => {
      const mockPoll = { 
        id: 1, 
        question: 'Test?', 
        isActive: true 
      };
      
      (db.update().set().where().returning as any).mockResolvedValueOnce([
        { ...mockPoll, isActive: false }
      ]);
      
      const result = await storage.updatePollStatus(1, false);
      
      expect(result?.isActive).toBe(false);
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith({ isActive: false });
    });
    
    it('should mark a poll as removed', async () => {
      const mockPoll = { 
        id: 1, 
        question: 'Test?', 
        isRemoved: false 
      };
      
      (db.update().set().where().returning as any).mockResolvedValueOnce([
        { ...mockPoll, isRemoved: true }
      ]);
      
      const result = await storage.removePoll(1);
      
      expect(result?.isRemoved).toBe(true);
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith({ isRemoved: true });
    });
  });
  
  describe('Badge Methods', () => {
    it('should create a badge', async () => {
      const mockBadge = { 
        userId: 'user_123', 
        type: 'POLL_CREATOR',
        level: 1
      };
      const createdBadge = { 
        id: 1, 
        ...mockBadge, 
        createdAt: new Date()
      };
      
      (db.insert().values().returning as any).mockResolvedValueOnce([createdBadge]);
      
      const result = await storage.createBadge(mockBadge);
      
      expect(result).toEqual(createdBadge);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(mockBadge);
    });
    
    it('should check if a user has a badge type', async () => {
      (db.select().from(badges).where().returning as any).mockResolvedValueOnce([
        { id: 1, userId: 'user_123', type: 'POLL_CREATOR', level: 1 }
      ]);
      
      const result = await storage.hasBadge('user_123', 'POLL_CREATOR');
      
      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalledWith(badges);
    });
    
    it('should update a badge level', async () => {
      const mockBadge = { 
        id: 1, 
        userId: 'user_123', 
        type: 'POLL_CREATOR',
        level: 1
      };
      
      (db.select().from(badges).where().returning as any).mockResolvedValueOnce([mockBadge]);
      (db.update().set().where().returning as any).mockResolvedValueOnce([
        { ...mockBadge, level: 2 }
      ]);
      
      const result = await storage.updateBadgeLevel('user_123', 'POLL_CREATOR', 2);
      
      expect(result?.level).toBe(2);
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith({ level: 2 });
    });
    
    it('should check and award badges based on user stats', async () => {
      // Mock user with 5 polls created and 10 votes
      const mockUser = { 
        id: 1, 
        userId: 'user_123', 
        username: 'test',
        pollsCreated: 5,
        votesSubmitted: 10
      };
      
      // Mock existing badges
      const mockBadges = [
        { id: 1, userId: 'user_123', type: 'POLL_CREATOR', level: 1 }
      ];
      
      // Mock new badge
      const newBadge = { 
        id: 2, 
        userId: 'user_123', 
        type: 'VOTER',
        level: 2,
        createdAt: new Date()
      };
      
      // Mock select for user stats
      (db.select().from(users).where().returning as any).mockResolvedValueOnce([mockUser]);
      
      // Mock select for existing badges
      (db.select().from(badges).where().returning as any).mockResolvedValueOnce(mockBadges);
      
      // Mock for poll creator badge check (already has level 1)
      (db.select().from(badges).where().returning as any).mockResolvedValueOnce([mockBadges[0]]);
      
      // Mock update for poll creator badge to level 2 (5 polls)
      (db.update().set().where().returning as any).mockResolvedValueOnce([
        { ...mockBadges[0], level: 2 }
      ]);
      
      // Mock for voter badge check (doesn't have)
      (db.select().from(badges).where().returning as any).mockResolvedValueOnce([]);
      
      // Mock insert for new voter badge
      (db.insert().values().returning as any).mockResolvedValueOnce([newBadge]);
      
      const result = await storage.checkAndAwardBadges('user_123');
      
      // Should return array with updated badges
      expect(result.length).toBe(2);
      expect(result[0].level).toBe(2); // Updated poll creator badge
      expect(result[1].type).toBe('VOTER'); // New voter badge
    });
  });
});