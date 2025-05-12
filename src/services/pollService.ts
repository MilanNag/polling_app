import pollModel, { Poll, CreatePollInput, PollResult } from '../models/poll';
import redis from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

class PollService {
  // Create a new poll
  async createPoll(data: CreatePollInput): Promise<Poll> {
    try {
      // Create poll in the database
      const poll = await pollModel.create(data);
      
      // Cache poll in Redis for faster retrieval
      await this.cachePoll(poll);
      
      return poll;
    } catch (error) {
      logger.error('Error creating poll', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create poll', 500);
    }
  }
  
  // Get poll by ID (with cache)
  async getPoll(id: string): Promise<Poll> {
    try {
      // Try to get poll from cache
      const cachedPoll = await redis.get(`poll:${id}`);
      
      if (cachedPoll) {
        return JSON.parse(cachedPoll);
      }
      
      // If not cached, get from database
      const poll = await pollModel.getById(id);
      
      // Cache the poll
      await this.cachePoll(poll);
      
      return poll;
    } catch (error) {
      logger.error(`Error getting poll ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get poll', 500);
    }
  }
  
  // Get poll results (with cache)
  async getPollResults(id: string): Promise<PollResult> {
    try {
      // Try to get results from cache
      const cachedResults = await redis.get(`poll:${id}:results`);
      
      if (cachedResults) {
        return JSON.parse(cachedResults);
      }
      
      // If not cached, get from database
      const results = await pollModel.getResults(id);
      
      // Cache the results (expires after 5 seconds to ensure fresh data)
      await redis.set(`poll:${id}:results`, JSON.stringify(results), 5);
      
      return results;
    } catch (error) {
      logger.error(`Error getting poll results ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get poll results', 500);
    }
  }
  
  // Close a poll
  async closePoll(id: string): Promise<Poll> {
    try {
      const poll = await pollModel.close(id);
      
      // Update cache
      await this.cachePoll(poll);
      
      // Clear results cache
      await redis.del(`poll:${id}:results`);
      
      return poll;
    } catch (error) {
      logger.error(`Error closing poll ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to close poll', 500);
    }
  }
  
  // Check if a poll has expired and close it if needed
  async checkAndCloseExpiredPoll(id: string): Promise<boolean> {
    try {
      const poll = await this.getPoll(id);
      
      if (poll.is_active && new Date(poll.expires_at) <= new Date()) {
        await this.closePoll(id);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error checking and closing poll ${id}`, error);
      return false;
    }
  }
  
  // Cache a poll in Redis
  private async cachePoll(poll: Poll): Promise<void> {
    try {
      // Cache for 5 minutes (adjust as needed)
      await redis.set(`poll:${poll.id}`, JSON.stringify(poll), 300);
      
      // Schedule expiration check if poll is active
      if (poll.is_active) {
        const ttlMs = new Date(poll.expires_at).getTime() - Date.now();
        
        if (ttlMs > 0) {
          // Schedule poll expiration (using setTimeout in memory)
          setTimeout(async () => {
            await this.checkAndCloseExpiredPoll(poll.id);
          }, ttlMs);
        } else {
          // Poll already expired, close it
          await this.closePoll(poll.id);
        }
      }
    } catch (error) {
      logger.error(`Error caching poll ${poll.id}`, error);
    }
  }
}

export default new PollService();