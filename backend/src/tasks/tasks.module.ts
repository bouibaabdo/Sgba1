import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [RbacModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}