import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage for polls (replace with database in production)
const polls: Record<string, any> = {};
const votes: Record<string, Record<string, number>> = {};

// Middleware to parse JWT token (simplified version)
const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authentication format' });
  }
  
  const token = parts[1];
  
  try {
    // In a real implementation, you'd verify the JWT here
    // For now, just simulate a user
    req.user = {
      userId: 'test-user-id',
      username: 'test-user'
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * @route POST /poll
 * @desc Create a new poll
 * @access Authenticated
 */
router.post('/', authenticate, (req: Request, res: Response) => {
  try {
    const { question, options, expiresAt } = req.body;
    
    // Validate input
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid poll data. Question and at least 2 options required' 
      });
    }
    
    const pollId = uuidv4();
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (expiry <= now) {
      return res.status(400).json({ error: 'Expiration date must be in the future' });
    }
    
    // Create poll
    polls[pollId] = {
      id: pollId,
      question,
      options,
      expiresAt: expiry,
      createdAt: now,
      isActive: true,
      createdBy: req.user?.userId
    };
    
    // Initialize vote counters
    votes[pollId] = {};
    
    return res.status(201).json({
      id: pollId,
      question,
      options,
      expiresAt
    });
  } catch (error) {
    console.error('Error creating poll', error);
    return res.status(500).json({ error: 'Failed to create poll' });
  }
});

/**
 * @route GET /poll/:id
 * @desc Get poll details and current results
 * @access Public
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const poll = polls[id];
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if expired
    const now = new Date();
    if (new Date(poll.expiresAt) <= now) {
      poll.isActive = false;
    }
    
    // Calculate results
    const results = new Array(poll.options.length).fill(0);
    let totalVotes = 0;
    
    const pollVotes = votes[id] || {};
    Object.values(pollVotes).forEach((optionIndex: number) => {
      results[optionIndex]++;
      totalVotes++;
    });
    
    // Check if user has voted
    let userVote = null;
    const userId = req.user?.userId;
    if (userId && pollVotes[userId] !== undefined) {
      userVote = {
        optionIndex: pollVotes[userId],
        createdAt: new Date()
      };
    }
    
    return res.status(200).json({
      id: poll.id,
      question: poll.question,
      options: poll.options,
      results,
      totalVotes,
      isActive: poll.isActive,
      expiresAt: poll.expiresAt,
      userVote
    });
  } catch (error) {
    console.error(`Error getting poll ${req.params.id}`, error);
    return res.status(500).json({ error: 'Failed to get poll' });
  }
});

/**
 * @route POST /poll/:id/vote
 * @desc Cast a vote in a poll
 * @access Authenticated
 */
router.post('/:id/vote', authenticate, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const poll = polls[id];
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if poll is active
    const now = new Date();
    if (new Date(poll.expiresAt) <= now || !poll.isActive) {
      return res.status(400).json({ error: 'Poll is no longer active' });
    }
    
    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }
    
    // Initialize poll votes if not exists
    if (!votes[id]) {
      votes[id] = {};
    }
    
    // Record vote (overwrite if user already voted)
    votes[id][userId] = optionIndex;
    
    // Calculate results
    const results = new Array(poll.options.length).fill(0);
    let totalVotes = 0;
    
    Object.values(votes[id]).forEach((vote: number) => {
      results[vote]++;
      totalVotes++;
    });
    
    return res.status(200).json({
      success: true,
      pollId: id,
      optionIndex,
      results,
      totalVotes
    });
  } catch (error) {
    console.error(`Error casting vote for poll ${req.params.id}`, error);
    return res.status(500).json({ error: 'Failed to cast vote' });
  }
});

export default router;