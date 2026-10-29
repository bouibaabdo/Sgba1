import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // الثقة بالـ proxy (Railway/Render/Vercel يضعون app خلف وكيل) — يفعّل HTTPS الصحيح
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins });

  // فحص الجاهزية — تستخدمه منصات النشر للتأكد أن الخدمة حية
  app.getHttpAdapter().getInstance().get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`✅ SGBA-API يعمل على http://localhost:${port}`);
}

bootstrap();
