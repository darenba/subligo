import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { PrismaExceptionFilter } from './common/prisma-exception.filter.js';

function resolveCorsOrigins() {
  const candidates = [
    `http://localhost:${process.env['WEB_PORT'] ?? 3100}`,
    `http://localhost:${process.env['ADMIN_PORT'] ?? 3101}`,
    'http://localhost:3000',
    'http://localhost:3001',
    process.env['NEXT_PUBLIC_WEB_URL'],
    process.env['NEXT_PUBLIC_ADMIN_URL'],
  ];

  return Array.from(
    new Set(
      candidates
        .flatMap((value) => value?.split(',') ?? [])
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'storage'), {
    prefix: '/files',
  });
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });

  app.getHttpAdapter().get('/api/health', (_req: any, res: any) => {
    res.status(200).json({
      ok: true,
      service: 'printos-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle('PrintOS AI API')
    .setDescription('API principal para ecommerce, CRM y operaciones de SubliGo.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] ?? process.env['API_PORT'] ?? 3102;
  const publicBaseUrl = process.env['PUBLIC_API_BASE_URL'] ?? `http://localhost:${port}`;
  await app.listen(port);
  console.log(`[api] PrintOS AI API escuchando en ${publicBaseUrl}/api`);
  console.log(`[api] Swagger disponible en ${publicBaseUrl}/api/docs`);
}

void bootstrap().catch((error) => {
  console.error('[api] Error al iniciar la API:', error);
  process.exit(1);
});
