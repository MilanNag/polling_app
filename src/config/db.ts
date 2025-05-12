import { Pool } from 'pg';
import config from './env';
import logger from '../utils/logger';

// Create a connection pool
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    logger.info('Successfully connected to PostgreSQL');
    client.release();
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL', error);
    throw error;
  }
};

// Execute a database query
const query = async <T>(text: string, params?: any[]): Promise<T[]> => {
  const start = Date.now();
  try {
    const { rows } = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query in ${duration}ms: ${text}`);
    return rows;
  } catch (error) {
    logger.error(`Error executing query: ${text}`, error);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release;
  
  // Override release method to log duration
  client.release = () => {
    client.release = originalRelease;
    return client.release();
  };
  
  return client;
};

export default {
  query,
  getClient,
  testConnection,
  pool
};