import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    stockCode?: string;
    metadata?: any;
  }) {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }

  async delete(id: string, userId: string) {
    await this.notificationRepository.delete({ id, userId });
    return { success: true };
  }
}
