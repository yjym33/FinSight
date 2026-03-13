import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsApiService } from './news-api.service';
import { NewsScheduler } from './news.scheduler';
import { News } from './entities/news.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([News]),
    HttpModule,
    forwardRef(() => WebsocketModule),
  ],
  controllers: [NewsController],
  providers: [NewsService, NewsApiService, NewsScheduler],
  exports: [NewsService, NewsApiService],
})
export class NewsModule {}
