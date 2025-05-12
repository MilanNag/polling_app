/**
 * Super minimal Express server - no dependencies except Express and cors
 * Run with: node super-minimal-server.js
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
  const userId = Math.random().toString(36).substring(2, 15);
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
  
  const pollId = Math.random().toString(36).substring(2, 15);
  
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
  
  // This is just a dummy implementation
  res.json({
    id,
    question: 'Sample question?',
    options: ['Option A', 'Option B', 'Option C'],
    results: [3, 5, 2],
    totalVotes: 10,
    isActive: true
  });
});

// Cast vote
app.post('/poll/:id/vote', (req, res) => {
  const { id } = req.params;
  const { optionIndex } = req.body;
  
  // This is just a dummy implementation
  res.json({
    success: true,
    pollId: id,
    optionIndex,
    results: [3, 6, 2],
    totalVotes: 11
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Super minimal server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /test');
  console.log('- GET /health');
  console.log('- POST /auth/anon');
  console.log('- POST /poll');
  console.log('- GET /poll/:id');
  console.log('- POST /poll/:id/vote');
});