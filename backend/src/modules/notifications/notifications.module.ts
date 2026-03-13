import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { AlertService } from './alert.service';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { UsersModule } from '../users/users.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    forwardRef(() => WatchlistModule),
    forwardRef(() => UsersModule),
    forwardRef(() => WebsocketModule),
    StocksModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, AlertService],
  exports: [NotificationsService, AlertService],
})
export class NotificationsModule {}
