import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AgentsModule } from './agents/agents.module.js';
import { AutomationsModule } from './automations/automations.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BillingModule } from './billing/billing.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { PrismaModule } from './common/prisma.module.js';
import { CrmModule } from './crm/crm.module.js';
import { DesignModule } from './design/design.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { WhatsappModule } from './whatsapp/whatsapp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
    }),
    PrismaModule,
    AuditModule,
    AgentsModule,
    AutomationsModule,
    AuthModule,
    BillingModule,
    CatalogModule,
    PricingModule,
    CrmModule,
    DesignModule,
    OrdersModule,
    DashboardModule,
    WhatsappModule,
  ],
})
export class AppModule {}
