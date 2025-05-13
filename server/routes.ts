import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { 
  WebSocketMessageType, 
  WebSocketClientMessage, 
  WebSocketServerMessage,
  ClientInfo
} from './websocket-types';
import { z } from "zod";
import { 
  insertUserSchema, 
  insertPollSchema, 
  insertOptionSchema, 
  insertVoteSchema,
  type PollWithOptions,
  type PollWithOptionsAndVotes
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      const userId = `user_${uuidv4().substring(0, 8)}`;
      
      const userData = { username, userId };
      const validatedData = insertUserSchema.parse(userData);
      
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).send(error.message);
      } else if (error instanceof Error) {
        // Check if error message contains "user already exists"
        if (error.message.includes("already exists")) {
          res.status(409).send("This username is already taken. Please try another one.");
        } else {
          res.status(500).send("Failed to create user");
        }
      } else {
        res.status(500).send("An unexpected error occurred");
      }
    }
  });

  // Poll routes
  app.post("/api/polls", async (req: Request, res: Response) => {
    try {
      const pollData = req.body;
      // Schema will handle date conversion
      const validatedPoll = insertPollSchema.parse(pollData);
      
      const poll = await storage.createPoll(validatedPoll);
      
      // Increment user poll count and check for badges
      await storage.incrementUserPollCount(validatedPoll.createdBy);
      
      // Create options for the poll
      const { options } = req.body;
      
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).send("Poll must have at least 2 options");
      }
      
      const createdOptions = await Promise.all(
        options.map(async (optionText: string) => {
          const optionData = { 
            pollId: poll.id, 
            text: optionText 
          };
          const validatedOption = insertOptionSchema.parse(optionData);
          return storage.createOption(validatedOption);
        })
      );
      
      res.status(201).json({ ...poll, options: createdOptions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).send(`Invalid poll data: ${error.errors[0]?.message || error.message}`);
      } else {
        res.status(500).send("Failed to create poll");
      }
    }
  });

  app.get("/api/polls/active", async (_req: Request, res: Response) => {
    try {
      const activePolls = await storage.getPolls(true);
      
      // Get options for each poll
      const pollsWithOptions = await Promise.all(
        activePolls.map(async (poll) => {
          const options = await storage.getOptionsByPollId(poll.id);
          const votes = await storage.getVotesByPollId(poll.id);
          
          const totalVotes = votes.length;
          
          // Calculate votes per option
          const optionsWithVotes = options.map(option => {
            const optionVotes = votes.filter(vote => vote.optionId === option.id).length;
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            
            return {
              ...option,
              votes: optionVotes,
              percentage
            };
          });
          
          return {
            ...poll,
            options,
            totalVotes,
            optionsWithVotes
          };
        })
      );
      
      res.json(pollsWithOptions);
    } catch (error) {
      res.status(500).send("Failed to fetch active polls");
    }
  });

  app.get("/api/polls/closed", async (_req: Request, res: Response) => {
    try {
      const closedPolls = await storage.getPolls(false);
      
      // Get options for each poll
      const pollsWithOptions = await Promise.all(
        closedPolls.map(async (poll) => {
          const options = await storage.getOptionsByPollId(poll.id);
          const votes = await storage.getVotesByPollId(poll.id);
          
          const totalVotes = votes.length;
          
          // Calculate votes per option
          const optionsWithVotes = options.map(option => {
            const optionVotes = votes.filter(vote => vote.optionId === option.id).length;
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            
            return {
              ...option,
              votes: optionVotes,
              percentage
            };
          });
          
          return {
            ...poll,
            options,
            totalVotes,
            optionsWithVotes
          };
        })
      );
      
      res.json(pollsWithOptions);
    } catch (error) {
      res.status(500).send("Failed to fetch closed polls");
    }
  });

  app.get("/api/polls/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).send("Invalid poll ID");
      }
      
      const poll = await storage.getPoll(id);
      if (!poll) {
        return res.status(404).send("Poll not found");
      }
      
      const options = await storage.getOptionsByPollId(id);
      const votes = await storage.getVotesByPollId(id);
      
      const totalVotes = votes.length;
      
      // Calculate votes per option
      const optionsWithVotes = options.map(option => {
        const optionVotes = votes.filter(vote => vote.optionId === option.id).length;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        
        return {
          ...option,
          votes: optionVotes,
          percentage
        };
      });
      
      // Get user vote if userId is provided in query
      let userVote = null;
      const { userId } = req.query;
      
      if (userId && typeof userId === 'string') {
        const vote = await storage.getVoteByUserAndPoll(userId, id);
        if (vote) {
          const votedOption = await storage.getOption(vote.optionId);
          userVote = votedOption ? { 
            optionId: votedOption.id, 
            text: votedOption.text 
          } : null;
        }
      }
      
      const pollWithDetails: PollWithOptionsAndVotes = {
        ...poll,
        options,
        totalVotes,
        optionsWithVotes,
        userVote
      };
      
      res.json(pollWithDetails);
    } catch (error) {
      res.status(500).send("Failed to fetch poll details");
    }
  });

  // Vote route
  app.post("/api/votes", async (req: Request, res: Response) => {
    try {
      const voteData = req.body;
      const validatedVote = insertVoteSchema.parse(voteData);
      
      // Check if poll exists and is active
      const poll = await storage.getPoll(validatedVote.pollId);
      if (!poll) {
        return res.status(404).send("Poll not found");
      }
      
      if (!poll.isActive) {
        return res.status(400).send("Poll is closed");
      }
      
      // Check if option exists
      const option = await storage.getOption(validatedVote.optionId);
      if (!option) {
        return res.status(404).send("Option not found");
      }
      
      // Check if user has already voted
      const existingVote = await storage.getVoteByUserAndPoll(
        validatedVote.userId, 
        validatedVote.pollId
      );
      
      if (existingVote) {
        return res.status(400).send("You have already voted in this poll");
      }
      
      const vote = await storage.createVote(validatedVote);
      
      // Increment user vote count and check for badges
      await storage.incrementUserVoteCount(validatedVote.userId);
      
      try {
        // Broadcast poll update via WebSocket
        await broadcastPollUpdate(validatedVote.pollId);
        
        // Send a specific notification for new vote
        const newVoteMessage: WebSocketServerMessage = {
          type: WebSocketMessageType.NEW_VOTE,
          pollId: validatedVote.pollId,
          data: { 
            optionId: validatedVote.optionId,
            userId: validatedVote.userId,
            timestamp: Date.now() 
          },
          timestamp: Date.now()
        };
        
        broadcastToPoll(validatedVote.pollId, newVoteMessage);
        console.log(`Broadcasted new vote for poll ${validatedVote.pollId}, option ${validatedVote.optionId}`);
      } catch (wsError) {
        console.error('Error broadcasting vote update:', wsError);
        // Continue processing - WebSocket errors shouldn't affect the API response
      }
      
      // Return the updated poll with votes
      const options = await storage.getOptionsByPollId(validatedVote.pollId);
      const votes = await storage.getVotesByPollId(validatedVote.pollId);
      
      const totalVotes = votes.length;
      
      // Calculate votes per option
      const optionsWithVotes = options.map(option => {
        const optionVotes = votes.filter(vote => vote.optionId === option.id).length;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        
        return {
          ...option,
          votes: optionVotes,
          percentage
        };
      });
      
      const votedOption = await storage.getOption(validatedVote.optionId);
      const userVote = votedOption ? { 
        optionId: votedOption.id, 
        text: votedOption.text 
      } : null;
      
      const pollWithDetails: PollWithOptionsAndVotes = {
        ...poll,
        options,
        totalVotes,
        optionsWithVotes,
        userVote
      };
      
      res.status(201).json({ vote, poll: pollWithDetails });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create vote" });
      }
    }
  });

  // Badge routes
  app.get("/api/users/:userId/badges", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).send("User ID is required");
      }
      
      // Check if user exists
      const user = await storage.getUserByUserId(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).send("Failed to fetch user badges");
    }
  });
  
  // User stats route
  app.get("/api/users/:userId/stats", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).send("User ID is required");
      }
      
      // Check if user exists
      const user = await storage.getUserByUserId(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      const badges = await storage.getUserBadges(userId);
      
      // Return user stats
      res.json({
        id: user.id,
        userId: user.userId,
        username: user.username,
        pollsCreated: user.pollsCreated,
        votesSubmitted: user.votesSubmitted,
        badges
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).send("Failed to fetch user stats");
    }
  });
  
  // Delete a poll
  app.delete("/api/polls/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).send("Invalid poll ID");
      }
      
      const poll = await storage.getPoll(id);
      
      if (!poll) {
        return res.status(404).send("Poll not found");
      }
      
      // No permission check - allow anyone to delete any poll
      const userId = req.query.userId as string;
      
      // Mark poll as removed
      const removedPoll = await storage.removePoll(id);
      
      if (!removedPoll) {
        return res.status(500).send("Failed to remove poll");
      }
      
      // Broadcast poll removal to active users viewing this poll
      const pollRemovedMessage: WebSocketServerMessage = {
        type: WebSocketMessageType.POLL_UPDATE,
        pollId: id,
        data: { 
          isRemoved: true,
          message: "This poll has been removed by its creator" 
        },
        timestamp: Date.now()
      };
      
      broadcastToPoll(id, pollRemovedMessage);
      
      res.status(200).json({ message: "Poll successfully removed", id });
    } catch (error) {
      console.error("Error removing poll:", error);
      res.status(500).send("Failed to remove poll");
    }
  });
  
  // Share poll route - used for shareable links
  app.get("/api/polls/share/:shareCode", async (req: Request, res: Response) => {
    try {
      const { shareCode } = req.params;
      
      // Find poll by share code
      const poll = await storage.getPollByShareCode(shareCode);
      if (!poll) {
        return res.status(404).send("Poll not found");
      }
      
      // Get the full poll details with options and votes (using the existing endpoint logic)
      const options = await storage.getOptionsByPollId(poll.id);
      const votes = await storage.getVotesByPollId(poll.id);
      
      // Calculate vote counts for each option
      const totalVotes = votes.length;
      const optionsWithVotes = options.map(option => {
        const optionVotes = votes.filter(vote => vote.optionId === option.id).length;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        
        return {
          ...option,
          votes: optionVotes,
          percentage
        };
      });
      
      // Get user vote if available from query string
      const { userId } = req.query;
      let userVote = null;
      
      if (userId && typeof userId === 'string') {
        const vote = await storage.getVoteByUserAndPoll(userId, poll.id);
        if (vote) {
          const votedOption = await storage.getOption(vote.optionId);
          userVote = votedOption ? { 
            optionId: votedOption.id, 
            text: votedOption.text 
          } : null;
        }
      }
      
      const pollWithDetails = {
        ...poll,
        options,
        totalVotes,
        optionsWithVotes,
        userVote
      };
      
      res.json(pollWithDetails);
    } catch (error) {
      console.error("Error fetching shared poll:", error);
      res.status(500).send("Failed to fetch shared poll");
    }
  });
  
  // Update poll preview image
  app.patch("/api/polls/:id/preview", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { previewImageUrl } = req.body;
      
      if (!previewImageUrl) {
        return res.status(400).send("Preview image URL is required");
      }
      
      // Check if poll exists
      const poll = await storage.getPoll(id);
      if (!poll) {
        return res.status(404).send("Poll not found");
      }
      
      const updatedPoll = await storage.updatePollPreviewImage(id, previewImageUrl);
      res.json(updatedPoll);
    } catch (error) {
      console.error("Error updating poll preview image:", error);
      res.status(500).send("Failed to update poll preview image");
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    clientTracking: true
  });
  
  console.log('WebSocket server initialized on path: /ws');
  
  // Map to track active users per poll
  const pollActiveUsers = new Map<number, Set<string>>();
  
  // Store client-specific information
  const clientInfo = new Map<WebSocket, ClientInfo>();
  
  // Heartbeat to ensure connections are still active
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const info = clientInfo.get(ws);
      if (!info || info.isAlive === false) {
        // Remove from active users if disconnected
        if (info && info.activePoll && info.userId) {
          removeUserFromPoll(info.activePoll, info.userId);
        }
        clientInfo.delete(ws);
        return ws.terminate();
      }
      
      info.isAlive = false;
      clientInfo.set(ws, info);
      ws.ping();
    });
  }, 30000); // Check every 30 seconds
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // Function to broadcast to all clients in a specific poll
  const broadcastToPoll = (pollId: number, message: WebSocketServerMessage) => {
    wss.clients.forEach((ws) => {
      const info = clientInfo.get(ws);
      // WebSocket.OPEN value is 1
      if (ws.readyState === 1 && info?.activePoll === pollId) {
        ws.send(JSON.stringify(message));
      }
    });
  };
  
  // Function to add a user to a poll's active users
  const addUserToPoll = (pollId: number, userId: string) => {
    if (!pollActiveUsers.has(pollId)) {
      pollActiveUsers.set(pollId, new Set<string>());
    }
    pollActiveUsers.get(pollId)?.add(userId);
    
    // Broadcast active users count
    const activeUsers = Array.from(pollActiveUsers.get(pollId) || []);
    const message: WebSocketServerMessage = {
      type: WebSocketMessageType.ACTIVE_USERS,
      pollId,
      data: { count: activeUsers.length, users: activeUsers },
      timestamp: Date.now()
    };
    
    broadcastToPoll(pollId, message);
  };
  
  // Function to remove a user from a poll's active users
  const removeUserFromPoll = (pollId: number, userId: string) => {
    if (pollActiveUsers.has(pollId)) {
      const users = pollActiveUsers.get(pollId);
      if (users) {
        users.delete(userId);
        
        // Broadcast active users count
        const activeUsers = Array.from(users);
        const message: WebSocketServerMessage = {
          type: WebSocketMessageType.ACTIVE_USERS,
          pollId,
          data: { count: activeUsers.length, users: activeUsers },
          timestamp: Date.now()
        };
        
        broadcastToPoll(pollId, message);
      }
    }
  };
  
  // Function to broadcast poll updates
  const broadcastPollUpdate = async (pollId: number) => {
    try {
      const poll = await storage.getPoll(pollId);
      if (!poll) return;
      
      const options = await storage.getOptionsByPollId(pollId);
      const votes = await storage.getVotesByPollId(pollId);
      
      const totalVotes = votes.length;
      
      // Calculate votes per option
      const optionsWithVotes = options.map(option => {
        const optionVotes = votes.filter(vote => vote.optionId === option.id).length;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        
        return {
          ...option,
          votes: optionVotes,
          percentage
        };
      });
      
      const pollWithDetails = {
        ...poll,
        options,
        totalVotes,
        optionsWithVotes
      };
      
      const message: WebSocketServerMessage = {
        type: WebSocketMessageType.POLL_UPDATE,
        pollId,
        data: pollWithDetails,
        timestamp: Date.now()
      };
      
      broadcastToPoll(pollId, message);
    } catch (error) {
      console.error('Error broadcasting poll update:', error);
    }
  };
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Initialize client info
    clientInfo.set(ws, {
      isAlive: true
    });
    
    // Send initial welcome message
    const welcomeMessage: WebSocketServerMessage = {
      type: WebSocketMessageType.ACTIVE_USERS,
      data: { 
        count: wss.clients.size,
        message: "Connected to real-time updates"
      },
      timestamp: Date.now()
    };
    
    try {
      ws.send(JSON.stringify(welcomeMessage));
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
    
    // Handle heartbeat pongs
    ws.on('pong', () => {
      const info = clientInfo.get(ws);
      if (info) {
        info.isAlive = true;
        clientInfo.set(ws, info);
      }
    });
    
    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketClientMessage;
        const info = clientInfo.get(ws);
        
        if (!info) return;
        
        console.log('WebSocket message received:', message.type);
        
        switch (message.type) {
          case WebSocketMessageType.JOIN_POLL:
            if (message.pollId && message.userId) {
              // Store active poll for this client
              info.activePoll = message.pollId;
              info.userId = message.userId;
              clientInfo.set(ws, info);
              
              console.log(`User ${message.userId} joined poll ${message.pollId}`);
              
              // Add user to poll
              addUserToPoll(message.pollId, message.userId);
              
              // Send current poll data
              await broadcastPollUpdate(message.pollId);
            }
            break;
            
          case WebSocketMessageType.LEAVE_POLL:
            if (info.activePoll && info.userId) {
              console.log(`User ${info.userId} left poll ${info.activePoll}`);
              
              removeUserFromPoll(info.activePoll, info.userId);
              info.activePoll = undefined;
              clientInfo.set(ws, info);
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        
        // Send error to client
        const errorMessage: WebSocketServerMessage = {
          type: WebSocketMessageType.ERROR,
          message: 'Error processing message',
          timestamp: Date.now()
        };
        
        try {
          ws.send(JSON.stringify(errorMessage));
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      const info = clientInfo.get(ws);
      if (info?.activePoll && info?.userId) {
        console.log(`User ${info.userId} disconnected from poll ${info.activePoll}`);
        removeUserFromPoll(info.activePoll, info.userId);
      } else {
        console.log('WebSocket client disconnected');
      }
      clientInfo.delete(ws);
    });
  });

  return httpServer;
}
