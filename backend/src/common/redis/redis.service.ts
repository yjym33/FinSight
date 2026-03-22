import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    
    this.redisClient = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        // Stop retrying so aggressively in dev if it's not there
        // This won't stop ioredis forever but slows it down
        return Math.min(times * 500, 10000); 
      }
    });

    this.redisClient.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected successfully');
    });

    this.redisClient.on('error', (err) => {
      if (this.isConnected) {
        this.logger.error(`Redis connection lost: ${err.message}`);
        this.isConnected = false;
      }
      // Silently fail connect if it's the first time and hasn't connected yet
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  getClient(): Redis {
    return this.redisClient;
  }

  isReady(): boolean {
    return this.isConnected && this.redisClient.status === 'ready';
  }
}
