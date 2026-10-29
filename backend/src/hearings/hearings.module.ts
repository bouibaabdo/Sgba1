import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { HearingsController } from './hearings.controller';
import { HearingsService } from './hearings.service';

@Module({
  imports: [RbacModule],
  controllers: [HearingsController],
  providers: [HearingsService],
})
export class HearingsModule {}