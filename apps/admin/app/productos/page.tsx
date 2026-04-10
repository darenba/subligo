import { PageShell, SectionHeading } from '@printos/ui';

import {
  getCatalogAdminCategories,
  getCatalogAdminProducts,
} from '../../lib/backoffice';
import { CatalogAdminManager } from './catalog-admin-manager';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    getCatalogAdminCategories(),
    getCatalogAdminProducts(),
  ]);

  return (
    <PageShell
      eyebrow="Catalogo maestro"
      title="Categorias y productos"
      description="Administra el catalogo comercial real: familias, productos, imagenes, copys, variantes y reglas de precio."
    >
      <section className="admin-card">
        <SectionHeading
          title="Backoffice de catalogo"
          description="Desde aqui puedes crear, editar, archivar o eliminar categorias y productos sin tocar codigo, manteniendo la misma fuente de verdad que consume la web publica."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm text-slate-500">Categorias registradas</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{categories.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm text-slate-500">Productos cargados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm text-slate-500">En home</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {products.filter((product) => product.featured).length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm text-slate-500">Archivados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {products.filter((product) => !product.active).length}
            </p>
          </div>
        </div>
      </section>

      <CatalogAdminManager
        initialCategories={categories}
        initialProducts={products}
      />
    </PageShell>
  );
}
