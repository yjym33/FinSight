import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersSettingsController } from './users-settings.controller';
import { UsersSettingsService } from './users-settings.service';
import { User } from './entities/user.entity';
import { UserSetting } from './entities/user-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSetting])],
  controllers: [UsersController, UsersSettingsController],
  providers: [UsersService, UsersSettingsService],
  exports: [UsersService, UsersSettingsService],
})
export class UsersModule {}
