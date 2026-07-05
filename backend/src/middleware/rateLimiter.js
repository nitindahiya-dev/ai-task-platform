import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: process.env.NODE_ENV === 'development' ? 10000 : 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many requests.',
  },
});

export default limiter;