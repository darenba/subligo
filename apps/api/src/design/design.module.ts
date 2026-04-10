import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { DesignController } from './design.controller.js';
import { DesignService } from './design.service.js';

@Module({
  imports: [AuditModule],
  providers: [DesignService],
  controllers: [DesignController],
  exports: [DesignService],
})
export class DesignModule {}
