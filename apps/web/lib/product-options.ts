import type { CatalogProduct, CatalogVariant } from './catalog';

const COLOR_MAP: Record<string, string> = {
  blanco: '#f8fafc',
  white: '#f8fafc',
  negro: '#111827',
  black: '#111827',
  gris: '#9ca3af',
  gray: '#9ca3af',
  grisclaro: '#d1d5db',
  azul: '#1d4ed8',
  navy: '#1e3a8a',
  amarillo: '#fcd122',
  dorado: '#d4a017',
  rojo: '#dc2626',
  verde: '#16a34a',
  naranja: '#f97316',
  rosa: '#ec4899',
  morado: '#8b5cf6',
  plata: '#cbd5e1',
};

function normalizeToken(value?: string | null) {
  return value
    ?.trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function prettifyLabel(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ');
}

function unique(values: Array<string | undefined>) {
  const map = new Map<string, string>();

  for (const value of values) {
    if (!value?.trim()) continue;
    const key = normalizeToken(value);
    if (!key || map.has(key)) continue;
    map.set(key, prettifyLabel(value));
  }

  return Array.from(map.values());
}

function sameToken(left?: string | null, right?: string | null) {
  return normalizeToken(left) === normalizeToken(right);
}

export function getAvailableColors(product: CatalogProduct) {
  return unique([
    ...product.baseColorOptions,
    ...product.variants.map((variant) => variant.color),
  ]);
}

export function getAvailableSizes(product: CatalogProduct, selectedColor?: string) {
  const variants = selectedColor
    ? product.variants.filter((variant) => sameToken(variant.color, selectedColor))
    : product.variants;

  return unique(variants.map((variant) => variant.size));
}

export function findPreferredVariant(
  product: CatalogProduct,
  selectedColor?: string,
  selectedSize?: string,
) {
  const exact = product.variants.find(
    (variant) =>
      (selectedColor ? sameToken(variant.color, selectedColor) : true) &&
      (selectedSize ? sameToken(variant.size, selectedSize) : true),
  );

  if (exact) {
    return exact;
  }

  return (
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0] ??
    null
  );
}

export function resolveDefaultColor(product: CatalogProduct) {
  return findPreferredVariant(product)?.color ?? getAvailableColors(product)[0] ?? null;
}

export function resolveDefaultSize(product: CatalogProduct, selectedColor?: string) {
  return (
    findPreferredVariant(product, selectedColor)?.size ??
    getAvailableSizes(product, selectedColor)[0] ??
    null
  );
}

export function resolveColorSwatch(color?: string) {
  if (!color) return '#f8fafc';

  const normalized = color.toLowerCase().replace(/\s+/g, '');
  return COLOR_MAP[normalized] ?? '#e2e8f0';
}

export function formatVariantLabel(variant: CatalogVariant | null) {
  if (!variant) return 'Se configurara con la variante disponible mas cercana.';

  const pieces = [variant.color, variant.size].filter(Boolean);
  return pieces.length ? pieces.join(' / ') : variant.name;
}
