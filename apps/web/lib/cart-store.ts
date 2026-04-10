'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  productId: string;
  productSlug: string;
  productSku: string;
  productName: string;
  pricingModel: 'UNIT' | 'AREA';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  designSessionId?: string;
  variantId?: string;
  variantName?: string;
  selectedColor?: string | null;
  selectedSize?: string | null;
  widthMeters?: number;
  heightMeters?: number;
  surfaces?: number;
  configuration?: Record<string, unknown>;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const CART_STORE_VERSION = 2;

function normalizeItem(item: Partial<CartItem>): CartItem {
  return {
    id: String(item.id ?? crypto.randomUUID()),
    productId: String(item.productId ?? ''),
    productSlug: String(item.productSlug ?? ''),
    productSku: String(item.productSku ?? ''),
    productName: String(item.productName ?? ''),
    pricingModel: item.pricingModel === 'AREA' ? 'AREA' : 'UNIT',
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.unitPrice ?? 0),
    lineTotal: Number(item.lineTotal ?? 0),
    designSessionId: typeof item.designSessionId === 'string' ? item.designSessionId : undefined,
    variantId: typeof item.variantId === 'string' ? item.variantId : undefined,
    variantName: typeof item.variantName === 'string' ? item.variantName : undefined,
    selectedColor:
      typeof item.selectedColor === 'string' || item.selectedColor === null
        ? item.selectedColor
        : undefined,
    selectedSize:
      typeof item.selectedSize === 'string' || item.selectedSize === null
        ? item.selectedSize
        : undefined,
    widthMeters: Number.isFinite(item.widthMeters) ? Number(item.widthMeters) : undefined,
    heightMeters: Number.isFinite(item.heightMeters) ? Number(item.heightMeters) : undefined,
    surfaces: Number.isFinite(item.surfaces) ? Number(item.surfaces) : undefined,
    configuration:
      item.configuration && typeof item.configuration === 'object' ? item.configuration : undefined,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'subligo-cart',
      version: CART_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const rawState =
          persistedState && typeof persistedState === 'object'
            ? (persistedState as { items?: Partial<CartItem>[] })
            : {};

        return {
          items: Array.isArray(rawState.items) ? rawState.items.map(normalizeItem) : [],
        };
      },
    },
  ),
);

export function summarizeCart(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: 0,
    total: Math.round(subtotal * 100) / 100,
  };
}
