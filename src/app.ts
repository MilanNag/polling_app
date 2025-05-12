import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';

// Import routes
import authRoutes from './routes/auth';
import pollRoutes from './routes/polls';
import metricsRoutes from './routes/metrics';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import trackMetrics from './middleware/metrics';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || '*' 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Simple logger middleware
app.use((req: Request, res: Response, next: Function) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Parse JSON body
app.use(bodyParser.json());

// Track metrics
app.use(trackMetrics);

// Apply rate limiting
app.use(apiRateLimiter);

// Test route for debugging
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Test endpoint is working!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply routes
app.use('/auth', authRoutes);
app.use('/poll', pollRoutes);
app.use('/metrics', metricsRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;