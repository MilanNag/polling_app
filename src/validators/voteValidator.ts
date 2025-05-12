import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Schema for casting a vote
export const castVoteSchema = z.object({
  optionIndex: z.number().int('Option index must be an integer').min(0, 'Option index must be non-negative')
});

// Middleware to validate vote casting
export const validateCastVote = (req: Request, res: Response, next: NextFunction) => {
  try {
    castVoteSchema.parse(req.body);
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
  castVoteSchema,
  validateCastVote
};