import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WatchlistGroup } from './watchlist-group.entity';

@Entity('watchlists')
export class Watchlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'stock_code' })
  stockCode: string;

  @Column({ name: 'group_id', nullable: true })
  groupId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.watchlists)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WatchlistGroup, (group) => group.items, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'group_id' })
  group: WatchlistGroup;
}
