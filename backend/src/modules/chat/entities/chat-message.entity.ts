import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: MessageSender,
    default: MessageSender.USER,
  })
  sender: MessageSender;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatSession, (session) => session.messages)
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;
}
