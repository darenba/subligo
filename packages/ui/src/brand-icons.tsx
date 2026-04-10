import type { SVGProps } from 'react';

type IconName =
  | 'dashboard'
  | 'products'
  | 'crm'
  | 'campaigns'
  | 'finances'
  | 'accounting'
  | 'billing'
  | 'erp'
  | 'agents'
  | 'production'
  | 'palette'
  | 'support'
  | 'delivery'
  | 'proof'
  | 'store'
  | 'rocket';

type BrandIconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

function BaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    />
  );
}

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <rect height="7" rx="2" width="8" x="3" y="3" />
      <rect height="11" rx="2" width="8" x="13" y="3" />
      <rect height="9" rx="2" width="8" x="3" y="12" />
      <rect height="5" rx="2" width="8" x="13" y="16" />
    </BaseIcon>
  );
}

function ProductsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" />
      <path d="M4 7.5V16l8 4 8-4V7.5" />
      <path d="M12 11v9" />
    </BaseIcon>
  );
}

function CrmIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19c.8-2.7 3.1-4.5 5-4.5s4.2 1.8 5 4.5" />
      <circle cx="17.5" cy="9.5" r="2.5" />
      <path d="M15.5 19c.6-1.9 2.1-3.2 4-3.5" />
    </BaseIcon>
  );
}

function CampaignsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 13V7.5a1.5 1.5 0 0 1 2.1-1.4L18 11a1.5 1.5 0 0 1 0 2.8L6.1 18.9A1.5 1.5 0 0 1 4 17.5V13Z" />
      <path d="m9 18 1.5 3" />
    </BaseIcon>
  );
}

function FinancesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 17 9 12l3 3 7-8" />
      <path d="M18 7h1.5A1.5 1.5 0 0 1 21 8.5V10" />
      <path d="M5 21h14" />
    </BaseIcon>
  );
}

function AccountingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <rect height="16" rx="2" width="14" x="5" y="4" />
      <path d="M9 8h6" />
      <path d="M9 12h2" />
      <path d="M13 12h2" />
      <path d="M9 16h6" />
    </BaseIcon>
  );
}

function BillingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M7 4h10a2 2 0 0 1 2 2v12l-3-1.5-2 1.5-2-1.5-2 1.5-2-1.5L5 18V6a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </BaseIcon>
  );
}

function ErpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <rect height="6" rx="2" width="6" x="3" y="4" />
      <rect height="6" rx="2" width="6" x="15" y="4" />
      <rect height="6" rx="2" width="6" x="9" y="14" />
      <path d="M6 10v2a2 2 0 0 0 2 2h4" />
      <path d="M18 10v2a2 2 0 0 1-2 2h-4" />
    </BaseIcon>
  );
}

function AgentsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <rect height="10" rx="3" width="12" x="6" y="8" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <circle cx="10" cy="13" fill="currentColor" r="1" stroke="none" />
      <circle cx="14" cy="13" fill="currentColor" r="1" stroke="none" />
      <path d="M10 16c1.1.8 2.9.8 4 0" />
    </BaseIcon>
  );
}

function ProductionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M5 18v-4l4-2 3 2 4-7 3 1v10" />
      <path d="M3 20h18" />
      <path d="M9 12V8" />
    </BaseIcon>
  );
}

function PaletteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4c-4.8 0-8 3.4-8 7.7C4 16.2 7 20 11.2 20h.9c1.2 0 2-.8 2-1.8 0-.7-.3-1.2-.3-1.8 0-1.1.9-1.8 2-1.8H17c3 0 5-2.1 5-5.4C22 6.5 17.9 4 12 4Z" />
      <circle cx="7.5" cy="11" fill="currentColor" r="1" stroke="none" />
      <circle cx="10.5" cy="8.5" fill="currentColor" r="1" stroke="none" />
      <circle cx="14" cy="8.5" fill="currentColor" r="1" stroke="none" />
      <circle cx="17" cy="11" fill="currentColor" r="1" stroke="none" />
    </BaseIcon>
  );
}

function SupportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M6 10a6 6 0 0 1 12 0" />
      <rect height="5" rx="2" width="4" x="4" y="10" />
      <rect height="5" rx="2" width="4" x="16" y="10" />
      <path d="M8 18c1 1 2.4 1.5 4 1.5h2" />
      <rect height="3" rx="1.5" width="4" x="12" y="17" />
    </BaseIcon>
  );
}

function DeliveryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7h10v8H3z" />
      <path d="M13 10h4l3 3v2h-7" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </BaseIcon>
  );
}

function ProofIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8 3.7-4.3" />
    </BaseIcon>
  );
}

function StoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M5 10h14l-1-5H6l-1 5Z" />
      <path d="M6 10v8h12v-8" />
      <path d="M10 18v-5h4v5" />
    </BaseIcon>
  );
}

function RocketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M14 4c3.5 1 6 4.7 6 8.5-3.8 0-7.5 2.5-8.5 6-2.2-1.5-4-3.3-5.5-5.5 1.5-1.6 3.3-3.3 6-5.5 1.1-1.1 2-2.2 2-3.5Z" />
      <path d="M9 15 5 19" />
      <path d="M8 8 4 12" />
      <circle cx="15.5" cy="8.5" fill="currentColor" r="1.2" stroke="none" />
    </BaseIcon>
  );
}

const ICONS: Record<IconName, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  dashboard: DashboardIcon,
  products: ProductsIcon,
  crm: CrmIcon,
  campaigns: CampaignsIcon,
  finances: FinancesIcon,
  accounting: AccountingIcon,
  billing: BillingIcon,
  erp: ErpIcon,
  agents: AgentsIcon,
  production: ProductionIcon,
  palette: PaletteIcon,
  support: SupportIcon,
  delivery: DeliveryIcon,
  proof: ProofIcon,
  store: StoreIcon,
  rocket: RocketIcon,
};

export function BrandIcon({ name, className, ...props }: BrandIconProps) {
  const Icon = ICONS[name];
  return <Icon className={className} {...props} />;
}

export type { IconName as BrandIconName };
