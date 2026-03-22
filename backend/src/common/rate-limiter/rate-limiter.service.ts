import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private localCounters: Map<string, number[]> = new Map();

  constructor(private readonly redisService: RedisService) {}

  async checkLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    if (!this.redisService.isReady()) {
      return this.checkLocalLimit(key, limit, windowMs);
    }

    const redis = this.redisService.getClient();
    const now = Date.now();
    
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      local clearBefore = now - window

      redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
      local amount = redis.call('ZCARD', key)

      if amount < limit then
          redis.call('ZADD', key, now, now)
          redis.call('PEXPIRE', key, window)
          return 1
      else
          return 0
      end
    `;

    try {
      const result = await redis.eval(script, 1, key, now, windowMs, limit);
      return result === 1;
    } catch (e) {
      this.logger.warn(`Redis eval failed, falling back to local: ${e.message}`);
      return this.checkLocalLimit(key, limit, windowMs);
    }
  }

  private checkLocalLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const clearBefore = now - windowMs;
    
    let timestamps = this.localCounters.get(key) || [];
    // Remove expired entries
    timestamps = timestamps.filter(t => t > clearBefore);

    if (timestamps.length < limit) {
      timestamps.push(now);
      this.localCounters.set(key, timestamps);
      return true;
    }
    
    this.localCounters.set(key, timestamps);
    return false;
  }

  /**
   * Helper for KIS API specifically (2 requests per second)
   */
  async waitAndExecute<T>(task: () => Promise<T>): Promise<T> {
    const KEY = 'rate-limit:kis-api';
    const LIMIT = 2;
    const WINDOW = 1000;

    while (true) {
      const allowed = await this.checkLimit(KEY, LIMIT, WINDOW);
      if (allowed) {
        return task();
      }
      // Wait a bit before retry (exponential backoff or fixed wait)
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}
