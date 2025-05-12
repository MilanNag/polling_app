import request from 'supertest';
import app from '../../app';
import db from '../../src/config/db';
import redis from '../../src/config/redis';

describe('API Integration Tests', () => {
  let authToken: string;
  let pollId: string;

  // Setup before all tests
  beforeAll(async () => {
    // Test DB connection
    await db.testConnection();
    
    // Test Redis connection
    await redis.testConnection();
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test data
    if (pollId) {
      await db.query('DELETE FROM votes WHERE poll_id = $1', [pollId]);
      await db.query('DELETE FROM polls WHERE id = $1', [pollId]);
    }
    
    // Close connections
    await db.pool.end();
    await redis.client.quit();
    await redis.sub.quit();
    await redis.pub.quit();
  });

  describe('Authentication', () => {
    it('should create an anonymous user and return a token', async () => {
      const response = await request(app)
        .post('/auth/anon')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username');
      
      // Save token for later tests
      authToken = response.body.token;
    });
  });

  describe('Polls', () => {
    it('should create a new poll', async () => {
      expect(authToken).toBeDefined();
      
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      
      const response = await request(app)
        .post('/poll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Integration Test Poll?',
          options: ['Option 1', 'Option 2', 'Option 3'],
          expiresAt: expiresAt.toISOString()
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('question', 'Integration Test Poll?');
      expect(response.body).toHaveProperty('options');
      expect(response.body.options).toHaveLength(3);
      expect(response.body).toHaveProperty('expiresAt');
      
      // Save poll ID for later tests
      pollId = response.body.id;
    });
    
    it('should get poll details', async () => {
      expect(pollId).toBeDefined();
      
      const response = await request(app)
        .get(`/poll/${pollId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', pollId);
      expect(response.body).toHaveProperty('question', 'Integration Test Poll?');
      expect(response.body).toHaveProperty('options');
      expect(response.body.options).toHaveLength(3);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(3);
      expect(response.body).toHaveProperty('totalVotes', 0);
      expect(response.body).toHaveProperty('isActive', true);
    });
    
    it('should cast a vote successfully', async () => {
      expect(pollId).toBeDefined();
      expect(authToken).toBeDefined();
      
      const response = await request(app)
        .post(`/poll/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          optionIndex: 1
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pollId', pollId);
      expect(response.body).toHaveProperty('optionIndex', 1);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalVotes', 1);
      
      // Verify the vote was counted correctly
      expect(response.body.results[0]).toBe(0);
      expect(response.body.results[1]).toBe(1);
      expect(response.body.results[2]).toBe(0);
    });
    
    it('should be idempotent when casting the same vote again', async () => {
      expect(pollId).toBeDefined();
      expect(authToken).toBeDefined();
      
      const response = await request(app)
        .post(`/poll/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          optionIndex: 1
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalVotes', 1); // Still 1, not 2
      
      // Verify the vote was counted correctly
      expect(response.body.results[0]).toBe(0);
      expect(response.body.results[1]).toBe(1);
      expect(response.body.results[2]).toBe(0);
    });
    
    it('should update vote when changing option', async () => {
      expect(pollId).toBeDefined();
      expect(authToken).toBeDefined();
      
      const response = await request(app)
        .post(`/poll/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          optionIndex: 2
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalVotes', 1); // Still 1, not 2
      
      // Verify the vote was updated correctly
      expect(response.body.results[0]).toBe(0);
      expect(response.body.results[1]).toBe(0); // Changed from 1 to 0
      expect(response.body.results[2]).toBe(1); // Changed from 0 to 1
    });
    
    it('should reject vote with invalid option index', async () => {
      expect(pollId).toBeDefined();
      expect(authToken).toBeDefined();
      
      await request(app)
        .post(`/poll/${pollId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          optionIndex: 5 // Out of bounds
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });
    
    it('should reject vote without authentication', async () => {
      expect(pollId).toBeDefined();
      
      await request(app)
        .post(`/poll/${pollId}/vote`)
        .send({
          optionIndex: 0
        })
        .expect('Content-Type', /json/)
        .expect(401);
    });
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      // Basic check for Prometheus format
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/non-existent-route')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });
});