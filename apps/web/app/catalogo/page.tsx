import Link from 'next/link';

import { BrandIcon, BrandProductArt, PageShell, SectionHeading } from '@printos/ui';

import { getCategoryVisual, getProductVisual } from '../../lib/brand-visuals';
import { getCatalogCategories, getCatalogProducts } from '../../lib/catalog';
import { getAvailableColors } from '../../lib/product-options';

export const dynamic = 'force-dynamic';

const MERCH_CHANNELS = [
  {
    icon: 'palette' as const,
    title: 'Ropa y merch',
    description: 'Camisetas, tazas, tumblers y gorras para kits, eventos y regalos de marca.',
  },
  {
    icon: 'store' as const,
    title: 'Local y visibilidad',
    description:
      'Banners, rotulacion, microperforado y piezas de fachada para que el negocio se note mas.',
  },
  {
    icon: 'proof' as const,
    title: 'Compra guiada',
    description:
      'Cada card da contexto de uso, promesa, precio base y siguiente paso para reducir dudas.',
  },
];

const BUY_BY_GOAL = [
  {
    title: 'Armar una promo de calle',
    description: 'Gran formato, lonas y microperforado para empujar trafico y visibilidad.',
    href: '/productos/banner-publicitario-premium',
  },
  {
    title: 'Crear kits para equipos o eventos',
    description: 'Prendas y merch listos para onboarding, ferias y activaciones.',
    href: '/productos/camiseta-unisex-premium',
  },
  {
    title: 'Vestir un punto de venta',
    description: 'Rotulacion, vitrinas y piezas impresas para elevar la presencia del local.',
    href: '/catalogo',
  },
];

type CatalogPageProps = {
  searchParams?: {
    categoria?: string;
  };
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const activeCategorySlug = searchParams?.categoria;
  const [categories, catalogProducts] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(activeCategorySlug),
  ]);
  const highlighted = catalogProducts.slice(0, 6);

  return (
    <PageShell
      eyebrow="Catalogo"
      title="Compra por necesidad, compara mejor y entra directo al producto correcto."
      description="La experiencia del catalogo ahora sigue patrones de merchandising mas fuertes: entrada por objetivo, categorias visuales, card mas comercial y acceso directo a personalizacion y checkout."
      actions={
        <>
          <Link className="brand-button" href="/productos/camiseta-unisex-premium">
            Probar design lab
          </Link>
          <Link className="brand-button-secondary" href="/checkout">
            Ver checkout
          </Link>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="glass-card p-8">
          <span className="pill">Catalogo comercial</span>
          <h2 className="display-title mt-6 text-4xl text-slate-950 sm:text-5xl">
            Menos listado frio. Mas contexto para comprar el producto correcto.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            El catalogo se reorganizo para que se sienta mas cercano a una tienda premium del rubro:
            familias reconocibles, promesa por categoria, productos mejor presentados y salida rapida
            al laboratorio de personalizacion.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {MERCH_CHANNELS.map((item) => (
              <article className="signal-card" key={item.title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line/70 bg-slate-950 text-brand shadow-ambient">
                  <BrandIcon className="h-5 w-5" name={item.icon} />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="glass-card overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <BrandProductArt
              badge="familias SubliGo"
              className="min-h-[360px] rounded-none border-0 shadow-none"
              variant="mix"
            />
            <div className="flex flex-col justify-between gap-4 bg-slate-950 p-6 text-white">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand/85">
                  Compra por objetivo
                </p>
                <p className="mt-4 text-3xl font-semibold tracking-tight">
                  Las mejores tiendas del rubro ayudan primero a elegir la categoria y luego el SKU.
                </p>
              </div>
              <div className="space-y-3">
                {BUY_BY_GOAL.map((item) => (
                  <Link
                    className="flex items-start justify-between gap-3 rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 transition hover:border-brand/60 hover:bg-white/12"
                    href={item.href}
                    key={item.title}
                  >
                    <div>
                      <p className="font-semibold tracking-tight text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/70">{item.description}</p>
                    </div>
                    <span className="brand-chip border-white/15 bg-white/10 text-white">Ver</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Explora por linea"
          title="Categorias listas para guiar mejor la compra."
          description="Cada familia ya tiene identidad visual, descripcion clara y un punto de entrada consistente."
        />
        <div className="flex flex-wrap gap-3">
          <Link
            className={activeCategorySlug ? 'brand-button-secondary' : 'brand-button'}
            href="/catalogo"
          >
            Todas
          </Link>
          {categories.map((category) => (
            <Link
              className={
                activeCategorySlug === category.slug ? 'brand-button' : 'brand-button-secondary'
              }
              href={`/catalogo?categoria=${category.slug}`}
              key={`filter-${category.id}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => {
            const visual = getCategoryVisual(category);

            return (
            <article className="glass-card overflow-hidden p-0" key={category.id}>
              {category.imageUrl ? (
                <div className="relative min-h-[230px] overflow-hidden bg-slate-950">
                  <img
                    alt={category.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={category.imageUrl}
                  />
                  <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand shadow-ambient backdrop-blur">
                    {visual.badge}
                  </span>
                </div>
              ) : (
                <BrandProductArt
                  badge={visual.badge}
                  className="min-h-[230px] rounded-none border-0 shadow-none"
                  variant={visual.variant}
                />
              )}
              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <p className="brand-kicker">{category.name}</p>
                  <p className="text-sm leading-6 text-slate-600">{visual.microcopy}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {category.productCount} producto(s)
                  </p>
                </div>
                <Link className="brand-button-secondary" href={`/catalogo?categoria=${category.slug}`}>
                  Ver familia
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Productos destacados"
          title="Cards con mejor contexto comercial y entrada directa al configurador."
          description="Inspirado en buenas practicas del rubro: foto/arte mas fuerte, promesa clara, prueba de uso y CTA visible."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {highlighted.map((product) => {
            const visual = getProductVisual(product);
            const colors = getAvailableColors(product);

            return (
              <article className="glass-card overflow-hidden p-0" key={product.id}>
                {product.imageUrl ? (
                  <div className="relative min-h-[240px] overflow-hidden bg-slate-950">
                    <img
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      src={product.imageUrl}
                    />
                    <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand shadow-ambient backdrop-blur">
                      {visual.badge}
                    </span>
                  </div>
                ) : (
                  <BrandProductArt
                    badge={visual.badge}
                    className="min-h-[240px] rounded-none border-0 shadow-none"
                    variant={visual.variant}
                  />
                )}
                <div className="flex h-full flex-col gap-4 p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="brand-chip">{product.category}</span>
                    <span className="brand-chip">{product.pricingModel}</span>
                    {colors.length ? (
                      <span className="brand-chip">{colors.length} color(es)</span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium text-accent">{visual.headline}</p>
                    <p className="text-sm leading-6 text-slate-600">{product.description}</p>
                  </div>

                  <div className="rounded-[22px] border border-line/70 bg-white/75 px-4 py-4">
                    <p className="text-sm font-medium text-slate-800">{visual.promise}</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      {visual.proofPoints.slice(0, 3).map((item) => (
                        <li className="flex items-start gap-2" key={item}>
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {visual.useCases.map((item) => (
                      <span className="brand-chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="rounded-[22px] border border-dashed border-line/80 bg-brand/8 px-4 py-4 text-sm leading-6 text-slate-700">
                    {visual.checkoutHint}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Precio base
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {product.pricingModel === 'UNIT'
                          ? `L ${product.baseUnitPrice}`
                          : `L ${product.pricePerSquareMeter}/m2`}
                      </p>
                    </div>
                    <Link className="brand-button-secondary" href={`/productos/${product.slug}`}>
                      Personalizar
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
