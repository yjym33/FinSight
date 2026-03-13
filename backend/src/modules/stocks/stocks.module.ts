import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KisService } from './kis.service';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { NewsModule } from '../news/news.module';
import { ChatModule } from '../chat/chat.module';
import { AnalysisService } from './analysis.service';
import { Stock } from './entities/stock.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Stock]),
    forwardRef(() => NewsModule),
    forwardRef(() => ChatModule),
    UsersModule,
  ],
  controllers: [StocksController],
  providers: [KisService, AnalysisService, StocksService],
  exports: [KisService, AnalysisService, StocksService, TypeOrmModule],
})
export class StocksModule {}
