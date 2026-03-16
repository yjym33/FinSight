import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NewsService } from './news.service';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all news' })
  @ApiQuery({ name: 'q', required: false, type: String })
  async findAll(
    @Query('limit') limit?: number, 
    @Query('category') category?: string,
    @Query('q') query?: string
  ) {
    if (query) {
      return this.newsService.findByKeyword(query);
    }
    return this.newsService.findAll(category, limit || 50);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get news by ID' })
  async findOne(@Param('id') id: string) {
    return this.newsService.findById(id);
  }

  @Get('stock/:stockCode')
  @ApiOperation({ summary: 'Get news by stock code' })
  @ApiQuery({ name: 'stockName', required: false, type: String })
  async findByStock(
    @Param('stockCode') stockCode: string,
    @Query('stockName') stockName?: string
  ) {
    return this.newsService.findByStockCode(stockCode, stockName);
  }
}
