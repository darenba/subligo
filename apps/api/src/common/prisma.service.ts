import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma connected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown prisma error';
      this.logger.warn(`Prisma bootstrap connection skipped: ${message}`);
    }
  }
}
