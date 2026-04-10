import { z } from 'zod';

export const pricingModelSchema = z.enum(['UNIT', 'AREA']);

export const unitPricingInputSchema = z.object({
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  personalizationMultiplier: z.number().positive().default(1),
  surfaces: z.number().int().positive().default(1),
  setupFee: z.number().nonnegative().default(0),
});

export const areaPricingInputSchema = z.object({
  widthMeters: z.number().positive(),
  heightMeters: z.number().positive(),
  pricePerSquareMeter: z.number().nonnegative(),
  finishingCost: z.number().nonnegative().default(0),
  installationCost: z.number().nonnegative().default(0),
  quantity: z.number().int().positive().default(1),
});

export type UnitPricingInput = z.infer<typeof unitPricingInputSchema>;
export type AreaPricingInput = z.infer<typeof areaPricingInputSchema>;

export type PricingBreakdown =
  | {
      model: 'UNIT';
      quantity: number;
      subtotal: number;
      personalizationCost: number;
      setupFee: number;
      total: number;
      surfaces: number;
    }
  | {
      model: 'AREA';
      areaSquareMeters: number;
      quantity: number;
      subtotal: number;
      finishingCost: number;
      installationCost: number;
      total: number;
    };

export function calculateUnitPrice(input: UnitPricingInput): PricingBreakdown {
  const parsed = unitPricingInputSchema.parse(input);
  const subtotal = parsed.quantity * parsed.unitPrice;
  const personalizationCost =
    subtotal * (parsed.personalizationMultiplier - 1) * parsed.surfaces;
  const total = subtotal + personalizationCost + parsed.setupFee;

  return {
    model: 'UNIT',
    quantity: parsed.quantity,
    subtotal: roundCurrency(subtotal),
    personalizationCost: roundCurrency(personalizationCost),
    setupFee: roundCurrency(parsed.setupFee),
    total: roundCurrency(total),
    surfaces: parsed.surfaces,
  };
}

export function calculateAreaPrice(input: AreaPricingInput): PricingBreakdown {
  const parsed = areaPricingInputSchema.parse(input);
  const areaSquareMeters = parsed.widthMeters * parsed.heightMeters;
  const subtotal =
    areaSquareMeters * parsed.pricePerSquareMeter * parsed.quantity;
  const total = subtotal + parsed.finishingCost + parsed.installationCost;

  return {
    model: 'AREA',
    areaSquareMeters: roundCurrency(areaSquareMeters),
    quantity: parsed.quantity,
    subtotal: roundCurrency(subtotal),
    finishingCost: roundCurrency(parsed.finishingCost),
    installationCost: roundCurrency(parsed.installationCost),
    total: roundCurrency(total),
  };
}

export function toSquareMeters(
  width: number,
  height: number,
  unit: 'mm' | 'cm' | 'm' | 'in' | 'ft',
): number {
  const factor = getUnitFactor(unit);
  return roundCurrency(width * factor * height * factor);
}

function getUnitFactor(unit: 'mm' | 'cm' | 'm' | 'in' | 'ft'): number {
  switch (unit) {
    case 'mm':
      return 0.001;
    case 'cm':
      return 0.01;
    case 'm':
      return 1;
    case 'in':
      return 0.0254;
    case 'ft':
      return 0.3048;
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

