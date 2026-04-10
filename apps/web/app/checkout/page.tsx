import { BrandProductArt, PageShell, SectionHeading } from '@printos/ui';

import { CheckoutExperience } from '../../components/checkout-experience';

export default function CheckoutPage() {
  return (
    <PageShell
      eyebrow="Checkout"
      title="Confirma tu pedido con una experiencia mas clara y confiable"
      description="Revisa tus articulos, define la entrega y convierte la personalizacion en una orden real sin salir del flujo publico."
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-card p-6">
          <SectionHeading
            eyebrow="Ultimo paso"
            title="El checkout ya se siente como un cierre comercial serio"
            description="Resumen por articulo, datos de entrega entendibles y una salida limpia al pedido real del sistema."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              'Resumen visual por articulo',
              'Entrega, notas y pago sandbox en un solo paso',
              'Salida directa a produccion real del sistema',
            ].map((item) => (
              <div className="rounded-[22px] border border-line/70 bg-white/75 px-4 py-4 text-sm leading-6 text-slate-700" key={item}>
                {item}
              </div>
            ))}
          </div>
        </article>

        <BrandProductArt badge="checkout" className="min-h-[320px]" variant="mix" />
      </section>

      <CheckoutExperience />
    </PageShell>
  );
}
