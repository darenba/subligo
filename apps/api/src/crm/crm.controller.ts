import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { CrmService } from './crm.service.js';

@ApiTags('crm')
@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('customers')
  getCustomers(@Query('search') search?: string) {
    return this.crm.getCustomers(search);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('customers')
  createCustomer(@Body() body: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
  }, @Request() req: any) {
    return this.crm.createCustomer(body, req.user.sub);
  }

  @Get('leads')
  getLeads(@Query('stage') stage?: string) {
    return this.crm.getLeads(stage);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('leads')
  createLead(@Body() body: {
    customerId?: string;
    source: string;
    channel: ChannelType;
    contactName: string;
    email?: string;
    phone?: string;
    city?: string;
    stage?: string;
    score?: number;
    quotedValue?: number;
    notes?: string;
    assignedToId?: string;
    companyId?: string;
  }, @Request() req: any) {
    return this.crm.createLead(body, req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch('leads/:id')
  updateLead(
    @Param('id') id: string,
    @Body() body: {
      score?: number;
      quotedValue?: number;
      notes?: string;
      assignedToId?: string;
    },
    @Request() req: any,
  ) {
    return this.crm.updateLead(id, body, req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch('leads/:id/stage')
  updateStage(
    @Param('id') id: string,
    @Body() body: { stage: string; lostReason?: string },
    @Request() req: any,
  ) {
    return this.crm.updateLeadStage(id, body.stage, body.lostReason, req.user.sub);
  }

  @Get('pipeline')
  getPipeline() {
    return this.crm.getPipelineStats();
  }

  @Get('conversations')
  getConversations(@Query('leadId') leadId?: string) {
    return this.crm.getConversations(leadId);
  }
}
