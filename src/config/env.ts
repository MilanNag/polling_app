import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiry: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

// Export configuration with default values
export const config: EnvironmentConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/team_polls',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  jwtExpiry: process.env.JWT_EXPIRY || '1h',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const requiredEnvVars: Array<keyof EnvironmentConfig> = [
    'databaseUrl',
    'redisUrl',
    'jwtSecret',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar.toUpperCase()]) {
      throw new Error(`Environment variable ${envVar.toUpperCase()} is required in production mode`);
    }
  }
}

export default config;