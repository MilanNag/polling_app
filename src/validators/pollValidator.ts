import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Schema for creating a poll
export const createPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters long').max(500, 'Question must be less than 500 characters'),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'Poll must have at least 2 options').max(10, 'Poll cannot have more than 10 options'),
  expiresAt: z.string().refine((value) => {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date > new Date();
  }, 'Expiration date must be in the future')
});

// Middleware to validate poll creation
export const validateCreatePoll = (req: Request, res: Response, next: NextFunction) => {
  try {
    createPollSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};

// Schema for poll ID param
export const pollIdSchema = z.object({
  id: z.string().uuid('Invalid poll ID format')
});

// Middleware to validate poll ID
export const validatePollId = (req: Request, res: Response, next: NextFunction) => {
  try {
    pollIdSchema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors.map(e => e.message).join(', '), 400));
    } else {
      next(error);
    }
  }
};

export default {
  createPollSchema,
  validateCreatePoll,
  pollIdSchema,
  validatePollId
};