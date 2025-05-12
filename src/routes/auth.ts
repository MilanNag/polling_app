import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = Router();

// Secret key for JWT (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

/**
 * @route POST /auth/anon
 * @desc Create anonymous user and get JWT
 * @access Public
 */
router.post('/anon', (req: Request, res: Response) => {
  try {
    // Create an anonymous user with a random UUID
    const userId = uuidv4();
    const username = `anon-${userId.split('-')[0]}`;
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Return token and user info
    return res.status(201).json({
      token,
      user: {
        id: userId,
        username
      }
    });
  } catch (error) {
    console.error('Error creating anonymous user', error);
    return res.status(500).json({ error: 'Failed to create anonymous user' });
  }
});

export default router;