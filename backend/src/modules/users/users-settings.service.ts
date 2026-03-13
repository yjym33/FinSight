import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSetting } from './entities/user-setting.entity';

@Injectable()
export class UsersSettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private settingsRepository: Repository<UserSetting>,
  ) {}

  async findByUserId(userId: string): Promise<UserSetting> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = this.settingsRepository.create({
        userId,
        aiAnalysisStyle: 'expert',
        autoReportEnabled: true,
        theme: 'light',
        chartColorStyle: 'kr',
        alertThreshold: 3.0,
        communityAlertEnabled: true,
        aiAlertEnabled: false,
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async update(userId: string, updateData: Partial<UserSetting>): Promise<UserSetting> {
    const settings = await this.findByUserId(userId);
    
    Object.assign(settings, updateData);
    return this.settingsRepository.save(settings);
  }
}
