import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import redis from './config/redis.js';
import limiter from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

// Load environment variables
dotenv.config();

console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('ENV PATH:', process.cwd());
// Connect to Database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body Parser with 10mb limit for large text inputs
app.use(express.json({ limit: '10mb' }));

// Apply rate limiting to all requests
app.use(limiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoints for Kubernetes Probes
// Liveness probe (checks if the container is running/alive)
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe (checks if the container is ready to accept traffic, e.g. Mongo/Redis connected)
app.get('/readyz', async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isRedisConnected = redis.status === 'ready';

  if (isMongoConnected && isRedisConnected) {
    res.status(200).json({
      status: 'ready',
      mongodb: 'connected',
      redis: 'connected',
    });
  } else {
    res.status(503).json({
      status: 'unready',
      mongodb: isMongoConnected ? 'connected' : 'disconnected',
      redis: isRedisConnected ? 'connected' : 'disconnected',
    });
  }
});

// Global Error Handler (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('Mongo connection closed');
      redis.disconnect();
      console.log('Redis connection closed');
      process.exit(0);
    });
  });
});

export default app;
