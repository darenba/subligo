import { Controller, Get, Post, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AutomationsService } from './automations.service.js';

@ApiTags('automations')
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}

  @Get()
  listAutomations() {
    return this.automations.listAutomations();
  }

  @Post('reactivation/run')
  runReactivation(@Request() req: { user?: { sub?: string } }) {
    return this.automations.runReactivationFlow(req.user?.sub);
  }
}
