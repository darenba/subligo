import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BrandProductArt } from '@printos/ui';

import { ProductPersonalizer } from '../../../components/product-personalizer';
import { getProductVisual } from '../../../lib/brand-visuals';
import { getCatalogProductBySlug, getCatalogProducts } from '../../../lib/catalog';
import { getAvailableColors, getAvailableSizes } from '../../../lib/product-options';

export const dynamic = 'force-dynamic';

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function getRelatedProducts(currentSlug: string, products: Awaited<ReturnType<typeof getCatalogProducts>>) {
  return products
    .filter((item) => item.slug !== currentSlug)
    .sort((left, right) => {
      const leftScore = normalize(`${left.slug} ${left.category}`).includes('camiseta') ? 1 : 0;
      const rightScore = normalize(`${right.slug} ${right.category}`).includes('camiseta') ? 1 : 0;
      return rightScore - leftScore;
    })
    .slice(0, 3);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const visual = getProductVisual(product);
  const allProducts = await getCatalogProducts();
  const relatedProducts = getRelatedProducts(product.slug, allProducts);
  const colors = getAvailableColors(product);
  const sizes = getAvailableSizes(product);
  const basePrice =
    product.pricingModel === 'UNIT'
      ? `L ${product.baseUnitPrice}`
      : `L ${product.pricePerSquareMeter}/m2`;

  return (
    <div className="pb-20 pt-8">
      <section className="public-container mt-6" id="design-lab">
        <ProductPersonalizer product={product} />
      </section>

      <section className="public-container mt-8">
        <div className="rounded-[34px] border border-black/8 bg-white/92 p-6 shadow-ambient lg:p-8">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Link className="transition hover:text-slate-950" href="/catalogo">
                  Catalogo
                </Link>
                <span>/</span>
                <span>{product.category}</span>
              </div>
              <span className="brand-kicker mt-5">{product.category}</span>
              <h1 className="display-title mt-5 text-4xl text-slate-950 sm:text-5xl lg:text-6xl">
                {product.name}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-9 text-slate-600">{product.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="brand-chip">Lab de diseno</span>
                <span className="brand-chip">{basePrice}</span>
                {colors.length ? <span className="brand-chip">{colors.length} color(es)</span> : null}
                {sizes.length ? <span className="brand-chip">{sizes.length} talla(s)</span> : null}
                <span className="brand-chip">{product.surfaces.length || 1} superficie(s)</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-black/8 bg-[#34380d] p-6 text-white shadow-[0_24px_50px_rgba(15,20,30,0.12)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4ff7d]">
                  Empieza aqui
                </p>
                <p className="mt-4 text-3xl font-semibold tracking-tight">
                  Entra directo a una experiencia de personalizacion mucho mas guiada.
                </p>
                <p className="mt-4 text-sm leading-7 text-white/74">{visual.promise}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a className="brand-button px-6 py-3" href="#design-lab">
                    Disenar ahora
                  </a>
                  <Link className="brand-button-secondary px-6 py-3" href="/catalogo">
                    Cambiar producto
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                  Antes de disenar
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <li>Color y talla se reflejan dentro del preview.</li>
                  <li>Frente, espalda y lateral trabajan como superficies distintas.</li>
                  <li>Texto y arte quedan guardados al pasar a carrito.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-container mt-12">
        <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
          <article className="soft-card p-8">
            <span className="brand-kicker">Por que funciona mejor</span>
            <h2 className="display-title mt-5 text-4xl text-slate-950 sm:text-5xl">
              El producto se vende con mejor contexto y no solo con un formulario.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              La pagina sigue una metodologia mucho mas cercana a un lab real: el cliente entiende la
              pieza, entra al editor y confirma una salida comercial coherente sin perder el hilo.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {visual.proofPoints.map((item) => (
                <div
                  className="rounded-[22px] border border-line/70 bg-white/82 px-4 py-4 text-sm leading-6 text-slate-700"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="brand-button" href="/checkout">
                Ir al checkout
              </Link>
              <Link className="brand-button-secondary" href="/catalogo">
                Ver otros productos
              </Link>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
            <BrandProductArt badge={visual.badge} className="min-h-[360px]" variant={visual.variant} />
            <article className="soft-card p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                Productos relacionados
              </p>
              <div className="mt-5 space-y-3">
                {relatedProducts.map((item) => {
                  const relatedVisual = getProductVisual(item);

                  return (
                    <Link
                      className="block rounded-[22px] border border-black/8 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-accent/45 hover:shadow-sm"
                      href={`/productos/${item.slug}`}
                      key={item.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="brand-chip">{item.category}</span>
                        <span className="brand-chip">
                          {item.pricingModel === 'UNIT'
                            ? `L ${item.baseUnitPrice}`
                            : `L ${item.pricePerSquareMeter}/m2`}
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                        {item.name}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {relatedVisual.promise}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
