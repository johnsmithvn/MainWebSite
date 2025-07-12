// 📁 backend/middleware/rateLimiter.js
// 🚦 Rate Limiting Middleware

const { SECURITY } = require("../constants");

/**
 * 🚦 Simple rate limiter
 */
class RateLimiter {
  constructor(windowMs = SECURITY.RATE_LIMIT.WINDOW_MS, maxRequests = SECURITY.RATE_LIMIT.MAX_REQUESTS) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  /**
   * 🧹 Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests) {
      if (now - data.windowStart > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * 🚦 Middleware function
   */
  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      // Clean expired entries periodically
      if (Math.random() < 0.1) {
        this.cleanup();
      }
      
      let requestData = this.requests.get(key);
      
      if (!requestData || now - requestData.windowStart > this.windowMs) {
        // New window
        requestData = {
          count: 1,
          windowStart: now
        };
        this.requests.set(key, requestData);
        return next();
      }
      
      if (requestData.count >= this.maxRequests) {
        const remainingTime = this.windowMs - (now - requestData.windowStart);
        
        res.set({
          'X-RateLimit-Limit': this.maxRequests,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': new Date(now + remainingTime).toISOString()
        });
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(remainingTime / 1000)} seconds.`
        });
      }
      
      requestData.count++;
      
      res.set({
        'X-RateLimit-Limit': this.maxRequests,
        'X-RateLimit-Remaining': this.maxRequests - requestData.count,
        'X-RateLimit-Reset': new Date(requestData.windowStart + this.windowMs).toISOString()
      });
      
      next();
    };
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter.middleware();
