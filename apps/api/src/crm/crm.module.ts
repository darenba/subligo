import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { CrmController } from './crm.controller.js';
import { CrmService } from './crm.service.js';

@Module({
  imports: [AuditModule],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
