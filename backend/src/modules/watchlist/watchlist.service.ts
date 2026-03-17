import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from './entities/watchlist.entity';
import { WatchlistGroup } from './entities/watchlist-group.entity';
import { KisService } from '../stocks/kis.service';
import { Stock } from '../stocks/entities/stock.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private watchlistRepository: Repository<Watchlist>,
    @InjectRepository(WatchlistGroup)
    private groupRepository: Repository<WatchlistGroup>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private kisService: KisService,
  ) {}

  async findByUserId(userId: string): Promise<any> {
    const groups = await this.groupRepository.find({
      where: { userId },
      order: { order: 'ASC', createdAt: 'ASC' },
      relations: ['items'],
    });

    const watchlist = await this.watchlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (watchlist.length === 0 && groups.length === 0) return { groups: [], unassigned: [] };

    // Fetch stock details
    const stockCodes = [...new Set(watchlist.map(item => item.stockCode))];
    const stocks = await this.stockRepository.find({
      where: stockCodes.map(code => ({ code })),
    });

    const stockMap = new Map(stocks.map(s => [s.code, s]));
    
    const formatItem = (item: Watchlist) => ({
      ...item,
      stockName: stockMap.get(item.stockCode)?.name || item.stockCode,
    });

    const groupedData = groups.map(group => ({
      id: group.id,
      name: group.name,
      items: (group.items || []).map(formatItem),
    }));

    const unassigned = watchlist
      .filter(item => !item.groupId)
      .map(formatItem);

    return {
      groups: groupedData,
      unassigned,
    };
  }

  async add(userId: string, stockCode: string, groupId?: string): Promise<any> {
    const existing = await this.watchlistRepository.findOne({
      where: { userId, stockCode },
    });

    if (existing) {
      // If already exists but in different group, maybe update?
      // For now, just throw
      throw new ConflictException('Stock already in watchlist');
    }

    const watchlist = this.watchlistRepository.create({ userId, stockCode, groupId });
    const saved = await this.watchlistRepository.save(watchlist);
    
    // Fetch name for immediate UI update
    const stock = await this.stockRepository.findOne({ where: { code: stockCode } });
    
    return {
      ...saved,
      stockName: stock?.name || stockCode,
    };
  }

  // Group Methods
  async createGroup(userId: string, name: string): Promise<WatchlistGroup> {
    const group = this.groupRepository.create({ userId, name });
    return this.groupRepository.save(group);
  }

  async deleteGroup(userId: string, groupId: string): Promise<void> {
    await this.groupRepository.delete({ userId, id: groupId });
  }

  async renameGroup(userId: string, groupId: string, name: string): Promise<WatchlistGroup> {
    const group = await this.groupRepository.findOne({ where: { userId, id: groupId } });
    if (!group) throw new Error('Group not found');
    group.name = name;
    return this.groupRepository.save(group);
  }

  async moveStockToGroup(userId: string, stockCode: string, groupId: string | null): Promise<void> {
    const item = await this.watchlistRepository.findOne({ where: { userId, stockCode } });
    if (!item) throw new Error('Stock not in watchlist');
    item.groupId = groupId;
    await this.watchlistRepository.save(item);
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
