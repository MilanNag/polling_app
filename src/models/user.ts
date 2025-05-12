import { v4 as uuidv4 } from 'uuid';
import db from '../config/db';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// User interface
export interface User {
  id: string;
  username: string;
  created_at: Date;
  updated_at: Date;
}

// User model class
class UserModel {
  // Create a new user
  async create(username: string): Promise<User> {
    try {
      const result = await db.query<User>(
        'INSERT INTO users (username) VALUES ($1) RETURNING *',
        [username]
      );
      
      return result[0];
    } catch (error) {
      logger.error('Error creating user', error);
      
      // Handle unique constraint violation
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new AppError('Username already exists', 409);
      }
      
      throw new AppError('Failed to create user', 500);
    }
  }
  
  // Get user by ID
  async getById(id: string): Promise<User> {
    try {
      const result = await db.query<User>(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.length === 0) {
        throw new AppError('User not found', 404);
      }
      
      return result[0];
    } catch (error) {
      logger.error(`Error getting user ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get user', 500);
    }
  }
  
  // Get user by username
  async getByUsername(username: string): Promise<User> {
    try {
      const result = await db.query<User>(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.length === 0) {
        throw new AppError('User not found', 404);
      }
      
      return result[0];
    } catch (error) {
      logger.error(`Error getting user with username ${username}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get user', 500);
    }
  }
  
  // Create anonymous user
  async createAnonymous(): Promise<User> {
    try {
      // Generate a random username with uuid
      const anonUsername = `anon-${uuidv4()}`;
      return await this.create(anonUsername);
    } catch (error) {
      logger.error('Error creating anonymous user', error);
      throw new AppError('Failed to create anonymous user', 500);
    }
  }
}

export default new UserModel();