import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('stock_comments')
export class StockComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  stockCode: string;

  @Column()
  nickname: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: '익명' })
  ipAddress?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
