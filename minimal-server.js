/**
 * Minimal Express Server without any complex dependencies
 * Run with: node minimal-server.js
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

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
  const userId = uuidv4();
  const username = `anon-${userId.split('-')[0]}`;
  
  // In a real app, we'd use a proper JWT library
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
  
  const pollId = uuidv4();
  
  polls[pollId] = {
    id: pollId,
    question,
    options,
    expiresAt,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  votes[pollId] = {};
  
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
  
  // Calculate results
  const results = new Array(polls[id].options.length).fill(0);
  let totalVotes = 0;
  
  Object.values(votes[id] || {}).forEach(optionIndex => {
    results[optionIndex]++;
    totalVotes++;
  });
  
  res.json({
    ...polls[id],
    results,
    totalVotes
  });
});

// Cast vote
app.post('/poll/:id/vote', (req, res) => {
  const { id } = req.params;
  const { optionIndex } = req.body;
  
  if (!polls[id]) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  if (optionIndex < 0 || optionIndex >= polls[id].options.length) {
    return res.status(400).json({ error: 'Invalid option index' });
  }
  
  // Generate a dummy userId since we're not validating auth
  const userId = req.headers.authorization 
    ? req.headers.authorization.split(' ')[1] 
    : `anonymous-${Date.now()}`;
  
  if (!votes[id]) {
    votes[id] = {};
  }
  
  votes[id][userId] = optionIndex;
  
  // Calculate results
  const results = new Array(polls[id].options.length).fill(0);
  let totalVotes = 0;
  
  Object.values(votes[id]).forEach(optionIdx => {
    results[optionIdx]++;
    totalVotes++;
  });
  
  res.json({
    success: true,
    pollId: id,
    optionIndex,
    results,
    totalVotes
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Minimal server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /test');
  console.log('- GET /health');
  console.log('- POST /auth/anon');
  console.log('- POST /poll');
  console.log('- GET /poll/:id');
  console.log('- POST /poll/:id/vote');
});