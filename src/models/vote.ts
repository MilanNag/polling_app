import db from '../config/db';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import pollModel from './poll';

// Vote interface
export interface Vote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: Date;
}

// Vote creation input interface
export interface CreateVoteInput {
  pollId: string;
  userId: string;
  optionIndex: number;
}

// Vote model class
class VoteModel {
  // Cast a vote
  async castVote(data: CreateVoteInput): Promise<Vote> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const { pollId, userId, optionIndex } = data;
      
      // Check if poll exists and is active
      const poll = await pollModel.getById(pollId);
      
      if (!poll.is_active) {
        throw new AppError('Poll is no longer active', 400);
      }
      
      if (new Date(poll.expires_at) <= new Date()) {
        throw new AppError('Poll has expired', 400);
      }
      
      // Check if option index is valid
      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        throw new AppError('Invalid option index', 400);
      }
      
      // Check if user has already voted (for idempotency)
      const existingVote = await client.query<Vote>(
        'SELECT * FROM votes WHERE poll_id = $1 AND user_id = $2',
        [pollId, userId]
      );
      
      let vote;
      
      if (existingVote.rows.length > 0) {
        // Update existing vote if option is different
        if (existingVote.rows[0].option_index !== optionIndex) {
          vote = await client.query<Vote>(
            `UPDATE votes 
             SET option_index = $1 
             WHERE poll_id = $2 AND user_id = $3 
             RETURNING *`,
            [optionIndex, pollId, userId]
          );
        } else {
          // No change needed, return existing vote
          await client.query('COMMIT');
          return existingVote.rows[0];
        }
      } else {
        // Create new vote
        vote = await client.query<Vote>(
          `INSERT INTO votes (poll_id, user_id, option_index) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [pollId, userId, optionIndex]
        );
      }
      
      await client.query('COMMIT');
      return vote.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error casting vote', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cast vote', 500);
    } finally {
      client.release();
    }
  }
  
  // Get votes by poll ID
  async getByPollId(pollId: string): Promise<Vote[]> {
    try {
      return await db.query<Vote>(
        'SELECT * FROM votes WHERE poll_id = $1',
        [pollId]
      );
    } catch (error) {
      logger.error(`Error getting votes for poll ${pollId}`, error);
      throw new AppError('Failed to get votes', 500);
    }
  }
  
  // Get vote by user ID and poll ID
  async getByUserAndPollId(userId: string, pollId: string): Promise<Vote | null> {
    try {
      const result = await db.query<Vote>(
        'SELECT * FROM votes WHERE user_id = $1 AND poll_id = $2',
        [userId, pollId]
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`Error getting vote for user ${userId} and poll ${pollId}`, error);
      throw new AppError('Failed to get vote', 500);
    }
  }
  
  // Count votes by poll ID and option index
  async countByPollAndOption(pollId: string, optionIndex: number): Promise<number> {
    try {
      const result = await db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM votes WHERE poll_id = $1 AND option_index = $2',
        [pollId, optionIndex]
      );
      
      return parseInt(result[0].count, 10);
    } catch (error) {
      logger.error(`Error counting votes for poll ${pollId} and option ${optionIndex}`, error);
      throw new AppError('Failed to count votes', 500);
    }
  }
}

export default new VoteModel();