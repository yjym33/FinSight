import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityComment } from './entities/community-comment.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    @InjectRepository(CommunityPost)
    private readonly postRepository: Repository<CommunityPost>,
    @InjectRepository(CommunityComment)
    private readonly commentRepository: Repository<CommunityComment>,
    private readonly notificationsService: NotificationsService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  // Post Methods
  async createPost(createPostDto: CreatePostDto, userId: string) {
    const post = this.postRepository.create({
      ...createPostDto,
      author: { id: userId } as any,
    });
    const saved = await this.postRepository.save(post);
    return this.postRepository.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
  }

  async findAllPosts(stockCode?: string, limit: any = 20, offset: any = 0) {
    const take = isNaN(Number(limit)) ? 20 : Number(limit);
    const skip = isNaN(Number(offset)) ? 0 : Number(offset);

    const [posts, total] = await this.postRepository.findAndCount({
      where: stockCode ? { stockCode } : {},
      relations: ['author'],
      take,
      skip,
      order: { createdAt: 'DESC' },
    });

    // Add comment counts
    for (const post of posts) {
      post.commentCount = await this.commentRepository.count({
        where: { post: { id: post.id } }
      });
    }

    return posts;
  }

  async findOnePost(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.author', 'comments.replies', 'comments.replies.author'],
    });

    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    
    // Increase view count
    await this.postRepository.update(id, { viewCount: post.viewCount + 1 });
    
    return post;
  }

  // Comment Methods
  async createComment(createCommentDto: CreateCommunityCommentDto, userId: string) {
    const { postId, parentId, content } = createCommentDto;

    const post = await this.postRepository.findOne({
        where: { id: postId },
        relations: ['author'],
    });

    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    const comment = this.commentRepository.create({
      content,
      post: { id: postId } as any,
      parent: parentId ? { id: parentId } as any : null,
      author: { id: userId } as any,
    });

    const savedComment = await this.commentRepository.save(comment);
    
    // Notification Logic
    this.handleCommentNotifications(savedComment, post, userId);

    return savedComment;
  }

  private async handleCommentNotifications(comment: CommunityComment, post: CommunityPost, actorId: string) {
    try {
      // 1. If it's a reply to another comment (parent exists)
      const parentId = comment.parent?.id || (comment as any).parentId;
      if (parentId) {
        const parentComment = await this.commentRepository.findOne({
          where: { id: parentId },
          relations: ['author'],
        });

        if (parentComment && parentComment.author?.id !== actorId) {
          await this.sendNotification(
            parentComment.author.id,
            '댓글의 답글',
            `나의 댓글에 새로운 답글이 달렸습니다: "${comment.content.substring(0, 20)}..."`,
            post.id,
          );
        }
      } 
      // 2. If it's a new comment on a post
      else if (post.author?.id !== actorId) {
        await this.sendNotification(
          post.author.id,
          '게시글 댓글',
          `나의 게시글에 새로운 댓글이 달렸습니다: "${comment.content.substring(0, 20)}..."`,
          post.id,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to send notification: ${err.message}`);
    }
  }

  private async sendNotification(userId: string, title: string, message: string, postId: string) {
    const notification = await this.notificationsService.create({
      userId,
      type: NotificationType.COMMUNITY_REPLY,
      title,
      message,
      metadata: { postId },
    });

    // Send real-time via WebSocket
    this.websocketGateway.sendToUser(userId, 'notification:new', notification);
  }
}
