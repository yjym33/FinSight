import { Controller, Post, Body, Get, Query, Param, Ip, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockCommentsService } from './stock-comments.service';
import { CommunityService } from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(
    private readonly stockCommentService: StockCommentsService,
    private readonly communityService: CommunityService,
  ) {}

  // --- Anonymous Stock Talk ---
  @Post('stock-comments')
  @ApiOperation({ summary: 'Post a new anonymous comment for a stock' })
  async createStockComment(@Body() createCommentDto: CreateCommentDto, @Ip() ip: string) {
    if (!createCommentDto.ipAddress) {
      createCommentDto.ipAddress = ip;
    }
    return this.stockCommentService.create(createCommentDto);
  }

  @Get('stocks/:stockCode/comments')
  @ApiOperation({ summary: 'Get recent anonymous comments for a stock' })
  async findStockComments(@Param('stockCode') stockCode: string, @Query('limit') limit?: number) {
    return this.stockCommentService.findAllByStock(stockCode, limit);
  }

  // --- Account-based Community Posts ---
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new community post' })
  async createPost(@Body() createPostDto: CreatePostDto, @Request() req: any) {
    return this.communityService.createPost(createPostDto, req.user.id);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get community posts' })
  async findAll(@Query('stockCode') stockCode?: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.communityService.findAllPosts(stockCode, limit, offset);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get a single post with comments' })
  async findOne(@Param('id') id: string) {
    return this.communityService.findOnePost(id);
  }

  @Post('comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  async createComment(@Body() createCommentDto: CreateCommunityCommentDto, @Request() req: any) {
    return this.communityService.createComment(createCommentDto, req.user.id);
  }
}
