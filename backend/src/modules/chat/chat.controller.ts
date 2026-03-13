import { Controller, Get, Post, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get all chat sessions for current user' })
  async getSessions(@CurrentUser() user: User) {
    return this.chatService.getSessionsByUserId(user.id);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create new chat session' })
  async createSession(@CurrentUser() user: User) {
    return this.chatService.createSession(user.id);
  }

  @Patch('sessions/:sessionId/title')
  @ApiOperation({ summary: 'Update chat session title' })
  async updateTitle(
    @Param('sessionId') sessionId: string,
    @Body('title') title: string,
  ) {
    return this.chatService.updateSessionTitle(sessionId, title);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get chat session with messages' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.chatService.getSession(sessionId);
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get messages for a session' })
  async getMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getMessages(sessionId);
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Send a message and get bot response' })
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body('message') message: string,
  ) {
    return this.chatService.sendMessage(sessionId, message);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Delete chat session' })
  async deleteSession(@Param('sessionId') sessionId: string) {
    return this.chatService.deleteSession(sessionId);
  }
}
