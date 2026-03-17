import { Controller, Get, Post, Delete, Param, UseGuards, Body, Patch } from '@nestjs/common';
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

  @Get(':stockCode/check')
  @ApiOperation({ summary: 'Check if stock is in watchlist' })
  async checkStock(@CurrentUser() user: User, @Param('stockCode') stockCode: string) {
    const isInWatchlist = await this.watchlistService.isInWatchlist(user.id, stockCode);
    return { isInWatchlist };
  }

  // Group Management
  @Post('groups')
  @ApiOperation({ summary: 'Create a new watchlist group' })
  async createGroup(@CurrentUser() user: User, @Body('name') name: string) {
    return this.watchlistService.createGroup(user.id, name);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete a watchlist group' })
  async deleteGroup(@CurrentUser() user: User, @Param('id') id: string) {
    return this.watchlistService.deleteGroup(user.id, id);
  }

  @Patch('groups/:id')
  @ApiOperation({ summary: 'Rename a watchlist group' })
  async renameGroup(@CurrentUser() user: User, @Param('id') id: string, @Body('name') name: string) {
    return this.watchlistService.renameGroup(user.id, id, name);
  }

  @Patch('move')
  @ApiOperation({ summary: 'Move stock to another group' })
  async moveStock(
    @CurrentUser() user: User,
    @Body('stockCode') stockCode: string,
    @Body('groupId') groupId: string | null,
  ) {
    return this.watchlistService.moveStockToGroup(user.id, stockCode, groupId);
  }

  // Stock Parameter Routes (Should be at the end)
  @Post(':stockCode')
  @ApiOperation({ summary: 'Add stock to watchlist' })
  async addStock(
    @CurrentUser() user: User, 
    @Param('stockCode') stockCode: string,
    @Body('groupId') groupId?: string
  ) {
    return this.watchlistService.add(user.id, stockCode, groupId);
  }

  @Delete(':stockCode')
  @ApiOperation({ summary: 'Remove stock from watchlist' })
  async removeStock(@CurrentUser() user: User, @Param('stockCode') stockCode: string) {
    return this.watchlistService.remove(user.id, stockCode);
  }
}
