import voteModel, { Vote, CreateVoteInput } from '../models/vote';
import pollService from './pollService';
import socketService from './socketService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

class VoteService {
  // Cast a vote
  async castVote(data: CreateVoteInput): Promise<Vote> {
    try {
      // Check if poll exists and is active
      const poll = await pollService.getPoll(data.pollId);
      
      if (!poll.is_active) {
        throw new AppError('Poll is no longer active', 400);
      }
      
      if (new Date(poll.expires_at) <= new Date()) {
        // Poll has expired, mark it as inactive
        await pollService.closePoll(data.pollId);
        throw new AppError('Poll has expired', 400);
      }
      
      // Validate option index
      if (data.optionIndex < 0 || data.optionIndex >= poll.options.length) {
        throw new AppError(`Invalid option index. Must be between 0 and ${poll.options.length - 1}`, 400);
      }
      
      // Cast the vote
      const vote = await voteModel.castVote(data);
      
      // Get updated poll results
      const updatedResults = await pollService.getPollResults(data.pollId);
      
      // Broadcast update via WebSockets
      socketService.broadcastVoteUpdate(data.pollId, {
        type: 'vote',
        optionIndex: data.optionIndex,
        results: updatedResults.results,
        totalVotes: updatedResults.totalVotes
      });
      
      return vote;
    } catch (error) {
      logger.error('Error casting vote', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cast vote', 500);
    }
  }
  
  // Get user's vote for a poll
  async getUserVote(userId: string, pollId: string): Promise<Vote | null> {
    try {
      return await voteModel.getByUserAndPollId(userId, pollId);
    } catch (error) {
      logger.error(`Error getting user vote for poll ${pollId}`, error);
      throw new AppError('Failed to get user vote', 500);
    }
  }
  
  // Get all votes for a poll
  async getPollVotes(pollId: string): Promise<Vote[]> {
    try {
      return await voteModel.getByPollId(pollId);
    } catch (error) {
      logger.error(`Error getting votes for poll ${pollId}`, error);
      throw new AppError('Failed to get poll votes', 500);
    }
  }
}

export default new VoteService();