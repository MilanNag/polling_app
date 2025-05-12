/**
 * Real-time polling server with Server-Sent Events (SSE) - with debugging
 * Run with: node sse-poll-server-debug.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json());

// Enable CORS with more permissive settings
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  // Log request body for debugging but not for GET requests (to avoid clutter)
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  
  // Log headers for debugging
  console.log('Request headers:', req.headers);
  
  next();
});

// In-memory storage
const polls = {};
const votes = {};
const connections = {}; // Store SSE connections by poll ID

// Generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Load HTML file 
const htmlFilePath = path.join(__dirname, 'realtime-poll-updated.html');
const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Real-time Polls</title>
</head>
<body>
  <h1>Real-time Polls</h1>
  <p>HTML file not found. Please place realtime-poll-updated.html in the same directory as this script.</p>
</body>
</html>
`;

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint is working!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Anonymous auth endpoint
app.post('/auth/anon', (req, res) => {
  const userId = generateId();
  const username = `anon-${userId.slice(0, 8)}`;
  
  // Simple token (not secure, just for testing)
  const token = Buffer.from(JSON.stringify({ userId, username })).toString('base64');
  
  console.log(`Created anonymous user: ${username} with token: ${token}`);
  
  res.status(201).json({
    token,
    user: { id: userId, username }
  });
});

// Create poll
app.post('/poll', (req, res) => {
  try {
    const { question, options, expiresAt } = req.body;
    
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Invalid poll data. Question and at least 2 options required' });
    }
    
    const pollId = generateId();
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (expiry <= now) {
      return res.status(400).json({ error: 'Expiration date must be in the future' });
    }
    
    // Extract user info from token
    let createdBy = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        createdBy = tokenData.userId;
      } catch (e) {
        console.error('Error extracting user from token:', e);
      }
    }
    
    // Create poll
    polls[pollId] = {
      id: pollId,
      question,
      options,
      expiresAt,
      isActive: true,
      createdAt: now.toISOString(),
      createdBy
    };
    
    // Initialize votes
    votes[pollId] = {};
    
    console.log(`Created poll: ${pollId} with ${options.length} options`);
    
    // Set timeout to close poll when it expires
    const expiryTimeout = expiry - now;
    setTimeout(() => {
      if (polls[pollId]) {
        polls[pollId].isActive = false;
        
        // Notify all clients that the poll has closed
        notifyPollSubscribers(pollId, {
          type: 'poll_closed',
          poll: calculatePollResults(pollId)
        });
        
        console.log(`Poll ${pollId} automatically closed due to expiration`);
      }
    }, expiryTimeout);
    
    res.status(201).json({
      id: pollId,
      question,
      options,
      expiresAt
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Internal server error creating poll' });
  }
});

// Get poll
app.get('/poll/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!polls[id]) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if poll has expired
    const now = new Date();
    const expiry = new Date(polls[id].expiresAt);
    
    if (now >= expiry && polls[id].isActive) {
      polls[id].isActive = false;
      console.log(`Poll ${id} marked as inactive during GET request (expired)`);
    }
    
    // Get user info from token (if provided)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        userId = tokenData.userId;
        console.log(`User ${userId} is viewing poll ${id}`);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
    
    // Get user's vote
    let userVote = null;
    if (userId && votes[id] && votes[id][userId] !== undefined) {
      userVote = {
        optionIndex: votes[id][userId],
        createdAt: new Date().toISOString() // We don't store vote timestamps in this simple implementation
      };
      console.log(`Found existing vote for user ${userId} on poll ${id}: option ${userVote.optionIndex}`);
    }
    
    // Calculate results
    const pollData = calculatePollResults(id);
    
    // Add user vote
    pollData.userVote = userVote;
    
    res.json(pollData);
  } catch (error) {
    console.error(`Error getting poll ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error getting poll' });
  }
});

// Cast vote
app.post('/poll/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    
    console.log(`Attempting to cast vote for poll ${id}, option ${optionIndex}`);
    
    if (!polls[id]) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if poll is active
    if (!polls[id].isActive) {
      return res.status(400).json({ error: 'Poll is no longer active' });
    }
    
    // Check if option index is valid
    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({ error: 'Option index is required' });
    }
    
    if (optionIndex < 0 || optionIndex >= polls[id].options.length) {
      return res.status(400).json({ error: `Invalid option index. Must be between 0 and ${polls[id].options.length - 1}` });
    }
    
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let userId = null;
    try {
      const token = authHeader.substring(7);
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      userId = tokenData.userId;
      console.log(`User ${userId} is casting a vote on poll ${id}`);
    } catch (e) {
      console.error('Error parsing token:', e);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Initialize votes for this poll if needed
    if (!votes[id]) {
      votes[id] = {};
    }
    
    // Check if user already voted
    const previousVote = votes[id][userId];
    const isNewVote = previousVote === undefined;
    
    // Record vote
    votes[id][userId] = optionIndex;
    
    console.log(`Vote recorded for user ${userId} on poll ${id}: option ${optionIndex}`);
    if (!isNewVote) {
      console.log(`This was a change from previous vote: option ${previousVote}`);
    }
    
    // Calculate updated results
    const pollData = calculatePollResults(id);
    
    // Notify all subscribers about the vote
    notifyPollSubscribers(id, {
      type: 'vote',
      pollId: id,
      results: pollData.results,
      totalVotes: pollData.totalVotes
    });
    
    res.json({
      success: true,
      pollId: id,
      optionIndex,
      results: pollData.results,
      totalVotes: pollData.totalVotes
    });
  } catch (error) {
    console.error(`Error casting vote for poll ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error casting vote' });
  }
});

// Get active polls (simulated)
app.get('/polls/active', (req, res) => {
  try {
    // Find all active polls
    const now = new Date();
    const activePolls = Object.values(polls)
      .filter(poll => poll.isActive && new Date(poll.expiresAt) > now)
      .map(poll => {
        const pollResults = calculatePollResults(poll.id);
        return {
          id: poll.id,
          question: poll.question,
          options: poll.options,
          totalVotes: pollResults.totalVotes,
          expiresAt: poll.expiresAt
        };
      });
    
    console.log(`Found ${activePolls.length} active polls`);
    res.json(activePolls);
  } catch (error) {
    console.error('Error getting active polls:', error);
    res.status(500).json({ error: 'Internal server error getting active polls' });
  }
});

// Server-Sent Events endpoint for real-time updates
app.get('/poll/:id/live', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!polls[id]) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    console.log(`Setting up SSE connection for poll ${id}`);
    
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send initial data
    const pollData = calculatePollResults(id);
    res.write(`data: ${JSON.stringify({
      type: 'initial',
      poll: pollData
    })}\n\n`);
    
    // Keep connection alive with a comment every 30 seconds
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000);
    
    // Add this client to the connections for this poll
    if (!connections[id]) {
      connections[id] = [];
    }
    connections[id].push(res);
    
    console.log(`Current SSE connections for poll ${id}: ${connections[id].length}`);
    
    // Remove connection when client disconnects
    req.on('close', () => {
      if (connections[id]) {
        connections[id] = connections[id].filter(conn => conn !== res);
        console.log(`SSE connection closed for poll ${id}. Remaining connections: ${connections[id].length}`);
        if (connections[id].length === 0) {
          delete connections[id];
          console.log(`No more connections for poll ${id}`);
        }
      }
      clearInterval(keepAlive);
    });
  } catch (error) {
    console.error(`Error setting up SSE for poll ${req.params.id}:`, error);
    res.status(500).end();
  }
});

// Helper function to calculate poll results
function calculatePollResults(pollId) {
  const poll = polls[pollId];
  if (!poll) return null;
  
  // Initialize results array
  const results = new Array(poll.options.length).fill(0);
  
  // Count votes
  let totalVotes = 0;
  const pollVotes = votes[pollId] || {};
  Object.values(pollVotes).forEach(optionIndex => {
    results[optionIndex]++;
    totalVotes++;
  });
  
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options,
    results,
    totalVotes,
    isActive: poll.isActive,
    expiresAt: poll.expiresAt
  };
}

// Helper function to notify all subscribers to a poll
function notifyPollSubscribers(pollId, data) {
  if (!connections[pollId] || connections[pollId].length === 0) {
    console.log(`No subscribers to notify for poll ${pollId}`);
    return;
  }
  
  console.log(`Notifying ${connections[pollId].length} subscribers for poll ${pollId} with event type: ${data.type}`);
  
  connections[pollId].forEach(connection => {
    connection.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Serve the HTML file
app.get('/', (req, res) => {
  try {
    if (fs.existsSync(htmlFilePath)) {
      res.sendFile(htmlFilePath);
    } else {
      console.warn(`HTML file not found at ${htmlFilePath}, serving fallback HTML`);
      res.send(fallbackHtml);
    }
  } catch (error) {
    console.error('Error serving HTML file:', error);
    res.send(fallbackHtml);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Real-time poll server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET / (Real-time poll frontend)');
  console.log('- GET /test');
  console.log('- GET /health');
  console.log('- POST /auth/anon');
  console.log('- POST /poll');
  console.log('- GET /poll/:id');
  console.log('- POST /poll/:id/vote');
  console.log('- GET /poll/:id/live (SSE endpoint for real-time updates)');
  console.log('- GET /polls/active (List active polls)');
});