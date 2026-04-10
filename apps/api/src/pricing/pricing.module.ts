import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller.js';
import { PricingService } from './pricing.service.js';

@Module({ providers: [PricingService], controllers: [PricingController], exports: [PricingService] })
export class PricingModule {}
