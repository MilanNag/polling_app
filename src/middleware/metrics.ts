import { Request, Response, NextFunction } from 'express';

// A simple request counter
const requestCounts: Record<string, number> = {};

// Middleware to track request metrics
export const trackMetrics = (req: Request, res: Response, next: NextFunction): void => {
  // Skip metrics endpoint to avoid infinite loops
  if (req.path === '/metrics') {
    return next();
  }
  
  // Start the timer
  const start = Date.now();
  
  // Record the path - normalize dynamic segments
  const path = req.route ? req.route.path.replace(/\/:(\w+)/g, '/:param') : req.path;
  const method = req.method;
  
  // Increment request counter
  const key = `${method}:${path}`;
  requestCounts[key] = (requestCounts[key] || 0) + 1;
  
  // The following function runs when the response is sent to the client
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    
    // Log request for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`${req.method} ${path} ${res.statusCode} - ${duration.toFixed(3)}s`);
    }
  });
  
  next();
};

export default trackMetrics;