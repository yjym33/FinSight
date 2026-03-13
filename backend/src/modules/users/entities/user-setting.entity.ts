import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ai_analysis_style', default: 'expert' })
  aiAnalysisStyle: string; // 'summary', 'expert', 'friendly'

  @Column({ name: 'auto_report_enabled', default: true })
  autoReportEnabled: boolean;

  @Column({ default: 'light' })
  theme: string; // 'light', 'dark'

  @Column({ name: 'chart_color_style', default: 'kr' })
  chartColorStyle: string; // 'kr', 'us'

  @Column({ name: 'alert_threshold', type: 'float', default: 3.0 })
  alertThreshold: number;

  @Column({ name: 'community_alert_enabled', default: true })
  communityAlertEnabled: boolean;

  @Column({ name: 'ai_alert_enabled', default: false })
  aiAlertEnabled: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;
}
