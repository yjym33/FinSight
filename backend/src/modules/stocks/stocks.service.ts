import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as fs from 'fs';
import { Stock } from './entities/stock.entity';
import { KisService } from './kis.service';
import { AnalysisService } from './analysis.service';

/**
 * 주식 전반 비즈니스 로직 처리 서비스 (StocksService)
 * 역할: 자체 DB의 주식 정보 조회 및 KIS API(한국투자증권) 호출 결과를 병합하여 반환합니다.
 * 주요 기능: 실시간 순위 조회, 종목 검색, 시드 데이터(Seed) 동기화
 */
@Injectable()
export class StocksService implements OnModuleInit {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private kisService: KisService,
    private analysisService: AnalysisService,
  ) {}

  async onModuleInit() {
    await this.seedInitialStocks();
  }

  async seedInitialStocks() {
    const path = '/tmp/krx_stocks_full.json';

    if (!fs.existsSync(path)) {
      this.logger.warn('Full KRX stock master list not found in /tmp/krx_stocks_full.json. Use python script to generate it.');
      return;
    }

    try {
      const data = fs.readFileSync(path, 'utf8');
      const stocks: Partial<Stock>[] = JSON.parse(data);

      this.logger.log(`Syncing ${stocks.length} stocks to database...`);
      // Batch save to improve performance
      const BATCH_SIZE = 500;
      for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
        const batch = stocks.slice(i, i + BATCH_SIZE);
        await this.stockRepository.upsert(batch, ['code']);
      }
      this.logger.log(`Successfully synced ${stocks.length} stocks.`);
    } catch (e) {
      this.logger.error(`Failed to sync stock data: ${e.message}`);
    }
  }

  async searchStocks(query: string, limit = 10) {
    if (!query) return [];

    return this.stockRepository.find({
      where: [
        { name: Like(`%${query}%`) },
        { code: Like(`${query}%`) },
      ],
      take: limit,
      order: {
        name: 'ASC',
      },
    });
  }

  async findOneByCode(code: string) {
    return this.stockRepository.findOne({ where: { code } });
  }

  async getStockPriceWithDetail(code: string) {
    const [dbStock, kisPrice] = await Promise.all([
      this.findOneByCode(code),
      this.kisService.getStockPrice(code),
    ]);

    if (!kisPrice) return null;

    return {
      ...kisPrice,
      stockName: dbStock?.name || kisPrice.stockName || code,
      market: dbStock?.market || (this.kisService.isOverseas(code) ? 'NASDAQ' : 'KRX'),
    };
  }

  async compareStocks(codes: string[], userId?: string) {
    const results = await Promise.all(
      codes.map(async (code) => {
        const details = await this.getStockPriceWithDetail(code);
        const analysis = await this.analysisService.getStockAnalysis(code, userId);
        return {
          ...details,
          analysis,
        };
      }),
    );
    return results.filter(r => r !== null);
  }

  async getRanking(market: 'J' | 'K' = 'J', type: 'volume' | 'gainers' | 'losers' = 'volume') {
    try {
      const ranking = await this.kisService.getRanking(type, market);
      if (ranking && ranking.length > 0) {
        // Asynchronously update DB with newest ranking data (actual data sync)
        this.updateStockSync(ranking).catch(err => 
          this.logger.error(`Failed to sync ranking to DB: ${err.message}`)
        );
        return ranking;
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch ${type} ranking from KIS: ${e.message}`);
    }

    // Fallback logic
    const query = this.stockRepository.createQueryBuilder('stock')
      .where('stock.market = :market', { market: market === 'J' ? '코스피' : '코스닥' });

    if (type === 'volume' || type === 'gainers' || type === 'losers') {
        if (type === 'volume') {
            query.andWhere('stock.tradingValue IS NOT NULL')
                 .orderBy('stock.tradingValue', 'DESC');
        } else if (type === 'gainers') {
            query.andWhere('stock.changePercent IS NOT NULL')
                 .orderBy('stock.changePercent', 'DESC');
        } else if (type === 'losers') {
            query.andWhere('stock.changePercent IS NOT NULL')
                 .orderBy('stock.changePercent', 'ASC');
        }
    }

    const syncedStocks = await query.take(30).getMany();

    if (syncedStocks.length >= 25) {
        this.logger.log(`Returning ${syncedStocks.length} synced stocks from local DB.`);
        return syncedStocks;
    }

    this.logger.warn(`Only ${syncedStocks.length} synced stocks found. Using Deep Fallback.`);

    // Deep Fallback: If DB is empty
    const popularCodes = market === 'J' 
      ? [
          '005930', '000660', '373220', '207940', '005380', '000270', '068270', '005490', '105560', '035420',
          '028260', '055550', '012330', '066570', '032830', '096770', '323410', '033780', '015760', '034020',
          '003550', '051910', '018260', '316140', '011200', '010130', '086280', '010950', '011170', '009150'
        ]
      : [
          '247540', '086520', '196170', '028300', '348370', '058470', '277810', '403870', '039030', '293490',
          '263750', '036930', '041510', '145020', '095660', '066970', '112040', '035900', '253450', '214150',
          '035760', '005290', '067310', '237690', '041190', '025900', '030200', '240810', '140410', '251270'
        ];

    return this.stockRepository.find({
      where: popularCodes.map(code => ({ code })),
    });
  }

  /**
   * Internal method to persist KIS ranking data for actual fallback
   */
  private async updateStockSync(rankingData: any[]) {
    const updatePromises = rankingData.map(data => {
      const updateData: any = {};
      
      // Ensure we only save valid numbers
      if (!isNaN(data.price) && data.price !== null) updateData.price = data.price;
      if (!isNaN(data.prevClose) && data.prevClose !== null) updateData.prevClose = data.prevClose;
      if (!isNaN(data.changePercent) && data.changePercent !== null) updateData.changePercent = data.changePercent;
      if (!isNaN(data.volume) && data.volume !== null) updateData.volume = data.volume;
      if (!isNaN(data.tradingValue) && data.tradingValue !== null) updateData.tradingValue = data.tradingValue;
      
      if (Object.keys(updateData).length === 0) return Promise.resolve();

      return this.stockRepository.update(data.code, {
        ...updateData,
        updatedAt: new Date(),
      }).catch(err => this.logger.error(`Stock update failed for ${data.code}: ${err.message}`));
    });

    await Promise.all(updatePromises);
  }
}
