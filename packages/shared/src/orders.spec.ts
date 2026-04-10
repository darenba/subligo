import { describe, expect, it } from 'vitest';

import { buildProductionSku, summarizeCheckout } from './orders';

describe('orders helpers', () => {
  it('builds a deterministic production sku', () => {
    expect(buildProductionSku('TAZA-11OZ-001', 2, new Date('2026-04-04T08:00:00.000Z'))).toBe(
      'TAZA-11OZ-001-20260404-002',
    );
  });

  it('summarizes checkout totals', () => {
    expect(summarizeCheckout([1890, 2135])).toEqual({
      subtotal: 4025,
      tax: 0,
      total: 4025,
    });
  });
});

