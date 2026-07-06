import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  max: process.env.NODE_ENV === 'development' ? 10000 : 1000,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

export default limiter;