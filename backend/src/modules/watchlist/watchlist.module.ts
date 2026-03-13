import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { Watchlist } from './entities/watchlist.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Watchlist, Stock]),
    StocksModule,
  ],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
