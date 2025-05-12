import pollService from '../../src/services/pollService';
import pollModel from '../../src/models/poll';
import redis from '../../src/config/redis';
import { AppError } from '../../src/middleware/errorHandler';

// Mock dependencies
jest.mock('../../src/models/poll');
jest.mock('../../src/config/redis');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('Poll Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPoll', () => {
    it('should create a poll and cache it', async () => {
      // Setup mock data
      const poll = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        created_at: new Date(),
        expires_at: new Date(Date.now() + 3600000), // 1 hour from now
        is_active: true,
      };

      // Setup mocks
      (pollModel.create as jest.Mock).mockResolvedValue(poll);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Call the function
      const result = await pollService.createPoll({
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        expiresAt: new Date(Date.now() + 3600000),
      });

      // Assertions
      expect(pollModel.create).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith(
        `poll:${poll.id}`,
        JSON.stringify(poll),
        300
      );
      expect(result).toEqual(poll);
    });

    it('should handle errors and rethrow them', async () => {
      // Setup mock to throw error
      const error = new AppError('Poll creation failed', 500);
      (pollModel.create as jest.Mock).mockRejectedValue(error);

      // Call the function and expect it to throw
      await expect(pollService.createPoll({
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        expiresAt: new Date(Date.now() + 3600000),
      })).rejects.toThrow('Poll creation failed');
    });
  });

  describe('getPoll', () => {
    it('should get poll from cache if available', async () => {
      // Setup mock data
      const poll = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        created_at: new Date(),
        expires_at: new Date(Date.now() + 3600000),
        is_active: true,
      };

      // Setup mocks
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(poll));

      // Call the function
      const result = await pollService.getPoll(poll.id);

      // Assertions
      expect(redis.get).toHaveBeenCalledTimes(1);
      expect(redis.get).toHaveBeenCalledWith(`poll:${poll.id}`);
      expect(pollModel.getById).not.toHaveBeenCalled();
      expect(result).toEqual(poll);
    });

    it('should get poll from database if not in cache', async () => {
      // Setup mock data
      const poll = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        created_at: new Date(),
        expires_at: new Date(Date.now() + 3600000),
        is_active: true,
      };

      // Setup mocks
      (redis.get as jest.Mock).mockResolvedValue(null);
      (pollModel.getById as jest.Mock).mockResolvedValue(poll);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Call the function
      const result = await pollService.getPoll(poll.id);

      // Assertions
      expect(redis.get).toHaveBeenCalledTimes(1);
      expect(redis.get).toHaveBeenCalledWith(`poll:${poll.id}`);
      expect(pollModel.getById).toHaveBeenCalledTimes(1);
      expect(pollModel.getById).toHaveBeenCalledWith(poll.id);
      expect(redis.set).toHaveBeenCalledTimes(1);
      expect(result).toEqual(poll);
    });

    it('should handle errors from database', async () => {
      // Setup mock error
      const error = new AppError('Poll not found', 404);
      (redis.get as jest.Mock).mockResolvedValue(null);
      (pollModel.getById as jest.Mock).mockRejectedValue(error);

      // Call the function and expect it to throw
      await expect(pollService.getPoll('non-existent-id')).rejects.toThrow('Poll not found');
    });
  });

  describe('getPollResults', () => {
    it('should get results from cache if available', async () => {
      // Setup mock data
      const results = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        results: [5, 10],
        totalVotes: 15,
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true,
      };

      // Setup mocks
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(results));

      // Call the function
      const result = await pollService.getPollResults(results.pollId);

      // Assertions
      expect(redis.get).toHaveBeenCalledTimes(1);
      expect(redis.get).toHaveBeenCalledWith(`poll:${results.pollId}:results`);
      expect(pollModel.getResults).not.toHaveBeenCalled();
      expect(result).toEqual(results);
    });

    it('should get results from database if not in cache', async () => {
      // Setup mock data
      const results = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        results: [5, 10],
        totalVotes: 15,
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true,
      };

      // Setup mocks
      (redis.get as jest.Mock).mockResolvedValue(null);
      (pollModel.getResults as jest.Mock).mockResolvedValue(results);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Call the function
      const result = await pollService.getPollResults(results.pollId);

      // Assertions
      expect(redis.get).toHaveBeenCalledTimes(1);
      expect(redis.get).toHaveBeenCalledWith(`poll:${results.pollId}:results`);
      expect(pollModel.getResults).toHaveBeenCalledTimes(1);
      expect(pollModel.getResults).toHaveBeenCalledWith(results.pollId);
      expect(redis.set).toHaveBeenCalledTimes(1);
      expect(result).toEqual(results);
    });
  });

  describe('checkAndCloseExpiredPoll', () => {
    it('should close an expired poll', async () => {
      // Setup mock data
      const poll = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        created_at: new Date(Date.now() - 3600000),
        expires_at: new Date(Date.now() - 1000), // Already expired
        is_active: true,
      };

      const closedPoll = { ...poll, is_active: false };

      // Setup mocks
      (pollService.getPoll as jest.Mock) = jest.fn().mockResolvedValue(poll);
      (pollService.closePoll as jest.Mock) = jest.fn().mockResolvedValue(closedPoll);

      // Call the function
      const result = await pollService.checkAndCloseExpiredPoll(poll.id);

      // Assertions
      expect(pollService.getPoll).toHaveBeenCalledTimes(1);
      expect(pollService.getPoll).toHaveBeenCalledWith(poll.id);
      expect(pollService.closePoll).toHaveBeenCalledTimes(1);
      expect(pollService.closePoll).toHaveBeenCalledWith(poll.id);
      expect(result).toBe(true);
    });

    it('should not close an active, non-expired poll', async () => {
      // Setup mock data
      const poll = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Test question?',
        options: ['Option 1', 'Option 2'],
        created_at: new Date(),
        expires_at: new Date(Date.now() + 3600000), // Not expired
        is_active: true,
      };

      // Setup mocks
      (pollService.getPoll as jest.Mock) = jest.fn().mockResolvedValue(poll);
      (pollService.closePoll as jest.Mock) = jest.fn();

      // Call the function
      const result = await pollService.checkAndCloseExpiredPoll(poll.id);

      // Assertions
      expect(pollService.getPoll).toHaveBeenCalledTimes(1);
      expect(pollService.getPoll).toHaveBeenCalledWith(poll.id);
      expect(pollService.closePoll).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});