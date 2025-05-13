import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as schema from '../../shared/schema';

describe('Database Schema', () => {
  describe('Badge Schema', () => {
    it('should have the correct badge types', () => {
      expect(schema.badgeTypes).toHaveProperty('POLL_CREATOR');
      expect(schema.badgeTypes).toHaveProperty('VOTER');
      expect(schema.badgeTypes).toHaveProperty('VETERAN');
      expect(schema.badgeTypes).toHaveProperty('INFLUENCER');
    });
    
    it('should have badge info for each badge type', () => {
      // Check that there's info for each badge type
      Object.values(schema.badgeTypes).forEach(type => {
        expect(schema.badgeInfo).toHaveProperty(type);
        expect(schema.badgeInfo[type]).toHaveProperty('name');
        expect(schema.badgeInfo[type]).toHaveProperty('description');
        expect(schema.badgeInfo[type]).toHaveProperty('levels');
        expect(schema.badgeInfo[type].levels).toBeInstanceOf(Array);
      });
      
      // Check that levels have thresholds and names
      Object.values(schema.badgeInfo).forEach(info => {
        info.levels.forEach(level => {
          expect(level).toHaveProperty('threshold');
          expect(level).toHaveProperty('name');
          expect(typeof level.threshold).toBe('number');
          expect(typeof level.name).toBe('string');
        });
      });
    });
    
    it('should have a valid badge insert schema', () => {
      expect(schema.insertBadgeSchema).toBeInstanceOf(z.ZodObject);
      
      // Should validate a valid badge
      const validBadge = {
        userId: 'user_123',
        type: schema.badgeTypes.POLL_CREATOR,
        level: 1
      };
      
      expect(schema.insertBadgeSchema.parse(validBadge)).toEqual(validBadge);
      
      // Should fail on invalid types
      expect(() => {
        schema.insertBadgeSchema.parse({
          userId: 'user_123',
          type: 'INVALID_TYPE',
          level: 1
        });
      }).toThrow();
    });
  });
  
  describe('User Schema', () => {
    it('should have a valid user insert schema', () => {
      expect(schema.insertUserSchema).toBeInstanceOf(z.ZodObject);
      
      // Should validate a valid user
      const validUser = {
        userId: 'user_123',
        username: 'testuser'
      };
      
      expect(schema.insertUserSchema.parse(validUser)).toEqual(validUser);
      
      // Should fail on missing required fields
      expect(() => {
        schema.insertUserSchema.parse({
          userId: 'user_123'
        });
      }).toThrow();
    });
  });
  
  describe('Poll Schema', () => {
    it('should have a valid poll insert schema', () => {
      expect(schema.insertPollSchema).toBeInstanceOf(z.ZodObject);
      
      // Should validate a valid poll
      const validPoll = {
        question: 'Test Question?',
        description: 'Test Description',
        userId: 'user_123',
        username: 'testuser',
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' }
        ]
      };
      
      const result = schema.insertPollSchema.parse(validPoll);
      expect(result).toEqual(expect.objectContaining({
        question: 'Test Question?',
        userId: 'user_123'
      }));
      expect(result.options).toBeInstanceOf(Array);
      expect(result.options).toHaveLength(2);
      
      // Should fail on invalid data
      expect(() => {
        schema.insertPollSchema.parse({
          question: 'Test?',
          userId: 'user_123',
          username: 'testuser',
          options: [] // No options
        });
      }).toThrow();
    });
  });
  
  describe('Option Schema', () => {
    it('should have a valid option insert schema', () => {
      expect(schema.insertOptionSchema).toBeInstanceOf(z.ZodObject);
      
      // Should validate a valid option
      const validOption = {
        pollId: 1,
        text: 'Option Text'
      };
      
      expect(schema.insertOptionSchema.parse(validOption)).toEqual(validOption);
      
      // Should fail on missing required fields
      expect(() => {
        schema.insertOptionSchema.parse({
          pollId: 1
        });
      }).toThrow();
    });
  });
  
  describe('Vote Schema', () => {
    it('should have a valid vote insert schema', () => {
      expect(schema.insertVoteSchema).toBeInstanceOf(z.ZodObject);
      
      // Should validate a valid vote
      const validVote = {
        pollId: 1,
        optionId: 2,
        userId: 'user_123'
      };
      
      expect(schema.insertVoteSchema.parse(validVote)).toEqual(validVote);
      
      // Should fail on missing required fields
      expect(() => {
        schema.insertVoteSchema.parse({
          pollId: 1,
          userId: 'user_123'
        });
      }).toThrow();
    });
  });
});