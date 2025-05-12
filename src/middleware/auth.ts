import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication token is required' });
      return;
    }

    // Check if token format is Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authentication format' });
      return;
    }

    const token = parts[1];
    
    // Verify the token
    const decoded = verifyToken(token);
    
    // Set the user on the request object
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authenticate;