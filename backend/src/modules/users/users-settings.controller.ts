import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersSettingsService } from './users-settings.service';
import { UserSetting } from './entities/user-setting.entity';

@Controller('user-settings')
@UseGuards(JwtAuthGuard)
export class UsersSettingsController {
  constructor(private readonly settingsService: UsersSettingsService) {}

  @Get()
  async getSettings(@Request() req: any) {
    console.log(`[UsersSettingsController] Fetching settings for user: ${req.user.id}`);
    const settings = await this.settingsService.findByUserId(req.user.id);
    console.log(`[UsersSettingsController] Settings result:`, settings);
    return settings;
  }

  @Patch()
  async updateSettings(@Request() req: any, @Body() updateData: Partial<UserSetting>) {
    // Basic validation: prevent changing id or userId
    delete updateData.id;
    delete (updateData as any).userId;
    delete (updateData as any).user;

    return this.settingsService.update(req.user.id, updateData);
  }
}
