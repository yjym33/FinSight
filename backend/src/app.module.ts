import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NewsModule } from './modules/news/news.module';
import { ChatModule } from './modules/chat/chat.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { StocksModule } from './modules/stocks/stocks.module';
import { CommunityModule } from './modules/community/community.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RedisModule } from './common/redis/redis.module';
import { RateLimiterModule } from './common/rate-limiter/rate-limiter.module';
import { databaseConfig } from './config/database.config';

import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    NewsModule,
    ChatModule,
    WatchlistModule,
    WebsocketModule,
    StocksModule,
    CommunityModule,
    NotificationsModule,
    RedisModule,
    RateLimiterModule,
  ],
})
export class AppModule {}
