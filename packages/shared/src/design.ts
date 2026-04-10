import { z } from 'zod';

export const designElementSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    id: z.string(),
    content: z.string().min(1),
    x: z.number(),
    y: z.number(),
    rotation: z.number().default(0),
    fontFamily: z.string(),
    fontSize: z.number().positive(),
    color: z.string(),
    align: z.enum(['left', 'center', 'right']).default('left'),
  }),
  z.object({
    type: z.literal('image'),
    id: z.string(),
    assetUrl: z.string().url(),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    rotation: z.number().default(0),
    minimumDpi: z.number().positive().default(150),
  }),
]);

export const designSurfaceSchema = z.object({
  surface: z.enum(['front', 'back', 'left', 'right', 'wrap']),
  width: z.number().positive(),
  height: z.number().positive(),
  printableBounds: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  elements: z.array(designElementSchema),
});

export const designSessionPayloadSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  customerId: z.string().optional(),
  surfaces: z.array(designSurfaceSchema).min(1),
  notes: z.string().optional(),
});

export type DesignElement = z.infer<typeof designElementSchema>;
export type DesignSurface = z.infer<typeof designSurfaceSchema>;
export type DesignSessionPayload = z.infer<typeof designSessionPayloadSchema>;

export function validateMinimumDpi(
  imageWidthPx: number,
  imageHeightPx: number,
  printWidthInches: number,
  printHeightInches: number,
): number {
  const horizontalDpi = imageWidthPx / printWidthInches;
  const verticalDpi = imageHeightPx / printHeightInches;
  return Math.floor(Math.min(horizontalDpi, verticalDpi));
}

