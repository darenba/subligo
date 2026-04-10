export const APP_ROLES = [
  'admin',
  'manager',
  'sales',
  'designer',
  'production',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: [
    'catalog.manage',
    'crm.manage',
    'orders.manage',
    'dashboard.read',
    'users.manage',
    'production.manage',
    'whatsapp.manage',
  ],
  manager: [
    'catalog.manage',
    'crm.manage',
    'orders.manage',
    'dashboard.read',
    'production.manage',
  ],
  sales: ['crm.manage', 'quotes.manage', 'orders.read', 'dashboard.read'],
  designer: ['design.manage', 'catalog.read', 'orders.read'],
  production: ['production.manage', 'orders.read', 'dashboard.read'],
};

