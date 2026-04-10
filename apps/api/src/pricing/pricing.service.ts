import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  calculateAreaPrice,
  calculateUnitPrice,
  toSquareMeters,
} from '@printos/shared';

import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateForProduct(params: {
    productId: string;
    quantity: number;
    widthMeters?: number;
    heightMeters?: number;
    surfaces?: number;
    finishingCost?: number;
    installationCost?: number;
  }) {
    const rule = await this.prisma.productPricingRule.findFirst({
      where: { productId: params.productId, active: true },
    });

    if (!rule) throw new NotFoundException('Regla de precio no encontrada para este producto');

    if (rule.pricingModel === 'AREA') {
      if (!params.widthMeters || !params.heightMeters)
        throw new BadRequestException('Ancho y alto son requeridos para productos por área');

      return calculateAreaPrice({
        widthMeters: params.widthMeters,
        heightMeters: params.heightMeters,
        pricePerSquareMeter: Number(rule.pricePerSquareMeter ?? 0),
        quantity: params.quantity,
        finishingCost: params.finishingCost ?? 0,
        installationCost: params.installationCost ?? 0,
      });
    }

    return calculateUnitPrice({
      quantity: params.quantity,
      unitPrice: Number(rule.baseUnitPrice ?? 0),
      personalizationMultiplier: Number(rule.personalizationMultiplier ?? 1),
      surfaces: params.surfaces ?? 1,
      setupFee: Number(rule.setupFee ?? 0),
    });
  }

  convertUnits(width: number, height: number, unit: 'mm' | 'cm' | 'm' | 'in' | 'ft') {
    return {
      widthMeters: width * this.getUnitFactor(unit),
      heightMeters: height * this.getUnitFactor(unit),
      squareMeters: toSquareMeters(width, height, unit),
    };
  }

  private getUnitFactor(unit: string): number {
    const factors: Record<string, number> = {
      mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048,
    };
    return factors[unit] ?? 1;
  }
}
