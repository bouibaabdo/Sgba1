import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [RbacModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}