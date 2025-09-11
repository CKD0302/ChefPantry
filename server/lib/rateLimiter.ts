import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private requestCounts = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.requestCounts.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }

  createRateLimit(scope: string, windowMs: number, maxRequests: number, keyExtractor?: (req: any) => string) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Use custom key extractor or fallback to IP address
      const baseKey = keyExtractor ? keyExtractor(req) : (req.ip || req.connection.remoteAddress || 'unknown');
      const key = `${scope}:${baseKey}`;
      const now = Date.now();
      
      const entry = this.requestCounts.get(key);
      
      if (!entry || now > entry.resetTime) {
        // New window or expired entry
        this.requestCounts.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        
        // Add rate limit headers for transparency
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': (maxRequests - 1).toString(),
          'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });
        
        return next();
      }
      
      if (entry.count >= maxRequests) {
        // Rate limit exceeded
        const resetTimeISO = new Date(entry.resetTime).toISOString();
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTimeISO,
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
        });
        
        return res.status(429).json({
          error: 'Too many requests, please try again later',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
      }
      
      // Increment count
      entry.count++;
      
      // Update headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - entry.count).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
      });
      
      next();
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requestCounts.clear();
  }
}

// Create singleton instance
const rateLimiter = new InMemoryRateLimiter();

// Pre-configured rate limiters for different endpoint types
export const authRateLimit = rateLimiter.createRateLimit(
  'auth',
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per 15 minutes (generous for legitimate users)
  (req: any) => req.user?.id || req.ip || 'unknown' // Use user ID when available
);

export const profileRateLimit = rateLimiter.createRateLimit(
  'profile',
  5 * 60 * 1000, // 5 minutes  
  30, // 30 requests per 5 minutes (very generous for profile operations)
  (req: any) => req.user?.id || req.ip || 'unknown' // Use user ID when available
);

export const contactRateLimit = rateLimiter.createRateLimit(
  'contact',
  60 * 60 * 1000, // 1 hour
  5 // 5 contact messages per hour (prevents spam)
);

export const generalRateLimit = rateLimiter.createRateLimit(
  'general',
  1 * 60 * 1000, // 1 minute
  100 // 100 requests per minute (very generous for general API usage)
);

export default rateLimiter;