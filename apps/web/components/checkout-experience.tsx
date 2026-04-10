'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { BrandProductArt, SectionHeading } from '@printos/ui';

import { getProductVisual } from '../lib/brand-visuals';
import { summarizeCart, useCartStore } from '../lib/cart-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3102/api';

type CheckoutStatus = 'idle' | 'submitting' | 'success' | 'error';

type CheckoutResponse = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
};

export function CheckoutExperience() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totals = useMemo(() => summarizeCart(items), [items]);
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [completedOrder, setCompletedOrder] = useState<CheckoutResponse | null>(null);

  const handleCheckout = async () => {
    if (!items.length) return;

    setCheckoutStatus('submitting');

    try {
      const payload = {
        shippingMethod,
        shippingAddress:
          shippingMethod === 'delivery'
            ? {
                contactName,
                contactPhone,
                addressLine1: address,
              }
            : {
                contactName,
                contactPhone,
                pickupLocation: 'SubliGo',
              },
        customerNotes,
        paymentProvider: 'STRIPE',
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          designSessionId: item.designSessionId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          widthMeters: item.widthMeters,
          heightMeters: item.heightMeters,
          surfaces: item.surfaces,
          configuration: item.configuration,
        })),
      };

      const response = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Checkout fallido: ${await response.text()}`);
      }

      const order = (await response.json()) as CheckoutResponse;
      setCompletedOrder(order);
      clearCart();
      setCheckoutStatus('success');
    } catch (error) {
      console.error('Error en checkout:', error);
      setCheckoutStatus('error');
    }
  };

  if (completedOrder) {
    return (
      <section className="glass-card p-6">
        <SectionHeading
          eyebrow="Pedido confirmado"
          title="Tu configuracion ya se convirtio en una orden real del sistema."
          description="El checkout registro el pedido, mantuvo el diseno asociado y lo dejo listo para seguimiento desde tu cuenta."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Orden</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {completedOrder.orderNumber}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Estado</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{completedOrder.status}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Pago</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {completedOrder.paymentStatus}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="brand-button" href="/cuenta">
            Ver mi cuenta
          </Link>
          <Link className="brand-button-secondary" href="/catalogo">
            Seguir comprando
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          El seguimiento interno de produccion sigue conectado, pero la experiencia del cliente se mantiene enfocada en compra y estado del pedido.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="glass-card p-6">
        <SectionHeading
          eyebrow="Resumen del pedido"
          title="Revisa cada pieza antes de confirmar la compra."
          description="Cada articulo llega desde el design lab con su configuracion, sesion de diseno y precio calculado sobre datos reales."
        />
        <div className="mt-6 space-y-3">
          {items.length ? (
            items.map((item) => {
              const visual = getProductVisual({
                category: item.productName,
                name: item.productName,
                slug: item.productSlug,
              });

              return (
                <div
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                  key={item.id}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 h-28 overflow-hidden rounded-[20px]">
                        <BrandProductArt
                          badge={visual.badge}
                          className="h-full rounded-[20px] border-0 shadow-none"
                          variant={visual.variant}
                        />
                      </div>
                      <p className="font-semibold text-slate-950">{item.productName}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="brand-chip">{item.quantity} unidad(es)</span>
                        {item.variantName ? <span className="brand-chip">{item.variantName}</span> : null}
                        {item.selectedColor ? <span className="brand-chip">{item.selectedColor}</span> : null}
                        {item.selectedSize ? <span className="brand-chip">Talla {item.selectedSize}</span> : null}
                        {item.widthMeters && item.heightMeters ? (
                          <span className="brand-chip">
                            {item.widthMeters} x {item.heightMeters} m
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        SKU base: {item.productSku}
                        {item.designSessionId
                          ? ` - sesion ${item.designSessionId.slice(0, 8)}...`
                          : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-950">L {item.lineTotal.toFixed(2)}</p>
                      <button
                        className="mt-2 text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-4"
                        onClick={() => removeItem(item.id)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600">
              Tu carrito esta vacio. Vuelve al catalogo, personaliza un producto y luego regresa aqui.
            </div>
          )}
        </div>
      </article>

      <aside className="glass-card p-6">
        <SectionHeading
          eyebrow="Entrega y pago"
          title="Confirma datos de entrega y cierra la compra con claridad."
          description="Esta experiencia mantiene el enfoque comercial: menos campos innecesarios, mas contexto y una salida limpia a la orden."
        />

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Metodo de entrega</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'pickup' as const, label: 'Retiro en tienda' },
                { value: 'delivery' as const, label: 'Envio local' },
              ].map((option) => (
                <button
                  className={`rounded-full border px-4 py-3 text-sm font-medium ${
                    shippingMethod === option.value
                      ? 'border-accent bg-white text-slate-950'
                      : 'border-line/70 bg-white/75 text-slate-600'
                  }`}
                  key={option.value}
                  onClick={() => setShippingMethod(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Nombre de contacto</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              onChange={(event) => setContactName(event.target.value)}
              value={contactName}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Telefono</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              onChange={(event) => setContactPhone(event.target.value)}
              value={contactPhone}
            />
          </label>

          {shippingMethod === 'delivery' ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Direccion</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                onChange={(event) => setAddress(event.target.value)}
                value={address}
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Notas</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              onChange={(event) => setCustomerNotes(event.target.value)}
              placeholder="Indicaciones de entrega, color base, prioridad, etc."
              value={customerNotes}
            />
          </label>
        </div>

        <div className="mt-6 rounded-[28px] bg-slate-950 p-6 text-white shadow-ambient">
          <p className="text-sm text-white/60">Total estimado</p>
          <p className="mt-3 text-4xl font-semibold">L {totals.total.toFixed(2)}</p>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>L {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuestos</span>
              <span>L {totals.tax.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-white/70">
            El pedido se crea con su configuracion, referencia de diseno y metodo de entrega para que el equipo lo vea igual que tu lo compraste.
          </div>
          <button
            className="mt-6 w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f0bf00] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              !items.length ||
              checkoutStatus === 'submitting' ||
              !contactName.trim() ||
              !contactPhone.trim() ||
              (shippingMethod === 'delivery' && !address.trim())
            }
            onClick={handleCheckout}
            type="button"
          >
            {checkoutStatus === 'submitting'
              ? 'Procesando checkout...'
              : 'Pagar en sandbox y crear orden'}
          </button>
        </div>

        {checkoutStatus === 'error' ? (
          <p className="mt-4 text-sm font-medium text-red-500">
            No se pudo completar el checkout. Revisa que la API y la base de datos esten activas.
          </p>
        ) : null}
      </aside>
    </section>
  );
}
