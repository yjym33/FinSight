import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockComment } from './entities/stock-comment.entity';
import { StockCommentsService } from './stock-comments.service';
import { CommunityController } from './community.controller';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockComment]),
    WebsocketModule,
  ],
  controllers: [CommunityController],
  providers: [StockCommentsService],
  exports: [StockCommentsService],
})
export class CommunityModule {}
