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
import { databaseConfig } from './config/database.config';

/**
 * 최상위 루트 모듈 (AppModule)
 * 역할: 애플리케이션에 필요한 모든 모듈(환경설정, 데이터베이스, 스케줄러 기능 및 비즈니스 로직 모듈)들을 
 * 하나로 모아서 NestJS 백엔드를 조립하는 역할을 합니다.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
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
  ],
})
export class AppModule {}
