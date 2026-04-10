import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { PrismaExceptionFilter } from './common/prisma-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'storage'), {
    prefix: '/files',
  });
  const webPort = process.env['WEB_PORT'] ?? 3100;
  const adminPort = process.env['ADMIN_PORT'] ?? 3101;
  app.enableCors({
    origin: [
      `http://localhost:${webPort}`,
      `http://localhost:${adminPort}`,
      'http://localhost:3000',
      'http://localhost:3001',
      process.env['NEXT_PUBLIC_WEB_URL'] ?? '',
    ].filter(Boolean),
    credentials: true,
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

  const port = process.env['API_PORT'] ?? 3102;
  await app.listen(port);
  console.log(`[api] PrintOS AI API escuchando en http://localhost:${port}/api`);
  console.log(`[api] Swagger disponible en http://localhost:${port}/api/docs`);
}

void bootstrap().catch((error) => {
  console.error('[api] Error al iniciar la API:', error);
  process.exit(1);
});
