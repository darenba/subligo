import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getSnapshot() {
    return this.dashboard.getSnapshot();
  }

  @Get('activity')
  getActivity(@Query('limit') limit = '20') {
    return this.dashboard.getRecentActivity(Number(limit));
  }

  @Get('sales-timeline')
  getSalesTimeline(@Query('days') days = '7') {
    return this.dashboard.getSalesTimeline(Number(days));
  }

  @Get('commercial-intelligence')
  getCommercialIntelligence() {
    return this.dashboard.getCommercialIntelligence();
  }

  @Get('operations-finance')
  getOperationsFinance(@Query('days') days = '30') {
    return this.dashboard.getOperationsFinance(Number(days));
  }

  @Get('accounting-overview')
  getAccountingOverview(@Query('days') days = '30') {
    return this.dashboard.getAccountingOverview(Number(days));
  }
}
