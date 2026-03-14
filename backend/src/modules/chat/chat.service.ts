import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, MessageSender } from './entities/chat-message.entity';
import { LLMService } from './llm.service';
import { NewsService } from '../news/news.service';

/**
 * 투자봇(Chat) 비즈니스 로직 처리 서비스
 * 역할: 사용자와 인공지능 비서 간의 채팅 세션 및 대화 내역(Message)을 DB에 저장하고, 
 * LLM(Large Language Model) 서비스로 질문을 전달하여 답변을 받아오는 핵심 흐름을 제어합니다.
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private llmService: LLMService,
    private newsService: NewsService,
  ) {}

  async getSessionsByUserId(userId: string): Promise<ChatSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['messages'],
    });
  }

  async createSession(userId: string): Promise<ChatSession> {
    const session = this.sessionRepository.create({ userId });
    return this.sessionRepository.save(session);
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async addMessage(
    sessionId: string,
    message: string,
    sender: MessageSender,
  ): Promise<ChatMessage> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const chatMessage = this.messageRepository.create({
      sessionId,
      message,
      sender,
    });
    return this.messageRepository.save(chatMessage);
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<ChatMessage> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    // Update title based on first message if needed
    if (session.title === '새로운 대화') {
      const shortTitle = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
      session.title = shortTitle;
      await this.sessionRepository.save(session);
    }

    // Save user message
    await this.addMessage(sessionId, userMessage, MessageSender.USER);

    // Fetch context (latest news)
    const news = await this.newsService.findAll(undefined, 5);
    
    // Fetch recent chat history for context
    const recentMessages = await this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    
    // Map to the format Python agent expects: List[dict] with role and content
    const chatHistory = recentMessages.reverse().map(m => ({
      role: m.sender === MessageSender.USER ? 'user' : 'assistant',
      content: m.message
    }));

    // Generate real AI response through Analysis Server Agent
    const botResponse = await this.llmService.chatWithAgent(userMessage, chatHistory, news);
    
    return this.addMessage(sessionId, botResponse, MessageSender.BOT);
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    
    session.title = title;
    return this.sessionRepository.save(session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.messageRepository.delete({ sessionId });
    await this.sessionRepository.delete(sessionId);
  }
}
