import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  imports: [RbacModule],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}