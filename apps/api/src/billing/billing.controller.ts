import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BillingService } from './billing.service.js';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('overview')
  getOverview(@Query('days') days = '30') {
    return this.billing.getOverview(Number(days));
  }

  @Get('invoices')
  getInvoices(@Query('limit') limit = '30', @Query('status') status?: string) {
    return this.billing.listInvoices(Number(limit), status);
  }

  @Post('invoices/issue-ready')
  issueReadyInvoices() {
    return this.billing.issueReadyInvoices();
  }

  @Post('invoices/send-pending')
  sendPendingInvoices() {
    return this.billing.sendPendingInvoices();
  }
}
