import { Module, forwardRef } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

import { StocksModule } from '../stocks/stocks.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => StocksModule),
    forwardRef(() => NotificationsModule),
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
