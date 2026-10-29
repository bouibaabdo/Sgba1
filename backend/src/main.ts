import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins });

  // وحدات الوحدات (Modules) تُضاف في المراحل التالية؛ كل مسار مغيّر للحالة
  // يجب أن يحمل @UseGuards(JwtAuthGuard, PermissionsGuard) + @RequirePermissions(...)

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`✅ SGBA-API يعمل على http://localhost:${port}`);
}

bootstrap();
