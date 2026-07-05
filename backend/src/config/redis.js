import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // Critical for standard background queues/worker loops
});

redis.on('connect', () => {
  console.log(`Redis Connected to ${redisHost}:${redisPort}`);
});

redis.on('error', (err) => {
  console.error(`Redis connection error: ${err.message}`);
});

export default redis;
