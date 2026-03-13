import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockComment } from './entities/stock-comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class StockCommentsService {
  private readonly logger = new Logger(StockCommentsService.name);

  // Lists for generating random nicknames
  private readonly modifiers = [
    '용감한', '행복한', '슬픈', '즐거운', '화가 난', '적극적인', '수줍은',
    '지루한', '열정적인', '냉정한', '따뜻한', '사려 깊은', '대담한',
    '차분한', '흥분한', '예리한', '평온한', '경쾌한', '민첩한'
  ];

  private readonly animals = [
    '개미', '코끼리', '호랑이', '사자', '매', '여우', '늑대', '하마',
    '판다', '두루미', '돌고래', '상어', '말', '토끼', '다람쥐', '거북이'
  ];

  constructor(
    @InjectRepository(StockComment)
    private commentRepository: Repository<StockComment>,
    private websocketGateway: WebsocketGateway,
  ) {}

  async create(createCommentDto: CreateCommentDto) {
    const nickname = this.generateNickname();
    const comment = this.commentRepository.create({
      ...createCommentDto,
      nickname,
    });

    const savedComment = await this.commentRepository.save(comment);
    
    // Broadcast the new comment via websockets
    this.websocketGateway.broadcastComment(savedComment.stockCode, savedComment);
    
    return savedComment;
  }

  async findAllByStock(stockCode: string, limit = 50) {
    return this.commentRepository.find({
      where: { stockCode },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private generateNickname(): string {
    const modifier = this.modifiers[Math.floor(Math.random() * this.modifiers.length)];
    const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
    const randomSuffix = Math.floor(Math.random() * 9999);
    return `${modifier} ${animal}#${randomSuffix}`;
  }
}
