// redis.js

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('✅ Redis Connected');
});

redis.on('ready', () => {
  console.log('🚀 Redis Ready');
});

redis.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
});

export default redis;