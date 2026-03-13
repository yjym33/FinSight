import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from './entities/watchlist.entity';
import { KisService } from '../stocks/kis.service';
import { Stock } from '../stocks/entities/stock.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private watchlistRepository: Repository<Watchlist>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private kisService: KisService,
  ) {}

  async findByUserId(userId: string): Promise<any[]> {
    const watchlist = await this.watchlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (watchlist.length === 0) return [];

    // Fetch stock details from stocks table for names
    const stockCodes = watchlist.map(item => item.stockCode);
    const stocks = await this.stockRepository.find({
      where: stockCodes.map(code => ({ code })),
    });

    const stockMap = new Map(stocks.map(s => [s.code, s]));

    return watchlist.map(item => ({
      ...item,
      stockName: stockMap.get(item.stockCode)?.name || item.stockCode,
    }));
  }

  async add(userId: string, stockCode: string): Promise<any> {
    const existing = await this.watchlistRepository.findOne({
      where: { userId, stockCode },
    });

    if (existing) {
      throw new ConflictException('Stock already in watchlist');
    }

    const watchlist = this.watchlistRepository.create({ userId, stockCode });
    const saved = await this.watchlistRepository.save(watchlist);
    
    // Fetch name for immediate UI update
    const stock = await this.stockRepository.findOne({ where: { code: stockCode } });
    
    return {
      ...saved,
      stockName: stock?.name || stockCode,
    };
  }

  async findByStockCode(stockCode: string): Promise<any[]> {
    const list = await this.watchlistRepository.find({
      where: { stockCode },
    });
    
    if (list.length === 0) return [];
    
    const stock = await this.stockRepository.findOne({ where: { code: stockCode } });
    const stockName = stock?.name || stockCode;
    
    return list.map(item => ({
      ...item,
      stockName,
    }));
  }

  async remove(userId: string, stockCode: string): Promise<void> {
    await this.watchlistRepository.delete({ userId, stockCode });
  }

  async isInWatchlist(userId: string, stockCode: string): Promise<boolean> {
    const item = await this.watchlistRepository.findOne({
      where: { userId, stockCode },
    });
    return !!item;
  }
}
