import type { CatalogCategory, CatalogProduct } from './catalog';

type FeaturedCopy = {
  highlight: string;
  body: string;
};

export const HOME_COPY = {
  header: {
    homeNav: 'Inicio',
    catalogNav: 'Catalogo',
    designNav: 'Dise\u00f1a tu producto',
    howItWorksNav: 'Como funciona',
    categoriesNav: 'Categorias',
    loginCta: 'Iniciar sesion',
    primaryCta: 'Personaliza ahora',
  },
  hero: {
    kicker: 'Personalizaci\u00f3n premium para marcas, eventos y regalos',
    title: 'Personaliza camisetas, tazas, r\u00f3tulos y promocionales con acabado profesional',
    body:
      'Cotiza, dise\u00f1a y compra en l\u00ednea de forma simple. Desde camisetas y tazas hasta banners, vinilos y art\u00edculos promocionales, todo en un solo lugar.',
    primaryCta: 'Personalizar ahora',
    secondaryCta: 'Ver cat\u00e1logo',
    microcopy: 'Dise\u00f1o guiado \u00b7 Vista previa de tu producto \u00b7 Atenci\u00f3n personalizada',
  },
  heroVisual: {
    label: 'Trabajos reales de Subligo',
    boxTitle: 'Dise\u00f1os que destacan en uso real',
    boxText:
      'Explora ejemplos reales de productos personalizados con mejor presencia visual, mejor acabado y una experiencia m\u00e1s clara para comprar.',
  },
  benefits: [
    {
      icon: 'proof' as const,
      title: 'Compra m\u00e1s f\u00e1cil',
      copy: 'Encuentra m\u00e1s r\u00e1pido el producto correcto y pasa de la idea al pedido con menos fricci\u00f3n.',
    },
    {
      icon: 'palette' as const,
      title: 'Personalizaci\u00f3n real',
      copy: 'Elige color, talla, ubicaci\u00f3n del dise\u00f1o, texto o arte dentro de un flujo claro y f\u00e1cil de usar.',
    },
    {
      icon: 'store' as const,
      title: 'Hecho para vender y promocionar',
      copy: 'Desde uniformes y merch hasta r\u00f3tulos y gran formato, todo pensado para marcas, eventos y negocios.',
    },
  ],
  categories: {
    kicker: 'Compra por categor\u00eda',
    title: 'Encuentra m\u00e1s r\u00e1pido el producto ideal para tu idea',
    body:
      'Explora prendas, tazas, gorras, botellas, r\u00f3tulos y m\u00e1s, con categor\u00edas pensadas para elegir sin perder tiempo.',
    cta: 'Ver todo el cat\u00e1logo',
    cardCta: 'Ver coleccion',
  },
  featured: {
    kicker: 'Productos destacados',
    title: 'Productos estrella para marcas, eventos y regalos',
    body:
      'Descubre una selecci\u00f3n de productos que combinan buena presentaci\u00f3n, alta demanda y excelentes resultados de personalizaci\u00f3n.',
    primaryCta: 'Abrir personalizador',
    secondaryCta: 'Ver cat\u00e1logo',
    productCta: 'Personalizar ahora',
  },
  howToBuy: {
    kicker: 'C\u00f3mo comprar',
    title: 'Del dise\u00f1o al pedido en tres pasos',
    body:
      'Explora productos, personaliza tu dise\u00f1o y cotiza de forma clara, sin dar vueltas innecesarias.',
    cta: 'Comenzar ahora',
    steps: [
      {
        step: '01',
        title: 'Elige tu categor\u00eda',
        copy: 'Empieza por prendas, tazas, r\u00f3tulos o promocionales y entra r\u00e1pido a la colecci\u00f3n que necesitas.',
      },
      {
        step: '02',
        title: 'Personaliza tu producto',
        copy: 'Cambia color, talla, texto, im\u00e1genes y ubicaci\u00f3n del dise\u00f1o con vista previa m\u00e1s clara.',
      },
      {
        step: '03',
        title: 'Cotiza y realiza tu pedido',
        copy: 'Guarda tu configuraci\u00f3n, revisa el detalle y avanza con mayor seguridad hacia la compra.',
      },
    ],
  },
  finalCta: {
    kicker: 'Listo para empezar',
    title: 'Haz que tu idea se convierta en un producto que s\u00ed destaque',
    body:
      'Personaliza, cotiza y compra en un flujo m\u00e1s claro para prendas, tazas, r\u00f3tulos, regalos y productos promocionales.',
    primaryCta: 'Personalizar ahora',
    secondaryCta: 'Ver cat\u00e1logo',
    footer:
      'Sube tu dise\u00f1o, define cantidades y avanza a tu pedido con una experiencia m\u00e1s clara y profesional.',
  },
} as const;

const CATEGORY_DESCRIPTION_OVERRIDES: Record<string, string> = {
  camisetas: 'Camisetas personalizadas para marcas, equipos, eventos y regalos.',
  tazas: 'Tazas sublimadas ideales para regalo, branding y fechas especiales.',
  gorras: 'Gorras promocionales y deportivas con presencia de marca.',
  botellas: 'Botellas y tumblers personalizados para uso diario, regalos y promociones.',
  tumblers: 'Botellas y tumblers personalizados para uso diario, regalos y promociones.',
};

const FEATURED_COPY_OVERRIDES: Record<string, FeaturedCopy> = {
  'banner-publicitario-premium': {
    highlight:
      'Banners y lonas para promociones, eventos, ferias y puntos de venta que necesitan verse desde lejos.',
    body: 'Cotiza medidas reales y lleva tu dise\u00f1o a producci\u00f3n con m\u00e1s claridad.',
  },
  'taza-11oz-clasica': {
    highlight:
      'Una opci\u00f3n \u00fatil y memorable para regalos, branding y detalles corporativos.',
    body: 'Ideal para fechas especiales, kits empresariales y ventas por volumen.',
  },
  'camiseta-unisex-premium': {
    highlight:
      'Perfecta para uniformes, merch, activaciones y pedidos personalizados desde pocas piezas.',
    body: 'Una prenda vers\u00e1til con presencia limpia y buen resultado visual.',
  },
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function getHomeCategoryDescription(
  category: Pick<CatalogCategory, 'name' | 'slug' | 'description'>,
) {
  const key = normalize(category.slug || category.name);
  return CATEGORY_DESCRIPTION_OVERRIDES[key] ?? category.description ?? '';
}

export function getHomeFeaturedCopy(product: Pick<CatalogProduct, 'slug'>) {
  const key = normalize(product.slug);
  return FEATURED_COPY_OVERRIDES[key];
}
