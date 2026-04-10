export type CatalogProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  pricingModel: 'UNIT' | 'AREA';
  featured: boolean;
  baseUnitPrice?: number;
  pricePerSquareMeter?: number;
  personalizationMultiplier: number;
  surfaces: string[];
  heroCopy: string;
  imageUrl?: string;
  marketingTitle?: string;
  marketingDescription?: string;
  proofPoints: string[];
  baseColorOptions: string[];
  variants: CatalogVariant[];
};

export type CatalogVariant = {
  id?: string;
  sku: string;
  name: string;
  color?: string;
  size?: string;
  stock: number;
  isDefault?: boolean;
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

export type CatalogHomeContent = {
  categories: CatalogCategory[];
  featuredProducts: CatalogProduct[];
};

type CatalogApiProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  pricingModel: 'UNIT' | 'AREA';
  featured?: boolean;
  printableSurfaces?: unknown;
  baseColorOptions?: unknown;
  metadata?: Record<string, unknown> | null;
  category: {
    name: string;
    slug: string;
  };
  variants?: Array<{
    id?: string;
    sku: string;
    name: string;
    color?: string | null;
    size?: string | null;
    stock: number | string;
    isDefault?: boolean | null;
  }>;
  pricingRules?: Array<{
    baseUnitPrice?: number | string | null;
    pricePerSquareMeter?: number | string | null;
    personalizationMultiplier?: number | string | null;
  }>;
};

type CatalogApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
  active?: boolean | null;
  _count?: {
    products?: number;
  };
};

type CatalogApiHomeContent = {
  categories?: CatalogApiCategory[];
  featuredProducts?: CatalogApiProduct[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3102/api';

const catalogFallback: CatalogProduct[] = [
  {
    id: 'fallback-camiseta',
    sku: 'CAM-DRYFIT-PREM',
    slug: 'camiseta-unisex-premium',
    name: 'Camiseta Unisex Premium',
    description:
      'Camiseta dry fit con personalizacion frontal y posterior para equipos, eventos y retail.',
    category: 'Camisetas',
    categorySlug: 'camisetas',
    pricingModel: 'UNIT',
    featured: true,
    baseUnitPrice: 185,
    personalizationMultiplier: 1.15,
    surfaces: ['front', 'back'],
    heroCopy: 'Uniformes, activaciones y promociones con entrega agil.',
    imageUrl: '/branding/shirt-carousel/shirt-slide-01.png',
    marketingTitle: 'Camiseta Unisex Premium',
    marketingDescription: 'Ideal para merch, uniformes y piezas promocionales.',
    proofPoints: ['dry fit y algodon', '1 o 2 caras impresas', 'ideal para equipos y activaciones'],
    baseColorOptions: ['Blanco', 'Negro', 'Gris'],
    variants: [
      {
        id: 'fallback-camiseta-bl-m',
        sku: 'CAM-PREM-001-BL-M',
        name: 'Blanco M',
        color: 'Blanco',
        size: 'M',
        stock: 40,
        isDefault: true,
      },
    ],
  },
  {
    id: 'fallback-banner',
    sku: 'BANNER-PREM-440',
    slug: 'banner-publicitario-premium',
    name: 'Banner Publicitario Premium',
    description: 'Lona premium por area con acabados, ojillos e instalacion local.',
    category: 'Banner/Lona',
    categorySlug: 'banner-lona',
    pricingModel: 'AREA',
    featured: true,
    pricePerSquareMeter: 480,
    personalizationMultiplier: 1,
    surfaces: ['front'],
    heroCopy: 'Gran formato para aperturas, promociones y visibilidad inmediata.',
    marketingTitle: 'Banner Publicitario Premium',
    marketingDescription: 'Gran formato para calle, vitrinas y promociones.',
    proofPoints: ['precio por area', 'ideal para calle', 'acabados listos para montar'],
    baseColorOptions: ['Blanco'],
    variants: [
      {
        id: 'fallback-banner-standard',
        sku: 'BAN-LON-001-ST',
        name: 'Lona estandar',
        color: 'Blanco',
        stock: 999,
        isDefault: true,
      },
    ],
  },
];

const categoryFallback: CatalogCategory[] = [
  {
    id: 'fallback-cam',
    name: 'Camisetas',
    slug: 'camisetas',
    description: 'Prendas listas para equipos, promos y merchandising.',
    sortOrder: 0,
    active: true,
    productCount: 1,
  },
  {
    id: 'fallback-banner',
    name: 'Banner/Lona',
    slug: 'banner-lona',
    description: 'Gran formato para calle, eventos y visibilidad comercial.',
    sortOrder: 1,
    active: true,
    productCount: 1,
  },
];

function toNumber(value: number | string | null | undefined) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function fallbackHeroCopy(product: CatalogApiProduct) {
  return product.pricingModel === 'AREA'
    ? 'Gran formato con precio por area, arte listo y salida directa a produccion.'
    : 'Personalizacion por unidad con control de superficies y salida a checkout sandbox.';
}

function normalizeProduct(product: CatalogApiProduct): CatalogProduct {
  const pricingRule = product.pricingRules?.[0];
  const metadata =
    product.metadata && typeof product.metadata === 'object' ? product.metadata : undefined;
  const heroCopy =
    metadata && typeof metadata.heroCopy === 'string'
      ? metadata.heroCopy
      : fallbackHeroCopy(product);

  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category.name,
    categorySlug: product.category.slug,
    pricingModel: product.pricingModel,
    featured: Boolean(product.featured),
    baseUnitPrice: toNumber(pricingRule?.baseUnitPrice),
    pricePerSquareMeter: toNumber(pricingRule?.pricePerSquareMeter),
    personalizationMultiplier: toNumber(pricingRule?.personalizationMultiplier) ?? 1,
    surfaces: normalizeStringArray(product.printableSurfaces).length
      ? normalizeStringArray(product.printableSurfaces)
      : ['front'],
    heroCopy,
    imageUrl:
      metadata && typeof metadata.imageUrl === 'string' ? metadata.imageUrl : undefined,
    marketingTitle:
      metadata && typeof metadata.marketingTitle === 'string'
        ? metadata.marketingTitle
        : undefined,
    marketingDescription:
      metadata && typeof metadata.marketingDescription === 'string'
        ? metadata.marketingDescription
        : undefined,
    proofPoints:
      metadata && Array.isArray(metadata.proofPoints)
        ? metadata.proofPoints.map((item) => String(item)).filter(Boolean)
        : [],
    baseColorOptions: normalizeStringArray(product.baseColorOptions),
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          color: variant.color ?? undefined,
          size: variant.size ?? undefined,
          stock: toNumber(variant.stock) ?? 0,
          isDefault: Boolean(variant.isDefault),
        }))
      : [],
  };
}

function normalizeCategory(category: CatalogApiCategory): CatalogCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
    imageUrl: category.imageUrl ?? undefined,
    sortOrder: category.sortOrder ?? 0,
    active: category.active ?? true,
    productCount: category._count?.products ?? 0,
  };
}

async function fetchCatalog<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Catalog API responded with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Fallo al consultar ${path}:`, error);
    return fallback;
  }
}

export async function getCatalogProducts(categorySlug?: string) {
  const search = categorySlug
    ? `/catalog/products?category=${encodeURIComponent(categorySlug)}`
    : '/catalog/products';
  const products = await fetchCatalog<CatalogApiProduct[]>(search, []);

  if (!products.length) {
    return categorySlug
      ? catalogFallback.filter((item) => item.categorySlug === categorySlug)
      : catalogFallback;
  }

  return products.map(normalizeProduct);
}

export async function getCatalogCategories() {
  const categories = await fetchCatalog<CatalogApiCategory[]>('/catalog/categories', []);
  if (!categories.length) {
    return categoryFallback;
  }

  return categories
    .map(normalizeCategory)
    .filter((category) => category.active && category.productCount > 0);
}

export async function getCatalogHomeContent() {
  const payload = await fetchCatalog<CatalogApiHomeContent>('/catalog/home', {});
  const categories = payload.categories?.length
    ? payload.categories.map(normalizeCategory)
    : categoryFallback;
  const featuredProducts = payload.featuredProducts?.length
    ? payload.featuredProducts.map(normalizeProduct)
    : catalogFallback.filter((product) => product.featured);

  return {
    categories: categories.filter((category) => category.active && category.productCount > 0),
    featuredProducts,
  } satisfies CatalogHomeContent;
}

export async function getCatalogProductBySlug(slug: string) {
  const product = await fetchCatalog<CatalogApiProduct | null>(`/catalog/products/${slug}`, null);
  if (!product) {
    return catalogFallback.find((item) => item.slug === slug) ?? null;
  }

  return normalizeProduct(product);
}
