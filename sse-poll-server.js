/**
 * Real-time polling server with Server-Sent Events (SSE)
 * Run with: node sse-poll-server.js
 */

const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json());

// Enable CORS
app.use(cors());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// In-memory storage
const polls = {};
const votes = {};
const connections = {}; // Store SSE connections by poll ID

// Generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

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
  
  res.status(201).json({
    token,
    user: { id: userId, username }
  });
});

// Create poll
app.post('/poll', (req, res) => {
  const { question, options, expiresAt } = req.body;
  
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Invalid poll data' });
  }
  
  const pollId = generateId();
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
    expiresAt,
    isActive: true,
    createdAt: now.toISOString()
  };
  
  // Initialize votes
  votes[pollId] = {};
  
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
    }
  }, expiryTimeout);
  
  res.status(201).json({
    id: pollId,
    question,
    options,
    expiresAt
  });
});

// Get poll
app.get('/poll/:id', (req, res) => {
  const { id } = req.params;
  
  if (!polls[id]) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  // Check if poll has expired
  const now = new Date();
  const expiry = new Date(polls[id].expiresAt);
  
  if (now >= expiry && polls[id].isActive) {
    polls[id].isActive = false;
  }
  
  // Get user info from token (if provided)
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      userId = tokenData.userId;
    } catch (e) {
      // Invalid token, ignore
    }
  }
  
  // Get user's vote
  let userVote = null;
  if (userId && votes[id] && votes[id][userId] !== undefined) {
    userVote = {
      optionIndex: votes[id][userId],
      createdAt: new Date().toISOString() // We don't store vote timestamps in this simple implementation
    };
  }
  
  // Calculate results
  const pollData = calculatePollResults(id);
  
  // Add user vote
  pollData.userVote = userVote;
  
  res.json(pollData);
});

// Cast vote
app.post('/poll/:id/vote', (req, res) => {
  const { id } = req.params;
  const { optionIndex } = req.body;
  
  if (!polls[id]) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  // Check if poll is active
  if (!polls[id].isActive) {
    return res.status(400).json({ error: 'Poll is no longer active' });
  }
  
  // Check if option index is valid
  if (optionIndex < 0 || optionIndex >= polls[id].options.length) {
    return res.status(400).json({ error: 'Invalid option index' });
  }
  
  // Get user ID from token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  let userId = null;
  try {
    const token = authHeader.substring(7);
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    userId = tokenData.userId;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Initialize votes for this poll if needed
  if (!votes[id]) {
    votes[id] = {};
  }
  
  // Record vote
  votes[id][userId] = optionIndex;
  
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
});

// Server-Sent Events endpoint for real-time updates
app.get('/poll/:id/live', (req, res) => {
  const { id } = req.params;
  
  if (!polls[id]) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
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
  
  // Remove connection when client disconnects
  req.on('close', () => {
    if (connections[id]) {
      connections[id] = connections[id].filter(conn => conn !== res);
      if (connections[id].length === 0) {
        delete connections[id];
      }
    }
    clearInterval(keepAlive);
  });
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
  if (!connections[pollId]) return;
  
  connections[pollId].forEach(connection => {
    connection.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Serve the static HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/realtime-poll.html');
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
});