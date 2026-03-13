import { Controller, Post, Body, Get, Query, Param, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockCommentsService } from './stock-comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly commentService: StockCommentsService) {}

  @Post('comments')
  @ApiOperation({ summary: 'Post a new anonymous comment for a stock' })
  async create(@Body() createCommentDto: CreateCommentDto, @Ip() ip: string) {
    if (!createCommentDto.ipAddress) {
      createCommentDto.ipAddress = ip;
    }
    return this.commentService.create(createCommentDto);
  }

  @Get('stocks/:stockCode/comments')
  @ApiOperation({ summary: 'Get recent comments for a stock' })
  async findAll(@Param('stockCode') stockCode: string, @Query('limit') limit?: number) {
    return this.commentService.findAllByStock(stockCode, limit);
  }
}
