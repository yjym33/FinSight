import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KisService } from './kis.service';
import { AnalysisService } from './analysis.service';
import { StocksService } from './stocks.service';

@ApiTags('Stocks')
@Controller('stocks')
export class StocksController {
  constructor(
    private readonly kisService: KisService,
    private readonly analysisService: AnalysisService,
    private readonly stocksService: StocksService,
  ) {}

  @Get('market-indices')
  @ApiOperation({ summary: 'Get main market indices (KOSPI, KOSDAQ)' })
  async getMarketIndices() {
    const [kospi, kosdaq] = await Promise.all([
      this.kisService.getMarketIndex('0001'),
      this.kisService.getMarketIndex('1001'),
    ]);
    return { kospi, kosdaq };
  }

  @Get('themes')
  @ApiOperation({ summary: 'Get real-time market theme clustering' })
  async getThemes() {
    return this.analysisService.getThemeClustering();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stocks by name or code' })
  async search(@Query('q') query: string) {
    return this.stocksService.searchStocks(query);
  }

  @Get(':stockCode/chart')
  @ApiOperation({ summary: 'Get stock chart data' })
  async getChart(
    @Param('stockCode') stockCode: string,
    @Query('period') period: '1D' | '1W' | '1M' | '1Y' = '1D',
  ) {
    return this.kisService.getChartData(stockCode, period);
  }

  @Get(':stockCode/price')
  @ApiOperation({ summary: 'Get current stock price' })
  async getPrice(@Param('stockCode') stockCode: string) {
    return this.stocksService.getStockPriceWithDetail(stockCode);
  }

  @Get(':stockCode/investors')
  @ApiOperation({ summary: 'Get investor trading trend (retail, foreigner, institution)' })
  async getInvestors(@Param('stockCode') stockCode: string) {
    return this.kisService.getInvestorTrend(stockCode);
  }

  @Get(':stockCode/analysis')
  @ApiOperation({ summary: 'Get AI stock analysis' })
  async getAnalysis(@Param('stockCode') stockCode: string, @Request() req: any) {
    // If user is logged in (optional check), pass user ID for personalized analysis style
    const userId = req.user?.id;
    return this.analysisService.getStockAnalysis(stockCode, userId);
  }
  @Get('ranking/volume')
  @ApiOperation({ summary: 'Get transaction volume/price ranking' })
  async getRanking(
    @Query('market') market: 'J' | 'K' = 'J',
    @Query('type') type: 'volume' | 'gainers' | 'losers' = 'volume',
  ) {
    return this.stocksService.getRanking(market, type);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare multiple stocks' })
  async compare(@Query('codes') codes: string, @Request() req: any) {
    const stockCodes = codes.split(',');
    const userId = req.user?.id;
    return this.stocksService.compareStocks(stockCodes, userId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync stocks from KRX JSON file' })
  async sync() {
    await this.stocksService.seedInitialStocks();
    return { message: 'Sync started' };
  }
}
