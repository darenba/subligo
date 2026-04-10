import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorUserId?: string;
    entityType: string;
    entityId: string;
    action: string;
    orderId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        orderId: params.orderId ?? null,
        metadata: params.metadata as any,
        ipAddress: params.ipAddress ?? null,
      },
    });
  }
}
