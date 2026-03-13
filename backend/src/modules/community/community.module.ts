import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockComment } from './entities/stock-comment.entity';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityComment } from './entities/community-comment.entity';
import { StockCommentsService } from './stock-comments.service';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { WebsocketModule } from '../websocket/websocket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockComment, CommunityPost, CommunityComment]),
    WebsocketModule,
    NotificationsModule,
  ],
  controllers: [CommunityController],
  providers: [StockCommentsService, CommunityService],
  exports: [StockCommentsService, CommunityService],
})
export class CommunityModule {}
