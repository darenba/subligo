import { describe, expect, it } from 'vitest';

import { validateMinimumDpi } from './design';

describe('design validation', () => {
  it('returns the limiting dpi between width and height', () => {
    expect(validateMinimumDpi(2400, 1200, 10, 4)).toBe(240);
  });
});

