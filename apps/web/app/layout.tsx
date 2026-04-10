import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { HOME_COPY } from '../lib/home-copy';

import './globals.css';

export const metadata: Metadata = {
  title: 'SubliGo | PrintOS AI',
  description: 'Sublimacion, rotulacion, gran formato y ecommerce personalizado para SubliGo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-fog text-ink antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(88,176,219,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(252,209,34,0.14),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,241,233,0.96))]" />
          <div className="pointer-events-none absolute right-0 top-0 hidden h-[420px] w-[420px] overflow-hidden opacity-[0.06] lg:block">
            <img
              alt=""
              className="h-full w-full object-cover"
              src="/branding/Rotulacion_SubliGo_hero.jpg"
            />
          </div>

          <header className="sticky top-0 z-20 border-b border-black/8 bg-white/95 backdrop-blur">
            <div className="mx-auto w-full max-w-[1520px] px-4 py-4 sm:px-6 xl:px-8">
              <div className="hidden xl:grid xl:grid-cols-[33%_42%_25%] xl:items-center xl:gap-0">
                <div className="flex items-center justify-start pr-4">
                  <Link className="group flex w-full max-w-[520px] items-center" href="/">
                    <img
                      alt="Logo SubliGo"
                      className="block h-[76px] w-full rounded-[18px] object-cover object-left shadow-sm"
                      src="/branding/Logo_SubliGo.jpg"
                    />
                  </Link>
                </div>

                <nav className="grid w-full grid-cols-5 items-center justify-items-center text-[13px] text-slate-700">
                  <Link className="nav-link whitespace-nowrap px-2 py-1.5" href="/">
                    {HOME_COPY.header.homeNav}
                  </Link>
                  <Link className="nav-link whitespace-nowrap px-2 py-1.5" href="/catalogo">
                    {HOME_COPY.header.catalogNav}
                  </Link>
                  <Link
                    className="nav-link whitespace-nowrap px-2 py-1.5"
                    href="/productos/camiseta-unisex-premium"
                  >
                    {HOME_COPY.header.designNav}
                  </Link>
                  <Link className="nav-link whitespace-nowrap px-2 py-1.5" href="/#como-funciona">
                    {HOME_COPY.header.howItWorksNav}
                  </Link>
                  <Link className="nav-link whitespace-nowrap px-2 py-1.5" href="/#categorias">
                    {HOME_COPY.header.categoriesNav}
                  </Link>
                </nav>

                <div className="grid w-full grid-cols-2 items-center justify-end gap-3 pl-4">
                  <Link
                    className="brand-button-secondary w-full max-w-[190px] justify-self-end px-3 py-2.5 text-[14px]"
                    href="/cuenta"
                  >
                    {HOME_COPY.header.loginCta}
                  </Link>
                  <Link
                    className="brand-button w-full max-w-[190px] justify-self-end px-3 py-2.5 text-[14px]"
                    href="/productos/camiseta-unisex-premium"
                  >
                    {HOME_COPY.header.primaryCta}
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 xl:hidden">
                <Link className="group flex w-full min-w-0 items-center" href="/">
                  <img
                    alt="Logo SubliGo"
                    className="h-16 w-full object-contain object-left"
                    src="/branding/Logo_SubliGo.jpg"
                  />
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <Link className="nav-link" href="/">
                    {HOME_COPY.header.homeNav}
                  </Link>
                  <Link className="nav-link" href="/catalogo">
                    {HOME_COPY.header.catalogNav}
                  </Link>
                  <Link className="nav-link" href="/productos/camiseta-unisex-premium">
                    {HOME_COPY.header.designNav}
                  </Link>
                  <Link className="nav-link" href="/#como-funciona">
                    {HOME_COPY.header.howItWorksNav}
                  </Link>
                  <Link className="nav-link" href="/#categorias">
                    {HOME_COPY.header.categoriesNav}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link className="brand-button-secondary px-5 py-3" href="/cuenta">
                    {HOME_COPY.header.loginCta}
                  </Link>
                  <Link className="brand-button px-6 py-3" href="/productos/camiseta-unisex-premium">
                    {HOME_COPY.header.primaryCta}
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
