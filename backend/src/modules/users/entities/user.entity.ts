import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ChatSession } from '../../chat/entities/chat-session.entity';
import { Watchlist } from '../../watchlist/entities/watchlist.entity';
import { UserSetting } from './user-setting.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  nickname: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ChatSession, (session) => session.user)
  chatSessions: ChatSession[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.user)
  watchlists: Watchlist[];

  @OneToOne(() => UserSetting, (setting) => setting.user)
  settings: UserSetting;
}
