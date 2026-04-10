import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { PrismaModule } from '../common/prisma.module.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
