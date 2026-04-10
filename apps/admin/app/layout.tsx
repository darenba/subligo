import type { ReactNode } from 'react';
import Link from 'next/link';

import './globals.css';
import { AdminSidebarNav } from './admin-sidebar-nav';
import { withAdminBasePath } from '../lib/base-path';

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-sand text-admin">
        <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
          <aside className="relative overflow-hidden border-b border-white/10 bg-admin px-6 py-8 text-white lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
              <img
                alt=""
                className="h-full w-full object-cover object-center"
                src={withAdminBasePath('/branding/Puerta_SubliGo_hero.jpg')}
              />
            </div>
            <div className="relative z-10">
              <Link href="/dashboard" className="block rounded-[28px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
                <div className="rounded-[20px] border border-line/[0.30] bg-white/[0.95] p-3">
                  <img
                    alt="Logo SubliGo"
                    className="h-12 w-full object-contain"
                    src={withAdminBasePath('/branding/Logo_SubliGo.jpg')}
                  />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold tracking-tight">SubliGo</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand">
                    PrintOS AI Backoffice
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/[0.72]">
                    Comercio, produccion, finanzas y ERP ligero en una sola cabina operativa.
                  </p>
                </div>
              </Link>

              <AdminSidebarNav />

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.08] p-4 text-sm text-white/[0.78] backdrop-blur">
                <p className="font-semibold text-brand">Linea visual SubliGo</p>
                <p className="mt-2 leading-6">
                  Base oscura, acento amarillo y piezas de rotulacion reales integradas al sistema.
                </p>
              </div>
            </div>
          </aside>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-52 overflow-hidden opacity-[0.08]">
              <img
                alt=""
                className="h-full w-full object-cover"
                src={withAdminBasePath('/branding/Rotulacion_SubliGo_hero.jpg')}
              />
            </div>
            <div className="relative">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
