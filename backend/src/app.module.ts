import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
import { CasesModule } from './cases/cases.module';
import { HearingsModule } from './hearings/hearings.module';
import { ClientsModule } from './clients/clients.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    AuthModule,
    CasesModule,
    HearingsModule,
    ClientsModule,
    TasksModule,
  ],
})
export class AppModule {}