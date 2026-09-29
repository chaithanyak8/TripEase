import redisClient from '../db/redis.js';

export const rateLimiter = async (req, res, next) => {
  // If Redis is not connected, fail open (do not block traffic)
  if (!redisClient.isOpen) {
    return next();
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const key = `ratelimit:${ip}`;
  const limit = 100; // Maximum 100 requests
  const windowSeconds = 60; // In a 60-second window

  try {
    const current = await redisClient.get(key);

    if (current === null) {
      // First request in the current window: initialize atomically
      await redisClient.multi()
        .set(key, 1)
        .expire(key, windowSeconds)
        .exec();
      return next();
    }

    const count = parseInt(current, 10);
    if (count >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Increment count for this IP
    await redisClient.incr(key);
    next();
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // Fail open in case of Redis connection drops during runtime
    next();
  }
};
