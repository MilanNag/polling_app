import Redis from 'ioredis';
import config from './env';
import logger from '../utils/logger';

// Create Redis client
const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  autoResubscribe: true,
});

// Create a separate Redis client for subscriptions
const redisSub = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  autoResubscribe: true,
});

// Create a separate Redis client for publishing
const redisPub = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Handle connection events
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', err);
});

// Test the connection
const testConnection = async (): Promise<void> => {
  try {
    await redisClient.ping();
    logger.info('Successfully connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
    throw error;
  }
};

// Publish a message to a channel
const publish = async (channel: string, message: string): Promise<number> => {
  try {
    return await redisPub.publish(channel, message);
  } catch (error) {
    logger.error(`Error publishing to channel ${channel}`, error);
    throw error;
  }
};

// Subscribe to a channel
const subscribe = async (channel: string, callback: (message: string) => void): Promise<void> => {
  try {
    await redisSub.subscribe(channel);
    redisSub.on('message', (chan, message) => {
      if (chan === channel) {
        callback(message);
      }
    });
  } catch (error) {
    logger.error(`Error subscribing to channel ${channel}`, error);
    throw error;
  }
};

// Set a key with optional expiry
const set = async (key: string, value: string, expiry?: number): Promise<'OK'> => {
  try {
    if (expiry) {
      return await redisClient.set(key, value, 'EX', expiry);
    }
    return await redisClient.set(key, value);
  } catch (error) {
    logger.error(`Error setting key ${key}`, error);
    throw error;
  }
};

// Get a value by key
const get = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error(`Error getting key ${key}`, error);
    throw error;
  }
};

// Delete a key
const del = async (key: string): Promise<number> => {
  try {
    return await redisClient.del(key);
  } catch (error) {
    logger.error(`Error deleting key ${key}`, error);
    throw error;
  }
};

// Increment a key
const incr = async (key: string): Promise<number> => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    logger.error(`Error incrementing key ${key}`, error);
    throw error;
  }
};

// Set a key with expiry if it doesn't exist
const setNX = async (key: string, value: string, expiry: number): Promise<number> => {
  try {
    return await redisClient.setnx(key, value).then((result) => {
      if (result === 1) {
        redisClient.expire(key, expiry);
      }
      return result;
    });
  } catch (error) {
    logger.error(`Error setting key ${key} with NX option`, error);
    throw error;
  }
};

export default {
  client: redisClient,
  sub: redisSub,
  pub: redisPub,
  testConnection,
  publish,
  subscribe,
  set,
  get,
  del,
  incr,
  setNX,
};