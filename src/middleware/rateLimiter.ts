import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (not suitable for production)
const requestCounts: Record<string, { count: number, resetTime: number }> = {};

// Create a rate limiter middleware
export const createRateLimiter = (windowMs: number = 60000, max: number = 100, keyPrefix: string = 'rate-limit') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get user ID from request (set by auth middleware) or IP address
    const userId = (req.user && 'userId' in req.user) ? req.user.userId : req.ip;
    
    // Create a unique key for this user and rate limit type
    const key = `${keyPrefix}:${userId}`;
    
    const now = Date.now();
    
    // Initialize or reset if window has passed
    if (!requestCounts[key] || requestCounts[key].resetTime < now) {
      requestCounts[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      
      // Set headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.floor(requestCounts[key].resetTime / 1000));
      
      next();
      return;
    }
    
    // Increment count
    requestCounts[key].count += 1;
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requestCounts[key].count));
    res.setHeader('X-RateLimit-Reset', Math.floor(requestCounts[key].resetTime / 1000));
    
    // If over limit, return 429
    if (requestCounts[key].count > max) {
      return res.status(429).json({
        error: 'Too many requests, please try again later'
      });
    }
    
    next();
  };
};

// API rate limiter - 100 requests per minute
export const apiRateLimiter = createRateLimiter(60000, 100, 'rate-limit:api');

// Vote rate limiter - 5 requests per second
export const voteRateLimiter = createRateLimiter(1000, 5, 'rate-limit:votes');

export default {
  createRateLimiter,
  apiRateLimiter,
  voteRateLimiter
};