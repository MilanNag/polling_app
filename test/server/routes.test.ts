import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import { DatabaseStorage } from '../../server/storage';
import { WebSocketMessageType } from '../../server/websocket-types';

// Mock storage
vi.mock('../../server/storage', () => ({
  storage: {
    // User methods
    getUser: vi.fn(),
    getUserByUserId: vi.fn(),
    createUser: vi.fn(),
    incrementUserPollCount: vi.fn(),
    incrementUserVoteCount: vi.fn(),
    
    // Poll methods
    createPoll: vi.fn(),
    getPoll: vi.fn(),
    getPolls: vi.fn(),
    updatePollStatus: vi.fn(),
    removePoll: vi.fn(),
    
    // Option methods
    createOption: vi.fn(),
    getOptionsByPollId: vi.fn(),
    getOption: vi.fn(),
    
    // Vote methods
    createVote: vi.fn(),
    getVotesByPollId: vi.fn(),
    getVoteByUserAndPoll: vi.fn(),
    
    // Badge methods
    getUserBadges: vi.fn(),
    createBadge: vi.fn(),
    hasBadge: vi.fn(),
    updateBadgeLevel: vi.fn(),
    checkAndAwardBadges: vi.fn(),
  },
  DatabaseStorage: vi.fn(),
}));

// Mock WebSocket server
vi.mock('ws', () => ({
  WebSocketServer: vi.fn().mockImplementation(() => ({
    clients: new Set(),
    on: vi.fn(),
  })),
  WebSocket: {
    OPEN: 1
  }
}));

// Import our routes function - note: import after mocks
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';

describe('API Routes', () => {
  // Create Express mock objects
  let app: any;
  let req: any;
  let res: any;
  
  // Create a spy for testing route handlers
  const routeHandlerSpy = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock Express app
    app = {
      get: vi.fn((path, handler) => {
        routeHandlerSpy.mockImplementationOnce(handler);
      }),
      post: vi.fn((path, handler) => {
        routeHandlerSpy.mockImplementationOnce(handler);
      }),
      put: vi.fn((path, handler) => {
        routeHandlerSpy.mockImplementationOnce(handler);
      }),
      delete: vi.fn((path, handler) => {
        routeHandlerSpy.mockImplementationOnce(handler);
      }),
    };
    
    // Create mock request and response
    req = mock<Request>();
    res = mock<Response>();
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    
    // Reset the spy
    routeHandlerSpy.mockReset();
  });
  
  it('should register all routes', async () => {
    await registerRoutes(app);
    
    // Check that routes are registered
    expect(app.post).toHaveBeenCalledWith('/api/users', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/api/polls', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/api/polls/active', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/api/polls/closed', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/api/polls/:id', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/api/votes', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/api/users/:userId/badges', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/api/users/:userId/stats', expect.any(Function));
    expect(app.delete).toHaveBeenCalledWith('/api/polls/:id', expect.any(Function));
  });
  
  it('should create a user', async () => {
    await registerRoutes(app);
    
    // Set up mock storage response
    const newUser = { id: 1, userId: 'user_123', username: 'testuser' };
    (storage.createUser as any).mockResolvedValueOnce(newUser);
    
    // Set up mock request
    req.body = { username: 'testuser' };
    
    // Call the route handler
    await routeHandlerSpy(req, res);
    
    // Verify the results
    expect(storage.createUser).toHaveBeenCalledWith(expect.objectContaining({ 
      username: 'testuser',
      userId: expect.any(String)
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newUser);
  });
  
  it('should create a poll', async () => {
    await registerRoutes(app);
    
    // Set up mock storage responses
    const newPoll = { 
      id: 1, 
      question: 'Test Poll?',
      description: 'Test',
      userId: 'user_123',
      username: 'testuser',
      isActive: true
    };
    (storage.createPoll as any).mockResolvedValueOnce(newPoll);
    (storage.createOption as any).mockImplementation(async (option) => ({ 
      id: option.id || Math.floor(Math.random() * 1000),
      ...option
    }));
    (storage.incrementUserPollCount as any).mockResolvedValueOnce({ pollsCreated: 1 });
    (storage.checkAndAwardBadges as any).mockResolvedValueOnce([]);
    
    // Set up mock request
    req.body = { 
      question: 'Test Poll?',
      description: 'Test',
      userId: 'user_123',
      username: 'testuser',
      options: [
        { text: 'Option 1' },
        { text: 'Option 2' }
      ]
    };
    
    // Call the route handler
    await routeHandlerSpy(req, res);
    
    // Verify the results
    expect(storage.createPoll).toHaveBeenCalledWith(expect.objectContaining({ 
      question: 'Test Poll?',
      userId: 'user_123'
    }));
    expect(storage.createOption).toHaveBeenCalledTimes(2);
    expect(storage.incrementUserPollCount).toHaveBeenCalledWith('user_123');
    expect(storage.checkAndAwardBadges).toHaveBeenCalledWith('user_123');
    expect(res.status).toHaveBeenCalledWith(201);
  });
  
  it('should get active polls', async () => {
    await registerRoutes(app);
    
    // Set up mock storage responses
    const activePolls = [
      { id: 1, question: 'Poll 1?', isActive: true },
      { id: 2, question: 'Poll 2?', isActive: true }
    ];
    (storage.getPolls as any).mockResolvedValueOnce(activePolls);
    
    // Call the route handler
    await routeHandlerSpy(req, res);
    
    // Verify the results
    expect(storage.getPolls).toHaveBeenCalledWith(true);
    expect(res.json).toHaveBeenCalledWith(activePolls);
  });
  
  it('should get closed polls', async () => {
    await registerRoutes(app);
    
    // Set up mock storage responses
    const closedPolls = [
      { id: 3, question: 'Poll 3?', isActive: false },
      { id: 4, question: 'Poll 4?', isActive: false }
    ];
    (storage.getPolls as any).mockResolvedValueOnce(closedPolls);
    
    // Call the route handler
    await routeHandlerSpy(req, res);
    
    // Verify the results
    expect(storage.getPolls).toHaveBeenCalledWith(false);
    expect(res.json).toHaveBeenCalledWith(closedPolls);
  });
  
  it('should get a poll by ID with details', async () => {
    await registerRoutes(app);
    
    // Set up mock request
    req.params = { id: '1' };
    
    // Set up mock storage responses
    const poll = { id: 1, question: 'Poll 1?', userId: 'user_123' };
    const options = [
      { id: 1, pollId: 1, text: 'Option 1' },
      { id: 2, pollId: 1, text: 'Option 2' }
    ];
    const votes = [
      { id: 1, pollId: 1, optionId: 1, userId: 'user_456' },
      { id: 2, pollId: 1, optionId: 1, userId: 'user_789' },
      { id: 3, pollId: 1, optionId: 2, userId: 'user_123' }
    ];
    
    (storage.getPoll as any).mockResolvedValueOnce(poll);
    (storage.getOptionsByPollId as any).mockResolvedValueOnce(options);
    (storage.getVotesByPollId as any).mockResolvedValueOnce(votes);
    
    // Set up userId query param
    req.query = { userId: 'user_123' };
    
    // Call the route handler
    await routeHandlerSpy(req, res);
    
    // Verify the results
    expect(storage.getPoll).toHaveBeenCalledWith(1);
    expect(storage.getOptionsByPollId).toHaveBeenCalledWith(1);
    expect(storage.getVotesByPollId).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ...poll,
      options,
      totalVotes: 3,
      optionsWithVotes: expect.any(Array),
      userVote: expect.objectContaining({ optionId: 2 })
    }));
  });
  
  it('should handle creating a vote', async () => {
    await registerRoutes(app);
    
    // Set up mock request
    req.body = {
      pollId: 1,
      optionId: 2,
      userId: 'user_123'
    };
    
    // Set up mock storage responses
    const newVote = { 
      id: 1,
      pollId: 1,
      optionId: 2,
      userId: 'user_123',
      createdAt: new Date()
    };
    const poll = { id: 1, question: 'Poll 1?', userId: 'user_456' };
    const options = [
      { id: 1, pollId: 1, text: 'Option 1' },
      { id: 2, pollId: 1, text: 'Option 2' }
    ];
    const votes = [newVote];
    
    (storage.getVoteByUserAndPoll as any).mockResolvedValueOnce(null);
    (storage.createVote as any).mockResolvedValueOnce(newVote);
    (storage.incrementUserVoteCount as any).mockResolvedValueOnce({ votesSubmitted: 1 });
    (storage.checkAndAwardBadges as any).mockResolvedValueOnce([]);
    (storage.getPoll as any).mockResolvedValueOnce(poll);
    (storage.getOptionsByPollId as any).mockResolvedValueOnce(options);
    (storage.getVotesByPollId as any).mockResolvedValueOnce(votes);
    
    // Call the route handler
    await routeHandlerSpy(req, res);
    
    // Verify the results
    expect(storage.getVoteByUserAndPoll).toHaveBeenCalledWith('user_123', 1);
    expect(storage.createVote).toHaveBeenCalledWith(expect.objectContaining({
      pollId: 1,
      optionId: 2,
      userId: 'user_123'
    }));
    expect(storage.incrementUserVoteCount).toHaveBeenCalledWith('user_123');
    expect(storage.checkAndAwardBadges).toHaveBeenCalledWith('user_123');
    expect(res.status).toHaveBeenCalledWith(201);
  });
  
  it('should handle deleting a poll', async () => {
    await registerRoutes(app);
    
    // Set up mock request
    req.params = { id: '1' };
    
    // Set up mock storage responses
    const poll = { id: 1, question: 'Poll 1?', userId: 'user_123' };
    (storage.getPoll as any).mockResolvedValueOnce(poll);
    (storage.removePoll as any).mockResolvedValueOnce({ ...poll, isRemoved: true });
    
    // Call the route handler
    await routeHandlerSpy(req, res);
    
    // Verify the results
    expect(storage.getPoll).toHaveBeenCalledWith(1);
    expect(storage.removePoll).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.any(String),
      id: 1
    }));
  });
});