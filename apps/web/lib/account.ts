const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3102/api';

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt?: string;
  items?: Array<{
    productionSku?: string;
    quantity?: number;
    lineTotal?: number | string;
  }>;
};

export type CustomerDesignSession = {
  id: string;
  productId: string;
  status: string;
  notes?: string | null;
  updatedAt?: string;
};

async function fetchAccountData<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Account API responded with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Fallo al consultar ${path}:`, error);
    return fallback;
  }
}

export async function getRecentOrders() {
  return fetchAccountData<CustomerOrder[]>('/orders', []);
}

export async function getSavedDesignSessions() {
  return fetchAccountData<CustomerDesignSession[]>('/design/sessions', []);
}
