import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ unique: true })
  url: string;

  @Column()
  source: string;

  @Column({ name: 'published_at', type: 'timestamp' })
  publishedAt: Date;

  @Column({ name: 'related_stock_code', nullable: true })
  relatedStockCode: string;

  @Column({ default: 'domestic' })
  category: string; // 'domestic' or 'overseas'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
