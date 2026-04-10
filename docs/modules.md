# Modulos

## Aplicaciones

- `web`: landing, catalogo, producto, personalizador, carrito, checkout, cuenta.
- `admin`: dashboard, catalogo maestro, CRM, campanas, agentes, produccion, finanzas, contabilidad, facturacion y ERP.
- `api`: auth, catalogo, design, pricing, orders, crm, dashboard, billing, agents, whatsapp, audit.

## Estado actual de implementacion

- `api/auth`: registro, login JWT, perfil y roles base.
- `api/catalog`: listado, categorias y detalle por slug con datos reales y reglas de pricing asociadas.
- `api/pricing`: cotizacion dual por unidad y por area con logica compartida.
- `api/design`: creacion y actualizacion de sesiones, mas exportacion inicial de arte.
- `api/design`: creacion y actualizacion de sesiones, upload de assets y persistencia de arte.
- `api/orders`: checkout sandbox, pagos internos, arte local y promocion automatica a produccion.
- `api/crm`: leads, cambio de etapa y cotizaciones.
- `api/dashboard`: resumen de ventas, leads abiertos, pedidos retrasados, margen bajo, inteligencia comercial, finanzas operativas y lectura contable inicial.
- `api/billing`: overview documental, listado de facturas y acciones de emision/envio.
- `api/agents`: registro de agentes, corridas, hallazgos, review queue, prompts, senales persistidas y recomendaciones aprobables para Fase 2, incluyendo tareas generadas por aprobacion humana.
- `api/whatsapp`: verificacion de webhook y recepcion de mensajes entrantes.
- `web`: landing, catalogo con datos reales, pagina de producto con personalizador, upload de assets, carrito persistente y checkout sandbox.
- `admin`: dashboard, campanas, produccion, finanzas, contabilidad, facturacion, ERP, CRM, agentes y catalogo conectados a datos reales via API.

## Dominios de Fase 1

- Auth y RBAC
- Catalogo y pricing dual
- Personalizador y artes
- Ecommerce y checkout sandbox
- Produccion
- CRM y leads
- WhatsApp inbound
- Dashboard con datos reales

## Dependencias

- `packages/shared` expone tipos y reglas puras.
- `packages/database` define persistencia, seeds y acceso Prisma.
- `packages/ui` ofrece componentes reutilizables a `web` y `admin`.
- `packages/ai-agents` concentra el registro inicial de agentes, prompts y guardrails para la Fase 2.
