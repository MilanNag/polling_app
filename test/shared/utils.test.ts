import { describe, it, expect } from 'vitest';
import { cn, generateRandomUsername, getUserInitials } from '../../client/src/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
      expect(cn('foo', false && 'bar')).toBe('foo');
      expect(cn('foo', true && 'bar')).toBe('foo bar');
    });

    it('should merge conditional class names', () => {
      const condition = true;
      expect(cn('foo', condition ? 'bar' : 'baz')).toBe('foo bar');
    });

    it('should merge with tailwind-merge', () => {
      expect(cn('px-2 py-1', 'py-2')).toBe('px-2 py-2');
      expect(cn('text-red-500 text-lg', 'text-blue-500')).toBe('text-lg text-blue-500');
    });
  });

  describe('generateRandomUsername', () => {
    it('should generate a random username with adjective and animal', () => {
      const username = generateRandomUsername();
      // Should match the pattern of "AdjectiveAnimal" (e.g., "HappyElephant")
      expect(username).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+$/);
    });

    it('should generate unique usernames', () => {
      const username1 = generateRandomUsername();
      const username2 = generateRandomUsername();
      const username3 = generateRandomUsername();
      
      // With random generators, there's a very small chance these might be equal
      // but the test should pass almost always
      const uniqueUsernames = new Set([username1, username2, username3]);
      expect(uniqueUsernames.size).toBeGreaterThan(1);
    });
  });

  describe('getUserInitials', () => {
    it('should return the first 2 characters of a username', () => {
      expect(getUserInitials('TestUser')).toBe('TU');
      expect(getUserInitials('John')).toBe('JO');
    });

    it('should handle short usernames correctly', () => {
      expect(getUserInitials('A')).toBe('A');
    });

    it('should handle uppercase correctly', () => {
      expect(getUserInitials('testuser')).toBe('TE');
      expect(getUserInitials('TESTUSER')).toBe('TE');
    });

    it('should handle camelCase usernames with multiple capitals', () => {
      expect(getUserInitials('JohnDoe')).toBe('JD');
      expect(getUserInitials('TomSawyer')).toBe('TS');
    });

    it('should handle spaced usernames correctly', () => {
      expect(getUserInitials('John Doe')).toBe('JD');
      expect(getUserInitials('Jane Smith')).toBe('JS');
      expect(getUserInitials('Tom Jerry Mouse')).toBe('TJ');
    });

    it('should return empty string for empty or undefined input', () => {
      expect(getUserInitials('')).toBe('');
      expect(getUserInitials(undefined as unknown as string)).toBe('');
    });
  });
});