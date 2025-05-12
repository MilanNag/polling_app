import db from '../config/db';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Poll interface
export interface Poll {
  id: string;
  question: string;
  options: string[];
  created_at: Date;
  expires_at: Date;
  is_active: boolean;
  created_by?: string;
}

// Poll creation input interface
export interface CreatePollInput {
  question: string;
  options: string[];
  expiresAt: Date;
  createdBy?: string;
}

// Poll result interface
export interface PollResult {
  pollId: string;
  question: string;
  options: string[];
  results: number[];
  totalVotes: number;
  expiresAt: Date;
  isActive: boolean;
}

// Poll model class
class PollModel {
  // Create a new poll
  async create(data: CreatePollInput): Promise<Poll> {
    try {
      const { question, options, expiresAt, createdBy } = data;
      
      // Validate input
      if (!question || options.length < 2) {
        throw new AppError('Poll must have a question and at least 2 options', 400);
      }
      
      if (new Date(expiresAt) <= new Date()) {
        throw new AppError('Poll expiration date must be in the future', 400);
      }
      
      const result = await db.query<Poll>(
        `INSERT INTO polls (question, options, expires_at, created_by) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [question, JSON.stringify(options), expiresAt, createdBy]
      );
      
      return result[0];
    } catch (error) {
      logger.error('Error creating poll', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create poll', 500);
    }
  }
  
  // Get poll by ID
  async getById(id: string): Promise<Poll> {
    try {
      const result = await db.query<Poll>(
        'SELECT * FROM polls WHERE id = $1',
        [id]
      );
      
      if (result.length === 0) {
        throw new AppError('Poll not found', 404);
      }
      
      return result[0];
    } catch (error) {
      logger.error(`Error getting poll ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get poll', 500);
    }
  }
  
  // Get poll results
  async getResults(id: string): Promise<PollResult> {
    try {
      // Get the poll
      const poll = await this.getById(id);
      
      // Count votes for each option
      const voteCounts = await db.query<{ option_index: number; count: string }>(
        `SELECT option_index, COUNT(*) as count 
         FROM votes 
         WHERE poll_id = $1 
         GROUP BY option_index`,
        [id]
      );
      
      // Initialize results array with zeros
      const results = Array(poll.options.length).fill(0);
      
      // Fill in actual vote counts
      voteCounts.forEach(count => {
        results[count.option_index] = parseInt(count.count, 10);
      });
      
      // Calculate total votes
      const totalVotes = results.reduce((sum, count) => sum + count, 0);
      
      return {
        pollId: poll.id,
        question: poll.question,
        options: poll.options,
        results,
        totalVotes,
        expiresAt: poll.expires_at,
        isActive: poll.is_active
      };
    } catch (error) {
      logger.error(`Error getting poll results ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get poll results', 500);
    }
  }
  
  // Close a poll (mark as inactive)
  async close(id: string): Promise<Poll> {
    try {
      const result = await db.query<Poll>(
        'UPDATE polls SET is_active = FALSE WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.length === 0) {
        throw new AppError('Poll not found', 404);
      }
      
      return result[0];
    } catch (error) {
      logger.error(`Error closing poll ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to close poll', 500);
    }
  }
  
  // Check if a poll is expired
  async isExpired(id: string): Promise<boolean> {
    try {
      const poll = await this.getById(id);
      return new Date(poll.expires_at) <= new Date() || !poll.is_active;
    } catch (error) {
      logger.error(`Error checking if poll ${id} is expired`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to check poll expiration', 500);
    }
  }
}

export default new PollModel();