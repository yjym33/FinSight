import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Watchlist')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get watchlist for current user' })
  async getWatchlist(@CurrentUser() user: User) {
    return this.watchlistService.findByUserId(user.id);
  }

  @Post(':stockCode')
  @ApiOperation({ summary: 'Add stock to watchlist' })
  async addStock(@CurrentUser() user: User, @Param('stockCode') stockCode: string) {
    return this.watchlistService.add(user.id, stockCode);
  }

  @Delete(':stockCode')
  @ApiOperation({ summary: 'Remove stock from watchlist' })
  async removeStock(@CurrentUser() user: User, @Param('stockCode') stockCode: string) {
    return this.watchlistService.remove(user.id, stockCode);
  }

  @Get(':stockCode/check')
  @ApiOperation({ summary: 'Check if stock is in watchlist' })
  async checkStock(@CurrentUser() user: User, @Param('stockCode') stockCode: string) {
    const isInWatchlist = await this.watchlistService.isInWatchlist(user.id, stockCode);
    return { isInWatchlist };
  }
}
