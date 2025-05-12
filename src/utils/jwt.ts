import jwt from 'jsonwebtoken';
import config from '../config/env';
import logger from './logger';

// Interface for JWT payload
export interface JwtPayload {
  userId: string;
  username: string;
}

// Generate a JWT token
export const generateToken = (payload: JwtPayload): string => {
  try {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiry,
    });
  } catch (error) {
    logger.error('Error generating JWT token', error);
    throw new Error('Failed to generate authentication token');
  }
};

// Verify a JWT token
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT token', error);
    throw new Error('Invalid or expired token');
  }
};

// Parse token without verification (for debugging)
export const parseToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error parsing JWT token', error);
    throw new Error('Failed to parse token');
  }
};

export default {
  generateToken,
  verifyToken,
  parseToken,
};