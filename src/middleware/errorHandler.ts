import { Request, Response, NextFunction } from 'express';

// Custom error class with status code
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default status code and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // If it's our custom AppError, use its status code and message
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Handle validation errors
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'SyntaxError') {
    // Handle JSON parsing errors
    statusCode = 400;
    message = 'Invalid JSON';
  }
  
  // Log the error
  console.error(`${statusCode} - ${message}`, {
    path: req.path,
    method: req.method,
    error: err.stack
  });
  
  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

// Not found middleware
export const notFound = (req: Request, res: Response): void => {
  console.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Resource not found' });
};

export default {
  AppError,
  errorHandler,
  notFound,
};