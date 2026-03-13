import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('stocks')
export class Stock {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column()
  market: string; // KOSPI, KOSDAQ, NAS, NYS, etc.

  @Column({ nullable: true })
  sector: string;

  @Column({ type: 'bigint', nullable: true })
  price: number;

  @Column({ type: 'bigint', nullable: true })
  prevClose: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  changePercent: number;

  @Column({ type: 'bigint', nullable: true })
  volume: number;

  @Column({ type: 'bigint', nullable: true })
  tradingValue: number;

  // --- Financial Metrics ---
  @Column({ type: 'float', nullable: true })
  per?: number;

  @Column({ type: 'float', nullable: true })
  pbr?: number;

  @Column({ type: 'float', nullable: true })
  eps?: number;

  @Column({ name: 'market_cap', type: 'bigint', nullable: true })
  marketCap?: number;

  @Column({ name: 'dividend_yield', type: 'float', nullable: true })
  dividendYield?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
