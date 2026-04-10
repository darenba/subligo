import Link from 'next/link';

import { BrandIcon, BrandProductArt } from '@printos/ui';

import { ShirtShowcaseCarousel } from '../components/shirt-showcase-carousel';
import { getCategoryVisual, getProductVisual } from '../lib/brand-visuals';
import { getCatalogHomeContent, getCatalogProducts } from '../lib/catalog';
import { HOME_COPY, getHomeCategoryDescription, getHomeFeaturedCopy } from '../lib/home-copy';

export const dynamic = 'force-dynamic';

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export default async function HomePage() {
  const [homeContent, fallbackProducts] = await Promise.all([
    getCatalogHomeContent(),
    getCatalogProducts(),
  ]);
  const homeCategories = homeContent.categories.slice(0, 4);
  const featuredProducts = (homeContent.featuredProducts.length
    ? homeContent.featuredProducts
    : fallbackProducts.filter((product) => product.featured || normalize(product.slug).includes('camiseta'))
  ).slice(0, 4);

  const heroProduct =
    featuredProducts.find((item) => normalize(item.slug).includes('camiseta')) ??
    featuredProducts[0] ??
    fallbackProducts[0];

  const heroVisual = heroProduct ? getProductVisual(heroProduct) : null;

  return (
    <div className="pb-20">
      <section className="mx-auto w-full max-w-[1520px] px-4 pt-6 sm:px-6 xl:px-8">
        <div className="overflow-hidden rounded-[42px] bg-[#34380d] text-white shadow-ambient">
          <div className="grid items-stretch gap-6 px-6 py-8 lg:grid-cols-[0.84fr_1.16fr] lg:px-10 lg:py-10 xl:gap-8 xl:px-12 xl:py-12">
            <div className="flex max-w-[620px] flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4ff7d]">
                {HOME_COPY.hero.kicker}
              </span>
              <h1 className="mt-5 max-w-[10ch] text-4xl font-semibold leading-[0.94] tracking-[-0.05em] sm:text-5xl lg:text-[4.3rem] xl:text-[5rem]">
                {HOME_COPY.hero.title}
              </h1>
              <p className="mt-5 max-w-[560px] text-base leading-8 text-white/78">
                {HOME_COPY.hero.body}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="brand-button px-6 py-3.5 text-[15px]"
                  href={heroProduct ? `/productos/${heroProduct.slug}` : '/catalogo'}
                >
                  {HOME_COPY.hero.primaryCta}
                </Link>
                <Link className="brand-button-secondary px-6 py-3.5 text-[15px]" href="/catalogo">
                  {HOME_COPY.hero.secondaryCta}
                </Link>
              </div>
              <p className="mt-5 max-w-[560px] text-sm font-medium text-white/72">
                {HOME_COPY.hero.microcopy}
              </p>
            </div>

            <ShirtShowcaseCarousel />
          </div>

          <div className="grid gap-0 border-t border-white/10 md:grid-cols-3">
            {HOME_COPY.benefits.map((item) => (
              <article className="border-white/10 px-6 py-5 md:border-r last:border-r-0" key={item.title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/10 text-[#d4ff7d]">
                  <BrandIcon className="h-5 w-5" name={item.icon} />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-white/68">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-container mt-16" id="categorias">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="brand-kicker">{HOME_COPY.categories.kicker}</span>
            <h2 className="display-title mt-5 max-w-4xl text-4xl text-slate-950 sm:text-5xl">
              {HOME_COPY.categories.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {HOME_COPY.categories.body}
            </p>
          </div>
          <Link className="brand-button-secondary" href="/catalogo">
            {HOME_COPY.categories.cta}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeCategories.map((category) => {
            const visual = getCategoryVisual(category);

            return (
            <article className="soft-card overflow-hidden p-0" key={category.id}>
              {category.imageUrl ? (
                <div className="relative min-h-[240px] overflow-hidden bg-slate-950">
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
                  className="min-h-[240px] rounded-none border-0 shadow-none"
                  variant={visual.variant}
                />
              )}
              <div className="space-y-4 p-5">
                <p className="text-2xl font-semibold tracking-tight text-slate-950">{category.name}</p>
                <p className="text-sm leading-7 text-slate-600">
                  {getHomeCategoryDescription(category) || visual.microcopy}
                </p>
                <Link className="brand-button-secondary" href={`/catalogo?categoria=${category.slug}`}>
                  {HOME_COPY.categories.cardCta}
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="public-container mt-16">
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="soft-card flex h-full flex-col overflow-hidden p-0">
            <div className="relative h-[460px] overflow-hidden bg-slate-950 sm:h-[560px] lg:h-[660px] xl:h-[720px]">
              <img
                alt="Muestra de productos personalizados SubliGo"
                className="h-full w-full object-cover object-center"
                loading="lazy"
                src="/branding/featured-products-poster.jpg"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,20,30,0.08)_0%,rgba(15,20,30,0.02)_30%,rgba(15,20,30,0.32)_100%)]" />
            </div>
            <div className="flex min-h-[420px] flex-1 flex-col justify-end p-8 pt-16 sm:min-h-[460px] sm:p-9 sm:pt-20">
              <span className="brand-kicker">{HOME_COPY.featured.kicker}</span>
              <h2 className="display-title mt-5 text-4xl text-slate-950 sm:text-5xl">
                {HOME_COPY.featured.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                {HOME_COPY.featured.body}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  className="brand-button"
                  href={heroProduct ? `/productos/${heroProduct.slug}` : '/catalogo'}
                >
                  {HOME_COPY.featured.primaryCta}
                </Link>
                <Link className="brand-button-secondary" href="/catalogo">
                  {HOME_COPY.featured.secondaryCta}
                </Link>
              </div>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            {featuredProducts.map((product) => {
              const visual = getProductVisual(product);
              const featuredCopy = getHomeFeaturedCopy(product);

              return (
                <article className="soft-card overflow-hidden p-0" key={product.id}>
                  {product.imageUrl ? (
                    <div className="relative min-h-[230px] overflow-hidden bg-slate-950">
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
                      className="min-h-[230px] rounded-none border-0 shadow-none"
                      variant={visual.variant}
                    />
                  )}
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="brand-chip">{product.category}</span>
                      <span className="brand-chip">
                        {product.pricingModel === 'UNIT'
                          ? `Desde L ${product.baseUnitPrice}`
                          : `Desde L ${product.pricePerSquareMeter}/m2`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {product.name}
                      </h3>
                      <p className="text-sm font-medium text-accent">
                        {featuredCopy?.highlight ?? visual.headline}
                      </p>
                      <p className="text-sm leading-7 text-slate-600">
                        {featuredCopy?.body ?? visual.promise}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {visual.useCases.slice(0, 3).map((item) => (
                        <span className="brand-chip" key={item}>
                          {item}
                        </span>
                      ))}
                    </div>
                    <Link className="brand-button-secondary" href={`/productos/${product.slug}`}>
                      {HOME_COPY.featured.productCta}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="public-container mt-16" id="como-funciona">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="brand-kicker">{HOME_COPY.howToBuy.kicker}</span>
            <h2 className="display-title mt-5 max-w-4xl text-4xl text-slate-950 sm:text-5xl">
              {HOME_COPY.howToBuy.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {HOME_COPY.howToBuy.body}
            </p>
          </div>
          <Link
            className="brand-button-secondary"
            href={heroProduct ? `/productos/${heroProduct.slug}` : '/catalogo'}
          >
            {HOME_COPY.howToBuy.cta}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {HOME_COPY.howToBuy.steps.map((item) => (
            <article className="signal-card" key={item.step}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                Paso {item.step}
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-container mt-16">
        <div className="rounded-[38px] bg-slate-950 px-8 py-10 text-white shadow-ambient lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand/82">
                {HOME_COPY.finalCta.kicker}
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                {HOME_COPY.finalCta.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/70">
                {HOME_COPY.finalCta.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="brand-button px-7 py-4 text-base"
                href={heroProduct ? `/productos/${heroProduct.slug}` : '/catalogo'}
              >
                {HOME_COPY.finalCta.primaryCta}
              </Link>
              <Link
                className="brand-button-secondary border-white/10 bg-white/10 px-7 py-4 text-base text-white hover:text-brand"
                href="/catalogo"
              >
                {HOME_COPY.finalCta.secondaryCta}
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm leading-7 text-white/70">{HOME_COPY.finalCta.footer}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
