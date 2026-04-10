import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PricingService } from './pricing.service.js';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Post('calculate')
  calculate(@Body() body: {
    productId: string;
    quantity: number;
    widthMeters?: number;
    heightMeters?: number;
    surfaces?: number;
    finishingCost?: number;
    installationCost?: number;
  }) {
    return this.pricing.calculateForProduct(body);
  }

  @Post('convert')
  convert(@Body() body: { width: number; height: number; unit: 'mm' | 'cm' | 'm' | 'in' | 'ft' }) {
    return this.pricing.convertUnits(body.width, body.height, body.unit);
  }
}
