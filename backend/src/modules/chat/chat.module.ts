import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLMService } from './llm.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { NewsModule } from '../news/news.module';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    HttpModule,
    forwardRef(() => NewsModule),
    forwardRef(() => StocksModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => WebsocketModule),
  ],
  controllers: [ChatController],
  providers: [ChatService, LLMService],
  exports: [ChatService, LLMService],
})
export class ChatModule {}
