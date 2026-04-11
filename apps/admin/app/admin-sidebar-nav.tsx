'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BrandIcon, type BrandIconName } from '@printos/ui';

type NavItem = {
  href: string;
  label: string;
  icon: BrandIconName;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/productos', label: 'Productos', icon: 'products' },
  { href: '/crm', label: 'CRM', icon: 'crm' },
  { href: '/campanas', label: 'Campanas', icon: 'campaigns' },
  { href: '/finanzas', label: 'Finanzas', icon: 'finances' },
  { href: '/contabilidad', label: 'Contabilidad', icon: 'accounting' },
  { href: '/facturacion', label: 'Facturacion', icon: 'billing' },
  { href: '/erp', label: 'ERP', icon: 'erp' },
  { href: '/agentes', label: 'Agentes IA', icon: 'agents' },
  { href: '/produccion', label: 'Produccion', icon: 'production' },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`group flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm font-medium transition ${
              active
                ? 'border-brand/35 bg-white/[0.14] text-white shadow-[0_0_0_1px_rgba(252,209,34,0.12)]'
                : 'border-white/10 bg-white/[0.04] text-white/[0.82] hover:border-brand/30 hover:bg-white/[0.1] hover:text-white'
            }`}
            href={item.href}
            key={item.href}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                active
                  ? 'border-brand/45 bg-brand/15 text-brand'
                  : 'border-white/10 bg-white/[0.06] text-white/[0.72] group-hover:border-brand/25 group-hover:text-brand'
              }`}
            >
              <BrandIcon className="h-5 w-5" name={item.icon} />
            </span>
            <span className="flex-1">{item.label}</span>
            <span
              className={`h-2.5 w-2.5 rounded-full transition ${
                active ? 'bg-brand shadow-[0_0_0_4px_rgba(252,209,34,0.14)]' : 'bg-white/15'
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
