import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module.js';
import { PrismaModule } from '../common/prisma.module.js';
import { AutomationsController } from './automations.controller.js';
import { AutomationsService } from './automations.service.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
