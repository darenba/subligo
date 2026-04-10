import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DesignSessionStatus } from '@prisma/client';
import { designSessionPayloadSchema } from '@printos/shared';

import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class DesignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createSession(body: unknown, customerId?: string) {
    const parsed = designSessionPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const session = await this.prisma.designSession.create({
      data: {
        customerId: customerId ?? null,
        productId: parsed.data.productId,
        canvasJson: parsed.data as any,
        status: DesignSessionStatus.DRAFT,
        notes: parsed.data.notes ?? null,
      },
    });

    if (customerId) {
      await this.audit.log({
        actorUserId: customerId,
        entityType: 'DesignSession',
        entityId: session.id,
        action: 'design_session.created',
        metadata: { productId: session.productId },
      });
    }

    return session;
  }

  async updateSession(id: string, body: unknown, actorId?: string) {
    const existing = await this.prisma.designSession.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`DesignSession ${id} not found`);

    const parsed = designSessionPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const updated = await this.prisma.designSession.update({
      where: { id },
      data: {
        canvasJson: parsed.data as any,
        status: DesignSessionStatus.SAVED,
        notes: parsed.data.notes ?? null,
      },
    });

    if (actorId) {
      await this.audit.log({
        actorUserId: actorId,
        entityType: 'DesignSession',
        entityId: id,
        action: 'design_session.updated',
      });
    }

    return updated;
  }

  async getSession(id: string) {
    const session = await this.prisma.designSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException(`DesignSession ${id} not found`);
    return session;
  }

  async listSessions(customerId?: string) {
    return this.prisma.designSession.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadAsset(file: {
    originalname?: string;
    mimetype?: string;
    size?: number;
    buffer?: Buffer;
  }, actorId?: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No se recibio ningun archivo');
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Formato no permitido. Usa PNG, JPG, WEBP o SVG');
    }

    if ((file.size ?? file.buffer.length) > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el limite de 10MB');
    }

    const extension = extname(file.originalname ?? '').toLowerCase() || '.bin';
    const assetId = randomUUID();
    const fileName = `${assetId}${extension}`;
    const uploadDir = join(process.cwd(), 'storage', 'uploads');
    const publicBaseUrl =
      process.env.PUBLIC_API_BASE_URL ?? `http://localhost:${process.env.API_PORT ?? 3102}`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, fileName), file.buffer);

    if (actorId) {
      await this.audit.log({
        entityType: 'DesignAsset',
        entityId: assetId,
        actorUserId: actorId,
        action: 'design.asset.uploaded',
        metadata: {
          originalName: file.originalname ?? null,
          mimeType: file.mimetype ?? null,
          size: file.size ?? file.buffer.length,
        },
      });
    }

    return {
      id: assetId,
      assetUrl: `${publicBaseUrl}/files/uploads/${fileName}`,
      originalName: file.originalname ?? fileName,
      mimeType: file.mimetype ?? 'application/octet-stream',
      size: file.size ?? file.buffer.length,
    };
  }
}
