import { describe, expect, it } from 'vitest';

import { calculateAreaPrice, calculateUnitPrice, toSquareMeters } from './pricing';

describe('pricing', () => {
  it('calculates unit pricing with personalization', () => {
    expect(
      calculateUnitPrice({
        quantity: 12,
        unitPrice: 150,
        personalizationMultiplier: 1.15,
        surfaces: 2,
        setupFee: 75,
      }),
    ).toEqual({
      model: 'UNIT',
      quantity: 12,
      subtotal: 1800,
      personalizationCost: 540,
      setupFee: 75,
      total: 2415,
      surfaces: 2,
    });
  });

  it('calculates area pricing with finishing and installation', () => {
    expect(
      calculateAreaPrice({
        widthMeters: 2,
        heightMeters: 1.5,
        pricePerSquareMeter: 480,
        quantity: 2,
        finishingCost: 300,
        installationCost: 450,
      }),
    ).toEqual({
      model: 'AREA',
      areaSquareMeters: 3,
      quantity: 2,
      subtotal: 2880,
      finishingCost: 300,
      installationCost: 450,
      total: 3630,
    });
  });

  it('converts inches to square meters', () => {
    expect(toSquareMeters(24, 36, 'in')).toBe(0.56);
  });
});

