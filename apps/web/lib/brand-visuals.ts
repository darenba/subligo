import type { BrandArtVariant } from '@printos/ui';

import type { CatalogCategory, CatalogProduct } from './catalog';

type ProductVisual = {
  variant: BrandArtVariant;
  badge: string;
  headline: string;
  microcopy: string;
  promise: string;
  useCases: string[];
  proofPoints: string[];
  checkoutHint: string;
};

type FamilySpotlight = {
  title: string;
  href: string;
  badge: string;
  description: string;
  variant: BrandArtVariant;
};

const FAMILY_SPOTLIGHTS: FamilySpotlight[] = [
  {
    title: 'Textiles que venden marca',
    href: '/productos/camiseta-unisex-premium',
    badge: 'textil',
    description: 'Uniformes, lanzamientos y activaciones con presencia limpia y entrega agil.',
    variant: 'apparel',
  },
  {
    title: 'Tazas y tumblers listos para regalo',
    href: '/catalogo',
    badge: 'merch',
    description: 'Piezas de onboarding, gifting y retail con arte listo para personalizar.',
    variant: 'tumbler',
  },
  {
    title: 'Gran formato para la calle',
    href: '/productos/banner-publicitario-premium',
    badge: 'outdoor',
    description: 'Banners, lonas y piezas de alto impacto para promociones, vitrinas y eventos.',
    variant: 'banner',
  },
  {
    title: 'Vinil, stickers y microperforado',
    href: '/catalogo',
    badge: 'rotulacion',
    description: 'Aplicaciones para puertas, vitrinas, paredes y flotillas con look consistente.',
    variant: 'signage',
  },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function fromCategoryOrSlug(input: {
  slug: string;
  category?: string;
  name: string;
  description?: string;
}) {
  const haystack = `${input.slug} ${input.category ?? ''} ${input.name}`;
  const normalized = normalize(haystack);

  if (normalized.includes('camiseta')) {
    return {
      variant: 'apparel' as const,
      badge: 'textil',
      headline: 'Uniformes y merch con presencia limpia desde la primera pieza.',
      microcopy: 'Linea textil pensada para uniformes, promociones y retail con arte frontal o doble cara.',
      promise: 'Sube tu logo, define cantidades y sal a cotizacion con una vista lista para vender.',
      useCases: ['equipos', 'eventos', 'promociones'],
      proofPoints: ['dry fit y algodon', '1 o 2 caras impresas', 'ideal para equipos y activaciones'],
      checkoutHint: 'Perfecta para brigadas, uniformes, ferias y gifting interno.',
    };
  }

  if (normalized.includes('taza')) {
    return {
      variant: 'mug' as const,
      badge: 'ceramica',
      headline: 'Tazas que convierten un detalle en recordacion de marca.',
      microcopy: 'Piezas de regalo y recordatorio con una presentacion limpia, util y facil de repetir.',
      promise: 'Ideal para kits corporativos, fechas especiales y ventas por volumen.',
      useCases: ['gifting', 'onboarding', 'souvenirs'],
      proofPoints: ['alto valor percibido', 'se vende bien en pares o kits', 'funciona para regalos y retail'],
      checkoutHint: 'Combina muy bien con camisetas, tumblers y empaques promocionales.',
    };
  }

  if (normalized.includes('tumbler') || normalized.includes('botella')) {
    return {
      variant: 'tumbler' as const,
      badge: 'premium',
      headline: 'Tumblers y botellas con un look premium que si se siente regalo.',
      microcopy: 'Merch de alto valor percibido para experiencias premium, marcas activas y kits corporativos.',
      promise: 'Resalta el logo con un producto util, durable y visualmente protagonista.',
      useCases: ['corporativo', 'retail', 'kits'],
      proofPoints: ['ideal para onboarding', 'excelente para kits premium', 'producto util y durable'],
      checkoutHint: 'Uno de los productos con mejor percepcion para clientes corporativos.',
    };
  }

  if (normalized.includes('gorra')) {
    return {
      variant: 'cap' as const,
      badge: 'headwear',
      headline: 'Gorras para calle, brigada y presencia de equipo.',
      microcopy: 'Gorras para brigadas, promociones y uniformes con lectura rapida de marca.',
      promise: 'Excelente para equipos de campo, activaciones y merchandising de marca.',
      useCases: ['brigadas', 'eventos', 'uniformes'],
      proofPoints: ['visibilidad en campo', 'serie corta o media', 'combina con uniformes'],
      checkoutHint: 'Suele vender mejor cuando se presenta junto a camisetas y termos.',
    };
  }

  if (
    normalized.includes('banner') ||
    normalized.includes('lona') ||
    normalized.includes('roll-up') ||
    normalized.includes('x-banner')
  ) {
    return {
      variant: 'banner' as const,
      badge: 'gran formato',
      headline: 'Banners y lonas para calle, ferias y promociones que necesitan verse grandes.',
      microcopy: 'Piezas por area para calle, punto de venta y eventos con fuerte lectura comercial.',
      promise: 'Cotiza medidas reales, visualiza el arte y acelera el paso a produccion.',
      useCases: ['fachada', 'eventos', 'promociones'],
      proofPoints: ['cobro por area', 'lectura inmediata', 'ideal para aperturas y activaciones'],
      checkoutHint: 'Muy bueno para locales, eventos, lanzamientos y temporadas altas.',
    };
  }

  if (
    normalized.includes('sticker') ||
    normalized.includes('etiqueta') ||
    normalized.includes('microperforado') ||
    normalized.includes('vinil') ||
    normalized.includes('pvc') ||
    normalized.includes('coroplast') ||
    normalized.includes('rotulo')
  ) {
    return {
      variant: 'signage' as const,
      badge: 'aplicacion',
      headline: 'Vinil y microperforado para vestir puntos de venta, vitrinas y puertas.',
      microcopy: 'Rotulacion comercial para vitrinas, puertas, etiquetas y piezas funcionales del negocio.',
      promise: 'Pensado para presencia visual consistente en local, flotilla o empaque.',
      useCases: ['vitrinas', 'rotulacion', 'empaque'],
      proofPoints: ['sirve para local y empaque', 'buena lectura desde la calle', 'ideal para puntos de venta'],
      checkoutHint: 'Es la familia correcta cuando el objetivo es que el negocio se vea mas profesional.',
    };
  }

  return {
    variant: 'mix' as const,
    badge: 'SubliGo',
    headline: 'Impresion, merchandising y rotulacion con una sola narrativa comercial.',
    microcopy: 'Combinacion de soluciones visuales y promocionales para crecer presencia de marca.',
    promise: 'Un mismo sistema para cotizar, personalizar y producir piezas comerciales.',
    useCases: ['ventas', 'branding', 'produccion'],
    proofPoints: ['web, admin y produccion conectados', 'ideal para negocios en crecimiento', 'linea grafica coherente'],
    checkoutHint: 'SubliGo ya funciona como ecommerce, taller comercial y backoffice conectado.',
  };
}

export function getProductVisual(
  product: Pick<CatalogProduct, 'slug' | 'category' | 'name'>,
): ProductVisual {
  return fromCategoryOrSlug(product);
}

export function getCategoryVisual(
  category: Pick<CatalogCategory, 'slug' | 'name' | 'description'>,
): Pick<ProductVisual, 'variant' | 'badge' | 'microcopy'> {
  const visual = fromCategoryOrSlug({
    slug: category.slug,
    category: category.name,
    name: category.name,
    description: category.description,
  });

  return {
    variant: visual.variant,
    badge: visual.badge,
    microcopy: category.description ?? visual.microcopy,
  };
}

export function getFamilySpotlights() {
  return FAMILY_SPOTLIGHTS;
}
